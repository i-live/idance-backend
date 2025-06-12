import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationEngine } from '../../lib/migration-engine';
import { Debug } from '../../lib/debug';

export interface RollbackExecutorSchema {
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
  steps?: number;
  debug?: boolean;
}

export default async function runExecutor(
  options: RollbackExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const engine = new MigrationEngine(context);
  const debug = Debug.scope('rollback-executor');

  // Enable debug mode if requested
  Debug.setEnabled(!!options.debug);

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
      configPath: options.configPath,
      debug: options.debug
    });

    // Determine target modules
    const targetModules = options.module ? [String(options.module)] : undefined;
    debug.log(`Target modules: ${targetModules ? targetModules.join(', ') : 'all'}`);

    // First, validate rollback safety unless force is enabled
    if (!options.force && targetModules) {
      logger.info('🔍 Validating rollback safety...');
      
      const validation = await engine.validateRollback(targetModules);
      
      if (!validation.canRollback) {
        logger.error('❌ Rollback validation failed!');
        logger.error('   Blocked by dependencies:');
        for (const blocker of validation.blockedBy) {
          logger.error(`   • ${blocker}`);
        }
        
        if (validation.warnings.length > 0) {
          logger.error('   Warnings:');
          for (const warning of validation.warnings) {
            logger.error(`   • ${warning}`);
          }
        }
        
        logger.info('\n💡 Use --force to bypass safety checks');
        return { success: false };
      }

      if (validation.warnings.length > 0) {
        logger.warn('⚠️  Rollback warnings:');
        for (const warning of validation.warnings) {
          logger.warn(`   • ${warning}`);
        }
      }

      logger.info('✅ Rollback safety validation passed');
    }

    if (options.dryRun) {
      // Dry run: show what would be rolled back
      logger.info('🔍 Dry run mode - showing rollback migrations without executing them');
      
      const pendingRollbacks = await engine.findPendingMigrations(targetModules, 'down');
      
      if (pendingRollbacks.length === 0) {
        logger.info('✅ No rollback migrations found');
        return { success: true };
      }

      // Apply steps limit in dry run
      const stepsToShow = options.steps && options.steps > 0 
        ? pendingRollbacks.slice(0, options.steps)
        : pendingRollbacks;

      logger.info(`📋 Found ${stepsToShow.length} rollback migration(s):`);
      for (const migration of stepsToShow) {
        logger.info(`  • ${migration.moduleId}/${migration.filename}`);
      }

      if (options.steps && options.steps > 0 && pendingRollbacks.length > options.steps) {
        logger.info(`   (${pendingRollbacks.length - options.steps} additional rollbacks available)`);
      }

      return { success: true };
    }

    // Execute rollback migrations
    logger.info('🔄 Starting rollback execution...');
    
    const result = await engine.executeMigrations(targetModules, 'down');
    
    if (result.success) {
      logger.info(`✅ Rollback completed successfully!`);
      logger.info(`   Files processed: ${result.filesProcessed}`);
      logger.info(`   Files skipped: ${result.filesSkipped}`);
      logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      
      if (result.results.length > 0) {
        logger.info('\n📊 Rollback Details:');
        for (const fileResult of result.results) {
          const status = fileResult.success ? '✅' : fileResult.skipped ? '⏭️' : '❌';
          const reason = fileResult.skipped ? ` (${fileResult.skipReason})` : 
                        fileResult.error ? ` (${fileResult.error})` : '';
          logger.info(`   ${status} ${fileResult.file.moduleId}/${fileResult.file.filename}${reason}`);
        }
      }
    } else {
      logger.error('❌ Rollback failed!');
      
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
    logger.error('💥 Rollback execution failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await engine.close();
  }
}