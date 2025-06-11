import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  SurrealDBClient,
  MigrationFileProcessor,
  MigrationTracker,
  loadEnvFile,
  replaceEnvVars,
} from '../../lib';
import { ModuleLoader } from '../../lib/module-loader';

export interface MigrateAppExecutorSchema {
  url?: string;
  user?: string;
  pass?: string;
  namespace?: string;
  database?: string;
  app: string;
  environment: string;
  envFile?: string;
  force?: boolean;
  schemaPath?: string;
}

export default async function runExecutor(
  options: MigrateAppExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  loadEnvFile(context, options.envFile);

  const resolvedOptions = {
    url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL,
    user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER,
    pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS,
    namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE,
    database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE,
    app: options.app,
    environment: options.environment,
    force: options.force || false,
    schemaPath: options.schemaPath ? replaceEnvVars(options.schemaPath) : undefined
  };

  if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
    throw new Error('Missing required configuration. Provide either through options or environment variables.');
  }

  if (!resolvedOptions.app || !resolvedOptions.environment) {
    throw new Error('Application name and environment are required.');
  }

  const moduleLoader = new ModuleLoader(context.root);
  const client = new SurrealDBClient();
  const migrationTracker = new MigrationTracker(client, resolvedOptions.schemaPath);

  try {
    // Load application configuration
    const appConfig = moduleLoader.loadApplicationConfig(resolvedOptions.app);
    const envConfig = appConfig.environment[resolvedOptions.environment];
    
    if (!envConfig) {
      throw new Error(`Environment '${resolvedOptions.environment}' not configured for app '${resolvedOptions.app}'`);
    }

    // Use environment-specific database config if not overridden
    const finalNamespace = resolvedOptions.namespace || envConfig.namespace;
    const finalDatabase = resolvedOptions.database || envConfig.database;

    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: finalNamespace,
      database: finalDatabase
    });

    console.log(`Connected to SurrealDB (${finalNamespace}/${finalDatabase})`);
    await migrationTracker.initialize();

    // Get migrations in dependency order
    const migrations = moduleLoader.getApplicationMigrations(resolvedOptions.app, resolvedOptions.environment);
    
    if (migrations.length === 0) {
      console.log('No migrations found for this application.');
      return { success: true };
    }

    // Check which migrations are already applied
    const appliedMigrations = await migrationTracker.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    const pendingMigrations = migrations.filter(m => !appliedIds.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log('All migrations are already applied.');
      return { success: true };
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s) for app '${resolvedOptions.app}'`);

    let skippedCount = 0;
    for (const migration of pendingMigrations) {
      console.log(`Processing ${migration.filename} (${migration.id})...`);
      
      const content = await MigrationFileProcessor.readFileContent(migration.path);
      const processedContent = MigrationFileProcessor.processContent(content, {
        defaultNamespace: finalNamespace,
        defaultDatabase: finalDatabase,
        useTransactions: true
      });

      // Parse migration details
      const fileParts = migration.filename.match(/^(.+)_(up|down)\.surql$/);
      if (!fileParts) {
        throw new Error(`Invalid migration file name format: ${migration.filename}`);
      }
      const [, baseName, direction] = fileParts;
      const [number, name] = baseName.split('_', 2);

      // Check if migration can be applied
      if (!resolvedOptions.force) {
        const { canApply, reason } = await migrationTracker.canApplyMigration(
          number, name || baseName,
          direction as 'up' | 'down'
        );
        if (!canApply) {
          console.warn(`WARNING: ${reason} Use --force to override.`);
          skippedCount++;
          continue;  
        }
      }

      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      const startTime = performance.now();
      let executionTimeMs = 0;
      let status: 'success' | 'fail' = 'success';

      try {
        await client.query(processedContent);
        executionTimeMs = Math.round(performance.now() - startTime);
        
        await migrationTracker.addMigration({
          id: migration.id,
          number,
          name: name || baseName,
          direction: direction as 'up' | 'down',
          filename: migration.filename,
          path: path.dirname(migration.path),
          content,
          namespace: finalNamespace,
          database: finalDatabase,
          checksum,
          status,
          execution_time_ms: executionTimeMs
        });

        console.log(`✓ Applied ${migration.id} (execution time: ${executionTimeMs}ms)`);
      } catch (error) {
        executionTimeMs = Math.round(performance.now() - startTime);
        status = 'fail';
        
        await migrationTracker.addMigration({
          id: migration.id,
          number,
          name: name || baseName,
          direction: direction as 'up' | 'down',
          filename: migration.filename,
          path: path.dirname(migration.path),
          content,
          namespace: finalNamespace,
          database: finalDatabase,
          checksum,
          status,
          execution_time_ms: executionTimeMs
        });

        throw new Error(`Failed to execute migration ${migration.id}: ${error.message}`);
      }
    }

    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} migration(s) due to state conflicts. Use --force to override.`);
    }

    console.log(`✓ Successfully applied ${pendingMigrations.length - skippedCount} migration(s)`);
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false };
  } finally {
    await client.close();
  }
}