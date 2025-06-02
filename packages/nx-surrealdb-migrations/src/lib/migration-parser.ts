import { Migration } from './types';
import * as crypto from 'crypto';

export class MigrationParser {
  static parse(content: string, filename: string): Migration {
    const match = filename.match(/^(\d{4})_(.+)_up\.surql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${filename}`);
    }

    const [, id, name] = match;
    const up = content.trim();
    const checksum = crypto.createHash('sha256').update(up).digest('hex');

    return { id, name, filename, up, checksum };
  }

  static parseDown(content: string, filename: string): Migration {
    const match = filename.match(/^(\d{4})_(.+)_down\.surql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${filename}`);
    }

    const [, id, name] = match;
    const down = content.trim();
    const checksum = crypto.createHash('sha256').update(down).digest('hex');

    return { id, name, filename, up: down, checksum };
  }

  static splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let depth = 0;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      if ((char === '"' || char === "'") && sql[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') depth--;
      }

      current += char;

      if (char === ';' && !inString && depth === 0) {
        statements.push(current.trim());
        current = '';
      }
    }

    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements.filter(s => s.length > 0);
  }
}