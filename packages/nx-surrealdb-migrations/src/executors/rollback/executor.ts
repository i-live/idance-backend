import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationService } from '../../lib/domain/migration-service';
import { Debug } from '../../lib/infrastructure/debug';

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
  const service = new MigrationService(context);
  const debug = Debug.scope('rollback-executor');

  // Enable debug mode if requested
  Debug.setEnabled(!!options.debug);

  try {
    // Service already initialized above

    // Determine target modules  
    const rawTargetModules = options.module ? [String(options.module)] : undefined;
    debug.log(`Raw target modules: ${rawTargetModules ? rawTargetModules.join(', ') : 'all'}`);

    // Initialize migration service first
    await service.initialize({
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
      debug: options.debug,
      dryRun: options.dryRun || false
    });

    // Now resolve target modules to full names (e.g., "010" -> "010_auth")
    const resolvedTargetModules = rawTargetModules ? service.resolveTargetModules(rawTargetModules) : undefined;
    debug.log(`Resolved target modules: ${resolvedTargetModules ? resolvedTargetModules.join(', ') : 'all'}`);

    // First, validate rollback safety unless force is enabled
    if (!options.force && rawTargetModules) {
      logger.info('🔍 Validating rollback safety...');
      
      const validation = await service.validateRollback(rawTargetModules);
      
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

    // Execute rollback migrations
    if (options.dryRun) {
      logger.info('🔍 Dry run mode - showing rollback migrations without executing them');
    }
    logger.info('🔄 Starting rollback execution...');
    
    const result = await service.executeMigrations(resolvedTargetModules, 'rollback');
    
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
    await service.close();
  }
}