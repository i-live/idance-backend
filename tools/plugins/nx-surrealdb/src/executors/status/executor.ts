import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationService } from '../../lib/domain/migration-service';
import { Debug } from '../../lib/infrastructure/debug';

export interface StatusExecutorSchema {
  url?: string;
  user?: string;
  pass?: string;
  namespace?: string;
  database?: string;
  module?: string | number;
  envFile?: string;
  initPath?: string;
  schemaPath?: string;
  configPath?: string;
  detailed?: boolean;
  json?: boolean;
  debug?: boolean;
}

interface StatusOutput {
  modules: Array<{
    moduleId: string;
    name?: string;
    appliedMigrations: number;
    pendingMigrations: number;
    lastApplied?: Date;
    dependencies: string[];
    dependents: string[];
    status: 'up-to-date' | 'pending' | 'error';
  }>;
  totalApplied: number;
  totalPending: number;
  dependencyGraph: Record<string, string[]>;
}

export default async function runExecutor(
  options: StatusExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const engine = new MigrationService(context);
  const debug = Debug.scope('status-executor');

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
      useTransactions: true, // Not needed for status, but required by interface
      initPath: options.initPath || 'database',
      schemaPath: options.schemaPath,
      force: false, // Not applicable for status
      configPath: options.configPath,
      debug: options.debug
    });

    // Determine target modules
    const targetModules = options.module ? [String(options.module)] : undefined;

    // Get migration status
    const status = await engine.getMigrationStatus(targetModules);

    if (options.json) {
      // Output JSON format
      const output: StatusOutput = {
        modules: status.modules.map(module => ({
          moduleId: module.moduleId,
          appliedMigrations: module.appliedMigrations,
          pendingMigrations: module.pendingMigrations,
          lastApplied: module.lastApplied,
          dependencies: module.dependencies,
          dependents: module.dependents,
          status: module.pendingMigrations > 0 ? 'pending' : 'up-to-date'
        })),
        totalApplied: status.totalApplied,
        totalPending: status.totalPending,
        dependencyGraph: status.modules.reduce((graph, module) => {
          graph[module.moduleId] = module.dependencies;
          return graph;
        }, {} as Record<string, string[]>)
      };

      console.log(JSON.stringify(output, null, 2));
      return { success: true };
    }

    // Human-readable format
    if (status.modules.length === 0) {
      logger.info('No migration modules found');
      return { success: true };
    }

    // Default: Minimal summary (unless detailed or debug flag is used)
    if (!options.detailed && !options.debug) {
      if (status.totalPending > 0) {
        logger.info(`${status.totalPending} migration(s) pending, ${status.totalApplied} applied`);
      } else {
        logger.info(`All migrations up to date (${status.totalApplied} applied)`);
      }
      return { success: true };
    }

    // Detailed output
    logger.info(`\n📈 Migration Status Summary`);
    logger.info(`   Total Applied: ${status.totalApplied}`);
    logger.info(`   Total Pending: ${status.totalPending}`);
    
    if (status.totalPending > 0) {
      logger.info(`   🔄 ${status.totalPending} migration(s) pending`);
    } else {
      logger.info(`   ✅ All migrations up to date`);
    }

    logger.info(`\n📋 Module Details:`);
    
    for (const module of status.modules) {
      const statusIcon = module.pendingMigrations > 0 ? '🔄' : '✅';
      const statusText = module.pendingMigrations > 0 ? 'PENDING' : 'UP-TO-DATE';
      
      logger.info(`\n   ${statusIcon} ${module.moduleId} [${statusText}]`);
      logger.info(`      Applied: ${module.appliedMigrations} migration(s)`);
      
      if (module.pendingMigrations > 0) {
        logger.info(`      Pending: ${module.pendingMigrations} migration(s)`);
      }
      
      if (module.lastApplied) {
        logger.info(`      Last Applied: ${module.lastApplied.toISOString()}`);
      }

      // Show dependencies
      if (module.dependencies.length > 0) {
        logger.info(`      Dependencies: ${module.dependencies.join(', ')}`);
      }

      // Show dependents
      if (module.dependents.length > 0) {
        logger.info(`      Dependents: ${module.dependents.join(', ')}`);
      }

      // Show detailed info if requested
      if (options.detailed) {
        // Get pending migrations for this module
        const pendingMigrations = await engine.findPendingMigrations([module.moduleId]);
        if (pendingMigrations.length > 0) {
          logger.info(`      Pending Files:`);
          for (const migration of pendingMigrations) {
            logger.info(`        • ${migration.filename}`);
          }
        }
      }
    }

    // Show dependency visualization
    logger.info(`\n🌐 Dependency Graph:`);
    const processedModules = new Set<string>();
    
    for (const module of status.modules) {
      if (processedModules.has(module.moduleId)) continue;
      
      if (module.dependencies.length === 0) {
        // Root module (no dependencies)
        logger.info(`   ${module.moduleId} (root)`);
        showDependents(module.moduleId, status.modules, 1, processedModules);
      }
    }

    // Show any remaining modules (circular dependencies or orphaned)
    for (const module of status.modules) {
      if (!processedModules.has(module.moduleId)) {
        logger.info(`   ${module.moduleId} (isolated)`);
        processedModules.add(module.moduleId);
      }
    }

    return { success: true };

  } catch (error) {
    logger.error('💥 Status check failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await engine.close();
  }
}

function showDependents(
  moduleId: string, 
  allModules: Array<{ moduleId: string; dependencies: string[]; dependents: string[] }>, 
  depth: number, 
  processed: Set<string>
): void {
  processed.add(moduleId);
  
  const module = allModules.find(m => m.moduleId === moduleId);
  if (!module) return;

  for (const dependent of module.dependents) {
    if (processed.has(dependent)) continue;
    
    const indent = '  '.repeat(depth);
    logger.info(`${indent}└─ ${dependent}`);
    showDependents(dependent, allModules, depth + 1, processed);
  }
}