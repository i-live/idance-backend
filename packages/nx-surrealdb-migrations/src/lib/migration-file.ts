import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedMigration {
  number: string;
  name: string;
}

export class MigrationFileProcessor {
  static async listSubdirectories(basePath: string): Promise<string[]> {
    return (await fs.readdir(basePath, { withFileTypes: true }))
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name);
  }

  static async findMatchingSubdirectory(basePath: string, pattern: string): Promise<string | null> {
    const normalizedPattern = String(pattern).toLowerCase();
    const subdirs = await fs.readdir(basePath, { withFileTypes: true });
    for (const dir of subdirs) {
      if (!dir.isDirectory()) continue;
      const dirName = dir.name;
      const match = dirName.match(/^(\d+)_(.+)$/);
      if (!match) continue;
      const [, number, name] = match;
      const normalizedNumber = parseInt(number).toString();
      const normalizedDirName = dirName.toLowerCase();
      const normalizedName = name.toLowerCase();
      if (
        normalizedPattern === normalizedNumber ||
        normalizedPattern === normalizedDirName ||
        normalizedPattern === normalizedName
      ) {
        return dirName;
      }
    }
    return null;
  }

  static filterMigrationFiles(files: string[], pattern: string | number | undefined, direction: 'up' | 'down'): string[] {
    const normalizedPattern = pattern != null ? String(pattern).toLowerCase() : null;
    console.log(`🔍 Filtering files for direction: ${direction}, pattern: ${normalizedPattern || 'none'}`);
    const filtered = files
      .filter(file => file.endsWith(`_${direction}.surql`))
      .filter(file => {
        if (!normalizedPattern) return true;
        const match = file.match(/^(\d+)_(.+)_(up|down)\.surql$/);
        if (!match) return false;
        const [, number, name] = match;
        const normalizedNumber = parseInt(number).toString();
        const normalizedName = name.toLowerCase();
        return normalizedPattern === normalizedNumber || normalizedPattern === normalizedName;
      })
      .sort();
    console.log(`Filtered files: ${JSON.stringify(filtered)}`);
    return filtered;
  }

  static parseMigrationFile(file: string): ParsedMigration | null {
    const match = file.match(/^(\d+)_(.+)_(up|down)\.surql$/);
    if (!match) return null;
    const [, number, name] = match;
    return { number, name };
  }

  static processContent(content: string, options: { defaultNamespace?: string; defaultDatabase?: string; useTransactions: boolean }): string {
    let processed = content;
    if (options.defaultNamespace) {
      processed = processed.replace(/^USE NS \S+;/m, `USE NS ${options.defaultNamespace};`);
    }
    if (options.defaultDatabase) {
      processed = processed.replace(/^USE DB \S+;/m, `USE DB ${options.defaultDatabase};`);
    }
    if (options.useTransactions) {
      const dmlStatements = ['CREATE', 'UPDATE', 'DELETE', 'INSERT'];
      let transactionWrapped = false;
      for (const stmt of dmlStatements) {
        if (processed.match(new RegExp(`^${stmt}\\s`, 'm'))) {
          transactionWrapped = true;
          processed = `BEGIN TRANSACTION;\n${processed}\nCOMMIT TRANSACTION;`;
          break;
        }
      }
      if (!transactionWrapped) {
        return processed;
      }
    }
    return processed;
  }
}