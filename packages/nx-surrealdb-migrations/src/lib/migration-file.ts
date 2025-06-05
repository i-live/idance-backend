import * as fs from 'fs/promises';
import { replaceEnvVars } from './env';

export interface MigrationContext {
  defaultNamespace?: string;
  defaultDatabase?: string;
  useTransactions?: boolean;
}

export interface MigrationFile {
  number: string;
  name: string;
  direction: 'up' | 'down';
  fullPath: string;
  content: string;
}

export class MigrationFileProcessor {
  private static readonly MIGRATION_PATTERN = /^(\d{4})_(.+?)_(up|down)\.surql$/;
  private static readonly SUBDIR_PATTERN = /^(\d{1,4})_(.+)$/;
  private static readonly NAMESPACE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+NAMESPACE/i;
  private static readonly DATABASE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+DATABASE/i;
  private static readonly DDL_OPERATIONS = /^\s*(DEFINE|REMOVE)\s+(NAMESPACE|DATABASE|TABLE|FIELD|INDEX|FUNCTION)/im;
  private static readonly TRANSACTION_BEGIN = /BEGIN\s+TRANSACTION/i;
  private static readonly TRANSACTION_COMMIT = /COMMIT\s+TRANSACTION/i;

  static async findMatchingSubdirectory(basePath: string, pattern: string): Promise<string | null> {
    try {
      const subDirs = await fs.readdir(basePath, { withFileTypes: true });
      const directories = subDirs.filter(d => d.isDirectory()).map(d => d.name);
      console.log('Subdirectories in', basePath, ':', directories);

      const normalizedPattern = pattern.trim().toLowerCase().replace(/^0+/, '');
      console.log('Normalized pattern:', normalizedPattern);

      for (const dirName of directories) {
        const normalizedDirName = dirName.toLowerCase();
        const match = normalizedDirName.match(this.SUBDIR_PATTERN);
        if (!match) {
          console.log(`Directory ${dirName} does not match SUBDIR_PATTERN`);
          continue;
        }

        const [, number, name] = match;
        const normalizedNumber = parseInt(number, 10).toString();
        console.log(`Processing directory: ${dirName}, number: ${number}, normalizedNumber: ${normalizedNumber}, name: ${name}`);

        // Match by full directory name, number, name, or number_name
        if (
          normalizedDirName === normalizedPattern ||
          normalizedPattern === normalizedNumber ||
          normalizedPattern === name.toLowerCase() ||
          normalizedPattern === `${normalizedNumber}_${name.toLowerCase()}` ||
          normalizedPattern === `${number}_${name.toLowerCase()}`
        ) {
          console.log(`Matched subdirectory: ${dirName} for pattern: ${pattern}`);
          return dirName;
        }
      }
      console.log(`No subdirectory matched for pattern: ${pattern}`);
      return null;
    } catch (error) {
      console.error(`Error reading directory ${basePath}:`, error);
      throw new Error(`Failed to read subdirectories in ${basePath}: ${error.message}`);
    }
  }

  static parseMigrationFile(filename: string, basePath?: string): MigrationFile | null {
    const match = filename.match(this.MIGRATION_PATTERN);
    if (!match) return null;

    const [, number, name, direction] = match;
    return {
      number,
      name,
      direction: direction as 'up' | 'down',
      fullPath: basePath ? `${basePath}/${filename}` : filename,
      content: ''
    };
  }

  static matchesMigrationPattern(filename: string, pattern: string): boolean {
    const migration = this.parseMigrationFile(filename);
    if (!migration) return false;

    const normalizedPattern = pattern.trim().toLowerCase().replace(/^0+/, '');
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

  static filterMigrationFiles(files: string[], filePattern?: string, direction: 'up' | 'down' = 'up'): string[] {
    let filtered = files.filter(f => f.endsWith(`_${direction}.surql`));
    console.log(`Filtered files for ${direction}:`, filtered);

    if (filePattern) {
      filtered = filtered.filter(f => this.matchesMigrationPattern(f, filePattern));
      console.log(`Filtered files for pattern ${filePattern}:`, filtered);
    }

    return direction === 'down' ? filtered.reverse() : filtered.sort();
  }

  static processContent(content: string, context: MigrationContext): string {
    const processed = replaceEnvVars(content);
    const statements: string[] = [];

    const hasNamespaceOperation = this.NAMESPACE_OPERATIONS.test(processed);
    const hasDatabaseOperation = this.DATABASE_OPERATIONS.test(processed);
    const hasDDLOperation = this.DDL_OPERATIONS.test(processed);
    const hasBeginTransaction = this.TRANSACTION_BEGIN.test(processed);
    const hasCommitTransaction = this.TRANSACTION_COMMIT.test(processed);
    
    if (!hasNamespaceOperation && context.defaultNamespace) {
      statements.push(`USE NAMESPACE ${context.defaultNamespace};`);
      console.log(`Using namespace: ${context.defaultNamespace}\n`)
    }
    if (!hasDatabaseOperation && context.defaultDatabase) {
      statements.push(`USE DATABASE ${context.defaultDatabase};`);
      console.log(`Using database: ${context.defaultDatabase}\n`)
    }

    if (hasDDLOperation || !context.useTransactions || hasBeginTransaction || hasCommitTransaction) {
      statements.push(processed);
      console.log(`No Transaction Block Added. \nDDL Operation: ${hasDDLOperation}`)
    } else {
      statements.push('BEGIN TRANSACTION;');
      statements.push(processed);
      statements.push('COMMIT TRANSACTION;');
      console.log(`Added Transaction Block.\n`)
    }

    return statements.join('\n\n');
  }
}