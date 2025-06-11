import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { SurrealDBClient } from './client';
import { MigrationTracker } from './migration-tracker';
import { MigrationFileProcessor } from './migration-file';
import { ConfigLoader } from './config-loader';
import { DependencyResolver } from './dependency-resolver';
import { replaceEnvVars, loadEnvFile } from './env';
import { resolveProjectPath } from './project';

export interface MigrationEngineOptions {
  url: string;
  user: string;
  pass: string;
  namespace?: string;
  database?: string;
  envFile?: string;
  useTransactions?: boolean;
  initPath?: string;
  schemaPath?: string;
  force?: boolean;
  configPath?: string;
}

export interface MigrationExecutionContext {
  client: SurrealDBClient;
  tracker: MigrationTracker;
  resolver: DependencyResolver;
  options: ResolvedMigrationOptions;
}

export interface ResolvedMigrationOptions {
  url: string;
  user: string;
  pass: string;
  namespace: string;
  database: string;
  useTransactions: boolean;
  initPath: string;
  schemaPath?: string;
  force: boolean;
  configPath?: string;
}

export interface MigrationFile {
  number: string;
  name: string;
  direction: 'up' | 'down';
  filename: string;
  filePath: string;
  moduleId: string;
  content: string;
  checksum: string;
}

export interface MigrationResult {
  success: boolean;
  filesProcessed: number;
  filesSkipped: number;
  executionTimeMs: number;
  results: MigrationFileResult[];
}

export interface MigrationFileResult {
  file: MigrationFile;
  success: boolean;
  executionTimeMs: number;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export class MigrationEngine {
  private context: MigrationExecutionContext | null = null;

  constructor(private projectContext?: any) {}

  async initialize(options: MigrationEngineOptions): Promise<void> {
    // Load environment variables
    if (this.projectContext && options.envFile) {
      loadEnvFile(this.projectContext, options.envFile);
    }

    // Resolve options with environment variables
    const resolvedOptions: ResolvedMigrationOptions = {
      url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL!,
      user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER!,
      pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS!,
      namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE || 'default',
      database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE || 'default',
      useTransactions: options.useTransactions ?? true,
      initPath: options.initPath ? replaceEnvVars(options.initPath) : process.env.MIGRATIONS_PATH || 'database',
      schemaPath: options.schemaPath ? replaceEnvVars(options.schemaPath) : undefined,
      force: options.force || false,
      configPath: options.configPath
    };

    if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
      throw new Error('Missing required configuration. Provide either through options or environment variables.');
    }

    // Resolve project path if we have project context
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, resolvedOptions.initPath)
      : resolvedOptions.initPath;

