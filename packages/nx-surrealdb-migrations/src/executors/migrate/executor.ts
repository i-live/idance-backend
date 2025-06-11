import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationEngine } from '../../lib/migration-engine';

export interface MigrateExecutorSchema {
  url?: string;
  user?: string;
  pass?: string;
  namespace?: string;
  database?: string;
  module?: string | number;
  envFile?: string;
  useTransactions?: boolean;
  initPath?: string;
  schemaPath?: string;
  force?: boolean;
  configPath?: string;
  dryRun?: boolean;
}

export default async function runExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const engine = new MigrationEngine(context);

  try {
    // Initialize migration engine
    await engine.initialize({
      url: options.url || '',
      user: options.user || '',
      pass: options.pass || '',
      namespace: options.namespace,
      database: options.database,
      envFile: options.envFile,
      useTransactions: options.useTransactions,
      initPath: options.initPath || 'database',
      schemaPath: options.schemaPath,
      force: options.force || false,
      configPath: options.configPath
    });

    // Determine target modules
    const targetModules = options.module ? [String(options.module)] : undefined;

    if (options.dryRun) {
      // Dry run: show what would be applied
      logger.info('🔍 Dry run mode - showing pending migrations without applying them');
      
      const pendingMigrations = await engine.findPendingMigrations(targetModules);
      
      if (pendingMigrations.length === 0) {
        logger.info('✅ No pending migrations found');
        return { success: true };
      }

      logger.info(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      for (const migration of pendingMigrations) {
        logger.info(`  • ${migration.moduleId}/${migration.filename}`);
      }

      return { success: true };
    }

    // Execute migrations
    logger.info('🚀 Starting migration execution...');
    
    const result = await engine.executeMigrations(targetModules);
    
    if (result.success) {
      logger.info(`✅ Migration completed successfully!`);
      logger.info(`   Files processed: ${result.filesProcessed}`);
      logger.info(`   Files skipped: ${result.filesSkipped}`);
      logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      
      if (result.results.length > 0) {
        logger.info('\n📊 Migration Details:');
        for (const fileResult of result.results) {
          const status = fileResult.success ? '✅' : fileResult.skipped ? '⏭️' : '❌';
          const reason = fileResult.skipped ? ` (${fileResult.skipReason})` : 
                        fileResult.error ? ` (${fileResult.error})` : '';
          logger.info(`   ${status} ${fileResult.file.moduleId}/${fileResult.file.filename}${reason}`);
        }
      }
    } else {
      logger.error('❌ Migration failed!');
      
      for (const fileResult of result.results) {
        if (!fileResult.success && !fileResult.skipped) {
          logger.error(`   ❌ ${fileResult.file.moduleId}/${fileResult.file.filename}: ${fileResult.error}`);
        }
      }
      
      logger.info(`   Files processed: ${result.filesProcessed}`);
      logger.info(`   Execution time: ${result.executionTimeMs}ms`);
    }

    return { success: result.success };

  } catch (error) {
    logger.error('💥 Migration execution failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await engine.close();
  }
}