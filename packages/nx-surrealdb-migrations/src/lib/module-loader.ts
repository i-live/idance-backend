import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ModuleConfig, ApplicationConfig, Migration } from './types';

export class ModuleLoader {
  constructor(private workspaceRoot: string) {}

  /**
   * Load module configuration from module.json
   */
  loadModuleConfig(moduleName: string): ModuleConfig {
    const modulePath = join(this.workspaceRoot, 'database', 'modules', moduleName, 'src', 'module.json');
    
    if (!existsSync(modulePath)) {
      throw new Error(`Module configuration not found: ${modulePath}`);
    }

    try {
      const configContent = readFileSync(modulePath, 'utf-8');
      return JSON.parse(configContent) as ModuleConfig;
    } catch (error) {
      throw new Error(`Failed to parse module configuration for ${moduleName}: ${error}`);
    }
  }

  /**
   * Load application configuration from app.json
   */
  loadApplicationConfig(appName: string): ApplicationConfig {
    const appPath = join(this.workspaceRoot, 'database', 'applications', appName, 'app.json');
    
    if (!existsSync(appPath)) {
      throw new Error(`Application configuration not found: ${appPath}`);
    }

    try {
      const configContent = readFileSync(appPath, 'utf-8');
      return JSON.parse(configContent) as ApplicationConfig;
    } catch (error) {
      throw new Error(`Failed to parse application configuration for ${appName}: ${error}`);
    }
  }

  /**
   * Resolve module dependencies in correct order
   */
  resolveDependencyOrder(modules: string[]): string[] {
    const moduleConfigs = new Map<string, ModuleConfig>();
    const resolved: string[] = [];
    const visiting = new Set<string>();

    // Load all module configurations
    for (const moduleName of modules) {
      moduleConfigs.set(moduleName, this.loadModuleConfig(moduleName));
    }

    const visit = (moduleName: string) => {
      if (resolved.includes(moduleName)) {
        return;
      }

      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving module: ${moduleName}`);
      }

      visiting.add(moduleName);
      const moduleConfig = moduleConfigs.get(moduleName);
      
      if (!moduleConfig) {
        throw new Error(`Module configuration not found for: ${moduleName}`);
      }

      // Visit dependencies first
      for (const dep of moduleConfig.dependencies) {
        if (modules.includes(dep)) {
          visit(dep);
        }
      }

      visiting.delete(moduleName);
      resolved.push(moduleName);
    };

    for (const moduleName of modules) {
      visit(moduleName);
    }

    return resolved;
  }

  /**
   * Get all migrations for an application in dependency order
   */
  getApplicationMigrations(appName: string, environment: string): Migration[] {
    const appConfig = this.loadApplicationConfig(appName);
    const orderedModules = this.resolveDependencyOrder(appConfig.modules);
    const migrations: Migration[] = [];

    for (const moduleName of orderedModules) {
      const moduleConfig = this.loadModuleConfig(moduleName);
      const modulePath = join(this.workspaceRoot, 'database', 'modules', moduleName, 'src');

      for (const migrationInfo of moduleConfig.migrations) {
        // Add up migration
        const upPath = join(modulePath, `${migrationInfo.id}_up.surql`);
        if (existsSync(upPath)) {
          migrations.push({
            id: `${moduleName}:${migrationInfo.id}`,
            path: upPath,
            filename: `${migrationInfo.id}_up.surql`,
            name: migrationInfo.description,
            direction: 'up',
            status: 'pending',
            namespace: appConfig.environment[environment]?.namespace,
            database: appConfig.environment[environment]?.database,
          });
        }
      }
    }

    // Add application-specific migrations
    const appMigrationsPath = join(this.workspaceRoot, 'database', 'applications', appName, 'migrations');
    // TODO: Load application-specific migrations if they exist

    return migrations;
  }

  /**
   * Get rollback migrations in reverse dependency order
   */
  getRollbackMigrations(appName: string, environment: string): Migration[] {
    const migrations = this.getApplicationMigrations(appName, environment);
    const rollbackMigrations: Migration[] = [];

    // Reverse order for rollbacks
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = migrations[i];
      const downPath = migration.path.replace('_up.surql', '_down.surql');
      
      if (existsSync(downPath)) {
        rollbackMigrations.push({
          ...migration,
          path: downPath,
          filename: migration.filename.replace('_up.surql', '_down.surql'),
          direction: 'down',
        });
      }
    }

    return rollbackMigrations;
  }
}