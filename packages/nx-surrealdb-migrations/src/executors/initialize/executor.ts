import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBClient } from '../../lib/client';
import { QueryFileProcessor } from '../../lib/query-file-processor';
import { resolveProjectPath } from '../../lib/project';
import { loadEnvFile, replaceEnvVars } from '../../lib/env';

export interface InitializeExecutorSchema {
  url: string;
  user: string;
  pass: string;
  namespace?: string;
  database?: string;
  initPath?: string;
  down?: boolean;
  envFile?: string;
  useTransactions?: boolean;
}

export default async function runExecutor(
  options: InitializeExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  // Load environment variables from the specified envFile or default to .env
  loadEnvFile(context, options.envFile);

  // First interpolate any env vars in provided options, then fall back to process.env
  const resolvedOptions = {
    url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL,
    user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER,
    pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS,
    namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE,
    database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE,
    initPath: options.initPath || 'init',
    down: options.down || false,
    useTransactions: options.useTransactions ?? true
  };

  // Validate required options
  if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
    throw new Error('Missing required configuration. Provide either through options or environment variables.');
  }

  const initPath = resolveProjectPath(context, resolvedOptions.initPath);
  console.log('Looking for init files in:', initPath);

  const client = new SurrealDBClient();
  try {
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });

    // Find all files and sort them (reverse order for down migrations)
    const suffix = resolvedOptions.down ? '_down.surql' : '_up.surql';
    let files = (await fs.readdir(initPath))
      .filter(f => f.endsWith(suffix))
      .sort();

    // Reverse order for down migrations
    if (resolvedOptions.down) {
      files = files.reverse();
    }

    console.log(`Found ${files.length} initialization file(s)`);

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(initPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const processedContent = QueryFileProcessor.process(content, {
        defaultNamespace: resolvedOptions.namespace,
        defaultDatabase: resolvedOptions.database,
        useTransactions: resolvedOptions.useTransactions ?? true
      });

      console.log(`Executing queries from ${file}`);
      await client.query(processedContent);
    }

    return { success: true };
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}