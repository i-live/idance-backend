import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  SurrealDBClient,
  MigrationFileProcessor,
  MigrationTracker,
  resolveProjectPath,
  loadEnvFile,
  replaceEnvVars
} from '../../lib';

export interface InitializeExecutorSchema {
  url: string;
  user: string;
  pass: string;
  namespace?: string;
  database?: string;
  path?: string | number;
  file?: string | number;
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
    file: options.file != null ? String(replaceEnvVars(String(options.file))) : undefined,
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
    const subDir = await MigrationFileProcessor.findMatchingSubdirectory(
      basePath,
      resolvedOptions.path
    );
    if (!subDir) {
      throw new Error(`No subdirectory found matching pattern: ${resolvedOptions.path}`);
    }
    targetPath = path.join(basePath, subDir);
    console.log('Resolved targetPath:', targetPath);
  }

  console.log('Looking for files in:', targetPath);

  const client = new SurrealDBClient();
  const migrationTracker = new MigrationTracker(client);

  try {

    // Find all files in the target directory
    const allFiles = await fs.readdir(targetPath);
    console.log('Found files:', allFiles);
    const files = MigrationFileProcessor.filterMigrationFiles(
      allFiles,
      resolvedOptions.file, // Pass file pattern
      resolvedOptions.down ? 'down' : 'up'
    );

    if (files.length === 0) {
      throw new Error(`No migration files found in: ${targetPath}${resolvedOptions.file ? ` matching pattern: ${resolvedOptions.file}` : ''}`);
    }

    console.log(`Found ${files.length} initialization file(s)`);

    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });
    // Initialize the migration history table
    await migrationTracker.initialize();

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(targetPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const processedContent = MigrationFileProcessor.processContent(content, {
        defaultNamespace: resolvedOptions.namespace,
        defaultDatabase: resolvedOptions.database,
        useTransactions: resolvedOptions.useTransactions ?? true
      });

      // Extract migration number and name from file (assuming format like 001_init_migration.up.surql)
      const fileParts = file.match(/^(\d+)_(.+)(up|down)\.surql$/);
      if (!fileParts) {
        throw new Error(`Invalid migration file name format: ${file}. Expected <number>_<name>.<up|down>.surql`);
      }
      const [, number, name, direction] = fileParts;

      // Compute checksum of file content
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      console.log(`Executing queries from ${file}`);
      let executionTimeMs: number | null = null;
      try {
        const startTime = performance.now();
        await client.query(processedContent);
        executionTimeMs = Math.round(performance.now() - startTime); // Round to nearest integer

        // Record the migration in migration_history
        await migrationTracker.addMigration({
          number,
          name,
          direction: direction as 'up' | 'down',
          filename: file,
          path: targetPath,
          content,
          checksum,
          status: 'success',
          applied_by: process.env.USER || 'nx-plugin',
          execution_time_ms: executionTimeMs // You can measure execution time if needed
        });
        console.log(`Recorded migration ${number}_${name} in migration_history`);
      } catch (error) {
        // Record failed migration
        await migrationTracker.addMigration({
          number,
          name,
          direction: direction as 'up' | 'down',
          filename: file,
          path: targetPath,
          content,
          checksum,
          status: 'fail',
          applied_by: process.env.USER || 'nx-plugin',
          execution_time_ms: executionTimeMs
        });
        throw new Error(`Failed to execute migration ${file}: ${error.message}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}