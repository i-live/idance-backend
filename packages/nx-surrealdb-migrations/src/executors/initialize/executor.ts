import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  SurrealDBClient,
  MigrationFileProcessor,
  MigrationTracker,
  resolveProjectPath,
  loadEnvFile,
  replaceEnvVars,
  InitializeExecutorSchema
} from '../../lib';

export default async function runExecutor(
  options: InitializeExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  loadEnvFile(context, options.envFile);

  const resolvedOptions = {
    url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL,
    user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER,
    pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS,
    namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE || 'default',
    database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE || 'default',
    path: options.path != null ? String(replaceEnvVars(String(options.path))) : undefined,
    file: options.file != null ? String(replaceEnvVars(String(options.file))) : undefined,
    down: options.down || false,
    useTransactions: options.useTransactions ?? true,
    initPath: options.initPath ? replaceEnvVars(options.initPath) : process.env.MIGRATIONS_PATH || 'database',
    schemaPath: options.schemaPath ? replaceEnvVars(options.schemaPath) : undefined,
    force: options.force || false
  };

  if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
    throw new Error('Missing required configuration. Provide either through options or environment variables.');
  }

  const basePath = resolveProjectPath(context, resolvedOptions.initPath);
  console.log('Resolved basePath:', basePath);
  let targetPath = basePath;

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
  const migrationTracker = new MigrationTracker(client, resolvedOptions.schemaPath);

  try {
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });
    console.log('Connected to SurrealDB');

    await migrationTracker.initialize();

    const allFiles = await fs.readdir(targetPath);
    console.log('Found files:', allFiles);
    const files = MigrationFileProcessor.filterMigrationFiles(
      allFiles,
      resolvedOptions.file,
      resolvedOptions.down ? 'down' : 'up'
    );

    if (files.length === 0) {
      throw new Error(`No migration files found in: ${targetPath}${resolvedOptions.file ? ` matching pattern: ${resolvedOptions.file}` : ''}`);
    }

    console.log(`Found ${files.length} initialization file(s)`);

    let skippedCount = 0;
    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(targetPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const processedContent = MigrationFileProcessor.processContent(content, {
        defaultNamespace: resolvedOptions.namespace,
        defaultDatabase: resolvedOptions.database,
        useTransactions: resolvedOptions.useTransactions ?? true
      });

      const fileParts = file.match(/^(\d+)_(.+)_(up|down)\.surql$/);
      if (!fileParts) {
        throw new Error(`Invalid migration file name format: ${file}. Expected <number>_<name>_<up|down>.surql`);
      }
      const [, number, name, direction] = fileParts;

      // Check if migration can be applied
      if (!resolvedOptions.force) {
        const { canApply, reason } = await migrationTracker.canApplyMigration(
          number, name,
          direction as 'up' | 'down'
        );
        if (!canApply) {
          console.warn(`WARNING: ${reason} Use --force to override.`);
          skippedCount++;
          continue;
        }
      }

      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      console.log(`Executing queries from ${file}`);
      const startTime = performance.now();
      let executionTimeMs = 0;
      let status: 'success' | 'fail' = 'success';

      try {
        await client.query(processedContent);
        executionTimeMs = Math.round(performance.now() - startTime);
      } catch (error) {
        executionTimeMs = Math.round(performance.now() - startTime);
        status = 'fail';
        await migrationTracker.addMigration({
          number,
          name,
          direction: direction as 'up' | 'down',
          filename: file,
          path: targetPath,
          content,
          namespace: resolvedOptions.namespace,
          database: resolvedOptions.database,
          checksum,
          status,
          execution_time_ms: executionTimeMs
        });
        throw new Error(`Failed to execute migration ${file}: ${error.message}`);
      }

      await migrationTracker.addMigration({
        number,
        name,
        direction: direction as 'up' | 'down',
        filename: file,
        path: targetPath,
        content,
        namespace: resolvedOptions.namespace,
        database: resolvedOptions.database,
        checksum,
        status,
        execution_time_ms: executionTimeMs
      });
      console.log(`Recorded migration ${number}_${name} in system_migrations (execution time: ${executionTimeMs}ms)`);
    }

    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} migration(s) due to state conflicts. Use --force to override.`);
    }

    return { success: true };
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}