import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBClient } from '../../lib/client';
import { QueryFileProcessor } from '../../lib/query-file-processor';
import { loadEnvFile } from '../../lib/env';
import { resolveProjectPath } from '../../lib/project';

export interface InitializeExecutorSchema {
  url: string;
  rootUser: string;
  rootPass: string;
  initPath?: string;
  down?: boolean;
  environments: Array<{
    name: string;
    namespaces: Array<{
      name: string;
      databases: Array<{
        name: string;
        adminUser: string;
        adminPass: string;
      }>;
    }>;
  }>;
}

export default async function runExecutor(
  options: InitializeExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  loadEnvFile(context);

  const initPath = resolveProjectPath(context, options.initPath || 'init');
  console.log('Looking for init files in:', initPath);

  // Ensure init directory exists
  try {
    await fs.access(initPath);
  } catch (error) {
    throw new Error(`Init directory not found: ${initPath}`);
  }

  const client = new SurrealDBClient();
  try {
    await client.connect({
      url: process.env.SURREALDB_URL,
      username: process.env.SURREALDB_ROOT_USER,
      password: process.env.SURREALDB_ROOT_PASS,
      namespace: undefined,
      database: undefined
    });

    // Find all files and sort them (reverse order for down migrations)
    const suffix = options.down ? '_down.surql' : '_up.surql';
    let files = (await fs.readdir(initPath))
      .filter(f => f.endsWith(suffix))
      .sort();

    // Reverse order for down migrations
    if (options.down) {
      files = files.reverse();
    }

    console.log(`Found ${files.length} initialization file(s)`);

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(initPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const processedContent = QueryFileProcessor.process(content, {
        defaultNamespace: process.env.SURREALDB_NAMESPACE,
        defaultDatabase: process.env.SURREALDB_DATABASE
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