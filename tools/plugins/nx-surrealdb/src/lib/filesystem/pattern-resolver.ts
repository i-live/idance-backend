import { MigrationFileProcessor } from './migration-file-processor';
import { DependencyResolver } from '../domain/dependency-resolver';
import { Debug } from '../infrastructure/debug';

export interface PatternResolutionResult<T> {
  resolved: T[];
  notFound: string[];
}

export interface ResolvedModule {
  moduleId: string;
  pattern: string;
}

export interface ResolvedFilename {
  filename: string;
  pattern: string;
  moduleId: string;
  number: string;
  name: string;
  direction: 'up' | 'down';
}

export class PatternResolver {
  private static readonly MODULE_PATTERN = /^(\d{1,4})_(.+)$/;
  private static readonly MIGRATION_PATTERN = /^(\d{4})_(.+?)_(up|down)\.surql$/;
  private debug = Debug.scope('pattern-resolver');

  constructor(
    private resolver: DependencyResolver,
    private basePath: string
  ) {}

  /**
   * Resolve module patterns using auto-globbing
   * Examples: "10" -> "010_auth", "auth" -> "010_auth", "010_auth" -> "010_auth"
   */
  resolveModules(patterns: string[]): PatternResolutionResult<ResolvedModule> {
    const resolved: ResolvedModule[] = [];
    const notFound: string[] = [];
    const allModules = this.resolver.getAllModules();

    for (const pattern of patterns) {
      const moduleId = this.findMatchingModule(pattern, allModules);
      if (moduleId) {
        resolved.push({ moduleId, pattern });
      } else {
        notFound.push(pattern);
      }
    }

    return { resolved, notFound };
  }

  /**
   * Resolve filename patterns using auto-globbing
   * Examples: "1" -> "0001_authentication_up.surql", "auth" -> "0001_authentication_up.surql"
   */
  async resolveFilenames(
    patterns: string[], 
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<PatternResolutionResult<ResolvedFilename>> {
    const resolved: ResolvedFilename[] = [];
    const notFound: string[] = [];

    // Determine which modules to search in
    const modulesToSearch = targetModules || this.resolver.getAllModules();

    for (const pattern of patterns) {
      const candidates: ResolvedFilename[] = [];

      // Search each module for matching files
      for (const moduleId of modulesToSearch) {
        const moduleFiles = await this.getModuleFiles(moduleId, direction);
        const matchingFile = this.findMatchingFile(pattern, moduleFiles, moduleId);
        
        if (matchingFile) {
          candidates.push(matchingFile);
        }
      }

      if (candidates.length === 0) {
        notFound.push(pattern);
      } else if (candidates.length === 1) {
        // Single match - perfect
        resolved.push(candidates[0]);
      } else {
        // Multiple matches - take all of them regardless of module specification
        // This allows users to operate on files with the same pattern across multiple modules
        resolved.push(...candidates);
        this.debug.log(`Multiple matches for pattern "${pattern}": ${candidates.map(c => `${c.moduleId}/${c.filename}`).join(', ')}`);
      }
    }

    return { resolved, notFound };
  }

  /**
   * Special rollback filename resolution - handles dependency checking
   */
  async resolveRollbackFilenames(
    patterns: string[],
    targetModules?: string[]
  ): Promise<PatternResolutionResult<ResolvedFilename> & { 
    dependencyWarnings: string[] 
  }> {
    const result = await this.resolveFilenames(patterns, targetModules, 'down');
    const dependencyWarnings: string[] = [];

    // For rollback, check if the resolved files have dependency conflicts
    for (const resolved of result.resolved) {
      // Get all modules that would be affected by this rollback
      const affectedModules = [resolved.moduleId];
      
      // Validate rollback dependencies
      const validation = this.resolver.validateRollback(resolved.moduleId, affectedModules);
      if (!validation.canRollback) {
        dependencyWarnings.push(
          `Warning: Rolling back ${resolved.filename} may cause dependency conflicts: ${validation.blockedBy.join(', ')}`
        );
      }
    }

    return {
      ...result,
      dependencyWarnings
    };
  }

  private findMatchingModule(pattern: string, allModules: string[]): string | null {
    const normalizedPattern = pattern.trim().toLowerCase();
    const patternAsNumber = parseInt(normalizedPattern, 10);
    const isNumericPattern = !isNaN(patternAsNumber) && /^\d+$/.test(normalizedPattern);

    // Try index-based mapping first for small numbers (0-based indexing)
    if (isNumericPattern && patternAsNumber >= 0 && patternAsNumber < allModules.length) {
      return allModules[patternAsNumber];
    }

    // Try number-based mapping for larger numbers or when index mapping fails
    const normalizedPatternNumber = isNumericPattern ? patternAsNumber.toString() : null;

    for (const moduleId of allModules) {
      const match = moduleId.match(PatternResolver.MODULE_PATTERN);
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
        return moduleId;
      }
    }

    return null;
  }

  private findMatchingFile(
    pattern: string, 
    files: string[], 
    moduleId: string
  ): ResolvedFilename | null {
    const normalizedPattern = pattern.trim().toLowerCase();

    for (const filename of files) {
      if (this.matchesFilePattern(filename, normalizedPattern)) {
        const parsed = MigrationFileProcessor.parseMigrationFile(filename);
        if (parsed) {
          return {
            filename,
            pattern,
            moduleId,
            number: parsed.number,
            name: parsed.name,
            direction: parsed.direction
          };
        }
      }
    }

    return null;
  }

  private matchesFilePattern(filename: string, pattern: string): boolean {
    const migration = MigrationFileProcessor.parseMigrationFile(filename);
    if (!migration) return false;

    // Remove leading zeros for comparison
    const normalizedPattern = pattern.replace(/^0+/, '');
    const normalizedNumber = parseInt(migration.number, 10).toString();

    return (
      filename.toLowerCase() === pattern.toLowerCase() ||
      filename.toLowerCase() === `${pattern.toLowerCase()}.surql` ||
      normalizedPattern === normalizedNumber ||
      normalizedPattern === migration.name.toLowerCase() ||
      normalizedPattern === `${normalizedNumber}_${migration.name.toLowerCase()}` ||
      normalizedPattern === `${migration.number}_${migration.name.toLowerCase()}`
    );
  }

  private async getModuleFiles(moduleId: string, direction: 'up' | 'down'): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const modulePath = path.join(this.basePath, moduleId);
      const files = await fs.readdir(modulePath);
      
      return MigrationFileProcessor.filterMigrationFiles(files as string[], undefined, direction);
    } catch (error) {
      this.debug.log(`Could not read files from module ${moduleId}: ${error.message}`);
      return [];
    }
  }
}