    // Initialize database client
    const client = new SurrealDBClient();
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });

    // Initialize migration tracker
    const tracker = new MigrationTracker(client, resolvedOptions.schemaPath);
    await tracker.initialize();

    // Initialize dependency resolver
    const resolver = new DependencyResolver(basePath);
    await resolver.initialize(resolvedOptions.configPath);

    this.context = {
      client,
      tracker,
      resolver,
      options: resolvedOptions
    };
  }

  async findPendingMigrations(
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<MigrationFile[]> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { resolver, options, tracker } = this.context;
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, options.initPath)
      : options.initPath;

    // Determine which modules to process
    const modulesToProcess = targetModules && targetModules.length > 0
      ? this.resolveTargetModules(targetModules)
      : resolver.getAllModules();

    // Get execution order based on dependencies
    const executionOrder = direction === 'up'
      ? resolver.getExecutionOrder(modulesToProcess)
      : resolver.getRollbackOrder(modulesToProcess);

    const pendingMigrations: MigrationFile[] = [];

    for (const moduleId of executionOrder) {
      const moduleFiles = await this.findModuleMigrations(moduleId, direction, basePath);
      
      for (const file of moduleFiles) {
        // Check if migration should be applied
        const { canApply } = await tracker.canApplyMigration(
          file.number,
          file.name,
          direction
        );

        if (canApply || options.force) {
          pendingMigrations.push(file);
        }
      }
    }

    return pendingMigrations;
  }

  async executeMigrations(
    targetModules?: string[],
    direction: 'up' | 'down' = 'up'
  ): Promise<MigrationResult> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    const pendingMigrations = await this.findPendingMigrations(targetModules, direction);
    
    if (pendingMigrations.length === 0) {
      return {
        success: true,
        filesProcessed: 0,
        filesSkipped: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        results: []
      };
    }

    const results: MigrationFileResult[] = [];
    let filesProcessed = 0;
    let filesSkipped = 0;

    for (const migrationFile of pendingMigrations) {
      const result = await this.executeSingleMigration(migrationFile);
      results.push(result);

      if (result.skipped) {
        filesSkipped++;
      } else if (result.success) {
        filesProcessed++;
      } else {
        // If a migration fails and we're not forcing, stop execution
        if (!this.context.options.force) {
          break;
        }
      }
    }

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      success: results.every(r => r.success || r.skipped),
      filesProcessed,
      filesSkipped,
      executionTimeMs,
      results
    };
  }

  async validateRollback(targetModules: string[]): Promise<{ 
    canRollback: boolean; 
    blockedBy: string[]; 
    warnings: string[];
    migrationChecks: Array<{
      moduleId: string;
      hasAppliedMigrations: boolean;
      rollbackFilesAvailable: boolean;
      dependencyConflicts: string[];
    }>;
  }> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { resolver, tracker, options } = this.context;
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, options.initPath)
      : options.initPath;

    const warnings: string[] = [];
    let canRollback = true;
    const allBlockedBy: string[] = [];
    const migrationChecks = [];

    for (const moduleId of targetModules) {
      // Check dependency conflicts
      const validation = resolver.validateRollback(moduleId, targetModules);
      if (!validation.canRollback) {
        canRollback = false;
        allBlockedBy.push(...validation.blockedBy);
        if (validation.reason) {
          warnings.push(validation.reason);
        }
      }

      // Check for applied migrations and available rollback files
      const appliedMigrations = await this.getAppliedMigrations(moduleId);
      const rollbackFiles = await this.findModuleMigrations(moduleId, 'down', basePath);
      
      const hasAppliedMigrations = appliedMigrations.length > 0;
      const rollbackFilesAvailable = rollbackFiles.length > 0;

      // Validate rollback file availability
      if (hasAppliedMigrations && !rollbackFilesAvailable) {
        canRollback = false;
        warnings.push(`Module ${moduleId} has applied migrations but no rollback files available`);
      }

      // Check for missing rollback files for specific applied migrations
      for (const applied of appliedMigrations) {
        const hasRollbackFile = rollbackFiles.some(
          rf => rf.number === applied.number && rf.name === applied.name
        );
        if (!hasRollbackFile) {
          canRollback = false;
          warnings.push(`Missing rollback file for migration ${applied.number}_${applied.name} in ${moduleId}`);
        }
      }

      migrationChecks.push({
        moduleId,
        hasAppliedMigrations,
        rollbackFilesAvailable,
        dependencyConflicts: validation.blockedBy
      });
    }

    // Override safety checks if force is enabled
    if (options.force && !canRollback) {
      warnings.push('WARNING: Force flag enabled - bypassing rollback safety checks');
      canRollback = true;
    }

    return {
      canRollback,
      blockedBy: [...new Set(allBlockedBy)],
      warnings,
      migrationChecks
    };
  }

  async getMigrationStatus(targetModules?: string[]): Promise<{
    modules: Array<{
      moduleId: string;
      appliedMigrations: number;
      pendingMigrations: number;
      lastApplied?: Date;
      dependencies: string[];
      dependents: string[];
    }>;
    totalApplied: number;
    totalPending: number;
  }> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { resolver, tracker } = this.context;
    const modulesToCheck = targetModules || resolver.getAllModules();
    
    const modules = [];
    let totalApplied = 0;
    let totalPending = 0;

    for (const moduleId of modulesToCheck) {
      const dependencies = resolver.getModuleDependencies(moduleId);
      const dependents = resolver.getModuleDependents(moduleId);
      
      const appliedMigrations = await this.countAppliedMigrations(moduleId);
      const pendingMigrations = await this.countPendingMigrations(moduleId);
      const lastApplied = await this.getLastAppliedMigration(moduleId);

      modules.push({
        moduleId,
        appliedMigrations,
        pendingMigrations,
        lastApplied,
        dependencies,
        dependents
      });

      totalApplied += appliedMigrations;
      totalPending += pendingMigrations;
    }

    return {
      modules,
      totalApplied,
      totalPending
    };
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.client.close();
      this.context = null;
    }
  }

  private resolveTargetModules(targetModules: string[]): string[] {
    if (!this.context) {
      throw new Error('Migration engine not initialized.');
    }

    const { resolver } = this.context;
    const resolved: string[] = [];

    for (const pattern of targetModules) {
      // Try to find existing module using the same logic as MigrationFileProcessor
      const allModules = resolver.getAllModules();
      const normalizedPattern = pattern.trim().toLowerCase();
      const patternAsNumber = parseInt(normalizedPattern, 10);
      const normalizedPatternNumber = isNaN(patternAsNumber) ? null : patternAsNumber.toString();

      let found = false;
      for (const moduleId of allModules) {
        const match = moduleId.match(/^(\d{1,4})_(.+)$/);
        if (!match) continue;

        const [, number, name] = match;
        const normalizedNumber = parseInt(number, 10).toString();

        if (
          moduleId.toLowerCase() === normalizedPattern ||
          (normalizedPatternNumber !== null && normalizedPatternNumber === normalizedNumber) ||
          normalizedPattern === name.toLowerCase() ||
          normalizedPattern === `${normalizedNumber}_${name.toLowerCase()}` ||
          normalizedPattern === `${number}_${name.toLowerCase()}`
        ) {
          resolved.push(moduleId);
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(`Module not found: ${pattern}. Available modules: ${allModules.join(', ')}`);
      }
    }

    return resolved;
  }

  private async findModuleMigrations(
    moduleId: string,
    direction: 'up' | 'down',
    basePath: string
  ): Promise<MigrationFile[]> {
    const modulePath = path.join(basePath, moduleId);
    
    try {
      const files = await fs.readdir(modulePath);
      const migrationFiles = MigrationFileProcessor.filterMigrationFiles(files, undefined, direction);
      
      const migrations: MigrationFile[] = [];
      
      for (const filename of migrationFiles) {
        const filePath = path.join(modulePath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        
        const fileParts = filename.match(/^(\d+)_(.+)_(up|down)\.surql$/);
        if (!fileParts) continue;
        
        const [, number, name] = fileParts;
        
        migrations.push({
          number,
          name,
          direction,
          filename,
          filePath,
          moduleId,
          content,
          checksum
        });
      }
      
      return migrations.sort((a, b) => a.number.localeCompare(b.number));
    } catch (error) {
      // Module directory doesn't exist or is empty
      return [];
    }
  }

  private async executeSingleMigration(migrationFile: MigrationFile): Promise<MigrationFileResult> {
    if (!this.context) {
      throw new Error('Migration engine not initialized.');
    }

    const { client, tracker, options } = this.context;
    const startTime = performance.now();

    try {
      // Check if migration can be applied (unless forcing)
      if (!options.force) {
        const { canApply, reason } = await tracker.canApplyMigration(
          migrationFile.number,
          migrationFile.name,
          migrationFile.direction
        );

        if (!canApply) {
          return {
            file: migrationFile,
            success: true,
            executionTimeMs: Math.round(performance.now() - startTime),
            skipped: true,
            skipReason: reason
          };
        }
      }

      // Process migration content
      const processedContent = MigrationFileProcessor.processContent(migrationFile.content, {
        defaultNamespace: options.namespace,
        defaultDatabase: options.database,
        useTransactions: options.useTransactions
      });

      // Execute migration
      await client.query(processedContent);
      const executionTimeMs = Math.round(performance.now() - startTime);

      // Record migration
      await tracker.addMigration({
        number: migrationFile.number,
        name: migrationFile.name,
        direction: migrationFile.direction,
        filename: migrationFile.filename,
        path: path.dirname(migrationFile.filePath),
        content: migrationFile.content,
        namespace: options.namespace,
        database: options.database,
        checksum: migrationFile.checksum,
        status: 'success',
        execution_time_ms: executionTimeMs
      });

      return {
        file: migrationFile,
        success: true,
        executionTimeMs
      };

    } catch (error) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      
      // Record failed migration
      await tracker.addMigration({
        number: migrationFile.number,
        name: migrationFile.name,
        direction: migrationFile.direction,
        filename: migrationFile.filename,
        path: path.dirname(migrationFile.filePath),
        content: migrationFile.content,
        namespace: options.namespace,
        database: options.database,
        checksum: migrationFile.checksum,
        status: 'fail',
        execution_time_ms: executionTimeMs
      });

      return {
        file: migrationFile,
        success: false,
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async countAppliedMigrations(moduleId: string): Promise<number> {
    if (!this.context) return 0;
    
    // This would need to query the migration tracker for applied migrations in this module
    // For now, return 0 as placeholder
    return 0;
  }

  private async countPendingMigrations(moduleId: string): Promise<number> {
    if (!this.context) return 0;
    
    const pendingMigrations = await this.findModuleMigrations(
      moduleId, 
      'up', 
      this.projectContext 
        ? resolveProjectPath(this.projectContext, this.context.options.initPath)
        : this.context.options.initPath
    );
    
    return pendingMigrations.length;
  }

  private async getLastAppliedMigration(moduleId: string): Promise<Date | undefined> {
    if (!this.context) return undefined;
    
    // This would need to query the migration tracker for the last applied migration
    // For now, return undefined as placeholder
    return undefined;
  }

  private async getAppliedMigrations(moduleId: string): Promise<Array<{
    number: string;
    name: string;
    direction: 'up' | 'down';
    appliedAt: Date;
  }>> {
    if (!this.context) return [];
    
    const { tracker } = this.context;
    
    // Query the migration tracker for applied migrations in this module
    // This would need to be implemented in MigrationTracker
    // For now, return empty array as placeholder
    // TODO: Implement tracker.getAppliedMigrations(moduleId) method
    
    return [];
  }
}