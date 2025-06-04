import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { SurrealDBClient } from '../../lib/client';
import { MigrationFileProcessor, ParsedMigration } from '../../lib/migration-file';
import { resolveProjectPath } from '../../lib/project';
import { loadEnvFile, replaceEnvVars } from '../../lib/env';
import { resolveDefaultPath } from '../../lib/path-resolver';
import { tableExists, getLatestMigrationState, hasPriorMigrations } from '../../lib/migration-state';
import { reportDryRun, reportStatus } from '../../lib/migration-reporter';


// Note: If you see a TypeScript warning about 'crypto' or 'process', ensure '@types/node' is installed:
// npm install --save-dev @types/node

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
  dryRun?: boolean;
  status?: boolean;
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
    path: options.path != null ? String(options.path) : undefined,
    file: options.file != null ? String(options.file) : undefined,
    down: options.down || false,
    dryRun: options.dryRun || false,
    status: options.status || false,
    envFile: options.envFile || '.env',
    useTransactions: options.useTransactions ?? true,
    initPath: options.initPath ? replaceEnvVars(options.initPath) : process.env.MIGRATIONS_PATH || 'database'
  };

  // Validate required options
  if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
    throw new Error('Missing required configuration. Provide either through options or environment variables.');
  }

  const client = new SurrealDBClient();
  try {
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });

    // Resolve base migrations directory
    const basePath = resolveProjectPath(context, resolvedOptions.initPath);
    console.log('📁 Resolved basePath:', basePath);

    // Determine migration path
    let migrationPath = '';
    if (!resolvedOptions.path) {
      migrationPath = await resolveDefaultPath(basePath);
      const hasPrior = await hasPriorMigrations(client, migrationPath);
      if (!hasPrior) {
        console.warn('⚠️ Using default path ${migrationPath}; no prior migrations detected. Ensure previous paths were applied.');
      }
    } else {
      const subDir = await MigrationFileProcessor.findMatchingSubdirectory(basePath, resolvedOptions.path);
      if (!subDir) {
        throw new Error(`No subdirectory found matching pattern: ${resolvedOptions.path}`);
      }
      migrationPath = subDir;
    }
    const targetPath = path.join(basePath, migrationPath);
    console.log('📂 Resolved targetPath:', targetPath);

    if (resolvedOptions.status) {
      const paths = resolvedOptions.path ? [migrationPath] : await MigrationFileProcessor.listSubdirectories(basePath);
      for (const p of paths) {
        const fullPath = path.join(basePath, p);
        if ((await fs.stat(fullPath)).isDirectory()) {
          const files = await MigrationFileProcessor.filterMigrationFiles(
            await fs.readdir(fullPath),
            null,
            resolvedOptions.down ? 'down' : 'up'
          );
          console.log(`📜 Path: ${p}`);
          for (const file of files) {
            const migration = MigrationFileProcessor.parseMigrationFile(file) as ParsedMigration;
            if (!migration) continue;
            let status = 'unapplied';
            let appliedAt = 'N/A';
            const exists = await tableExists(client, 'migration_history');
            if (exists) {
              console.log("running SELECT direction, applied_at FROM migration_history WHERE migration_number = $migration.number AND migration_path = $path ORDER BY applied_at DESC LIMIT 1");
              const latest = await client.query(
                "SELECT direction, applied_at FROM migration_history WHERE migration_number = $number AND migration_path = $path ORDER BY applied_at DESC LIMIT 1",
                { number: migration.number, path: p }
              );
              status = latest[0]?.result?.[0]?.direction || 'unapplied';
              appliedAt = latest[0]?.result?.[0]?.applied_at || 'N/A';
            } else {
              console.warn('⚠️ migration_history table does not exist. Reporting all migrations as unapplied.');
            }
            reportStatus(p, migration, status, appliedAt);
          }
        }
      }
      return { success: true };
    }

    console.log('🔍 Looking for files in:', targetPath);
    const allFiles = await fs.readdir(targetPath);
    console.log('📋 Found files:', allFiles);
    const files = resolvedOptions.file
      ? [resolvedOptions.file]
      : MigrationFileProcessor.filterMigrationFiles(allFiles, null, resolvedOptions.down ? 'down' : 'up');

    if (files.length === 0) {
      throw new Error(`No migration files found in: ${targetPath}${resolvedOptions.file ? ` matching pattern: ${resolvedOptions.file}` : ''}`);
    }

    console.log(`📊 Found ${files.length} initialization file(s)`);

    for (const file of files) {
      console.log(`🛠️ Processing ${file}...`);
      const filePath = path.join(targetPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const migration = MigrationFileProcessor.parseMigrationFile(file) as ParsedMigration;
      if (!migration) {
        throw new Error(`Invalid migration file format: ${file}`);
      }

      const lastDirection = await getLatestMigrationState(client, migration.number, migrationPath);
      const direction = resolvedOptions.down ? 'down' : 'up';

      if (lastDirection && lastDirection === direction) {
        throw new Error(`Cannot apply ${direction} migration; latest state is already ${direction}`);
      }

      if (resolvedOptions.dryRun) {
        reportDryRun(file, direction);
        continue;
      }

      const processedContent = MigrationFileProcessor.processContent(content, {
        defaultNamespace: resolvedOptions.namespace,
        defaultDatabase: resolvedOptions.database,
        useTransactions: resolvedOptions.useTransactions ?? true
      });

      // Compute checksum
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      // Measure execution time using process.hrtime.bigint() for Node.js compatibility
      const startTime = process.hrtime.bigint();
      console.log(`🚀 Executing queries from ${file}`);
      await client.query(processedContent);
      const executionTimeNs = Number(process.hrtime.bigint() - startTime);
      const executionTimeMs = Math.round(executionTimeNs / 1_000_000); // Convert nanoseconds to milliseconds

      // Insert migration_history record using parameters
      const migrationRecordQuery = `
        CREATE migration_history SET
          migration_number = $number,
          migration_name = $name,
          migration_file = $file,
          migration_path = $path,
          namespace = $namespace,
          database = $database,
          direction = $direction,
          applied_at = time::now(),
          applied_by = $user,
          checksum = $checksum,
          execution_time_ms = $executionTimeMs,
          content = $content;
      `;
      await client.query(migrationRecordQuery, {
        number: migration.number,
        name: migration.name,
        file: file,
        path: migrationPath,
        namespace: resolvedOptions.namespace || 'unknown',
        database: resolvedOptions.database || 'unknown',
        direction: direction,
        user: resolvedOptions.user,
        checksum: checksum,
        executionTimeMs: executionTimeMs,
        content: content
      });
      console.log(`↑ Recorded migration history for ${file}`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}