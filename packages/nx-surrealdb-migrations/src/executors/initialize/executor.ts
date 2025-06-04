import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBClient } from '../../lib/client';
import { MigrationFileProcessor } from '../../lib/migration-file';
import { resolveProjectPath } from '../../lib/project';
import { loadEnvFile, replaceEnvVars } from '../../lib/env';

export interface InitializeExecutorSchema {
  url: string;
  user: string;
  pass: string;
  namespace?: string;
  database?: string;
  path?: string | number;
  down?: boolean;
  envFile?: string;
  useTransactions?: boolean;
  initPath?: string;
}

export default async function runExecutor(
  options: InitializeExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  // Load environment variables from the specified envFile or default to .env
  loadEnvFile(context, options.envFile);

  // Resolve options with environment variable interpolation
  const resolvedOptions = {
    url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL,
    user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER,
    pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS,
    namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE,
    database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE,
    path: options.path != null ? String(replaceEnvVars(String(options.path))) : undefined,
    down: options.down || false,
    useTransactions: options.useTransactions ?? true,
    initPath: options.initPath ? replaceEnvVars(options.initPath) : process.env.MIGRATIONS_PATH || 'database'
  };

  // Validate required options
  if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
    throw new Error('Missing required configuration. Provide either through options or environment variables.');
  }

  // Resolve base migrations directory
  const basePath = resolveProjectPath(context, resolvedOptions.initPath);
  console.log('Resolved basePath:', basePath);
  let targetPath = basePath;

  // If path is provided, resolve the subdirectory and validate it
  if (resolvedOptions.path) {
    const subDir = await MigrationFileProcessor.findMatchingSubdirectory(basePath, resolvedOptions.path);
    if (!subDir) {
      throw new Error(`No subdirectory found matching pattern: ${resolvedOptions.path}`);
    }
    targetPath = path.join(basePath, subDir);
    console.log('Resolved targetPath:', targetPath);
  }

  console.log('Looking for files in:', targetPath);

  const client = new SurrealDBClient();
  try {
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });

    // Find all files in the target directory
    const allFiles = await fs.readdir(targetPath);
    console.log('Found files:', allFiles);
    const files = MigrationFileProcessor.filterMigrationFiles(
      allFiles,
      undefined,
      resolvedOptions.down ? 'down' : 'up'
    );

    if (files.length === 0) {
      throw new Error(`No migration files found in: ${targetPath}`);
    }

    console.log(`Found ${files.length} initialization file(s)`);

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(targetPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const processedContent = MigrationFileProcessor.processContent(content, {
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