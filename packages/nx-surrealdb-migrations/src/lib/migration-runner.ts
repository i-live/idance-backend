// packages/nx-surrealdb-migrations/src/lib/migration-runner.ts
import { SurrealDBClient } from './client';
import { Migration } from './types';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class MigrationRunner {
  constructor(private client: SurrealDBClient, private migrationsPath: string) {}

  async ensureMigrationTable(): Promise<void> {
    await this.client.query(`
      DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
      DEFINE FIELD id ON _migrations TYPE string;
      DEFINE FIELD name ON _migrations TYPE string;
      DEFINE FIELD executed_at ON _migrations TYPE datetime DEFAULT time::now();
      DEFINE FIELD checksum ON _migrations TYPE string;
      DEFINE INDEX idx_migrations_id ON _migrations COLUMNS id UNIQUE;
    `);
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.client.query('SELECT * FROM _migrations ORDER BY id ASC');
    return result[0]?.result || [];
  }

  async parseMigrationFile(file: string): Promise<Migration> {
    const content = await readFile(join(this.migrationsPath, file), 'utf-8');
    const match = file.match(/^(\d{4})_(.+)\.surql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}`);
    }
    const [, id, name] = match;
    const upMatch = content.match(/-- UP\n([\s\S]*?)(?:-- DOWN|$)/);
    const downMatch = content.match(/-- DOWN\n([\s\S]*?)$/);
    const up = upMatch ? upMatch[1].trim() : content.trim();
    const down = downMatch ? downMatch[1].trim() : undefined;
    const crypto = require('crypto');
    const checksum = crypto.createHash('sha256').update(up).digest('hex');

    return { id, name, filename: file, up, down, checksum };
  }

  async runMigration(migration: Migration): Promise<void> {
    try {
      await this.client.query('BEGIN TRANSACTION;');
      await this.client.query(migration.up);
      await this.client.query(`
        CREATE _migrations SET
          id = "${migration.id}",
          name = "${migration.name}",
          executed_at = time::now(),
          checksum = "${migration.checksum}"
      `);
      await this.client.query('COMMIT TRANSACTION;');
      console.log(`✅ Applied migration: ${migration.filename}`);
    } catch (error) {
      await this.client.query('CANCEL TRANSACTION;');
      throw new Error(`Migration ${migration.filename} failed: ${error.message}`);
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`No DOWN script for migration: ${migration.filename}`);
    }
    try {
      await this.client.query('BEGIN TRANSACTION;');
      await this.client.query(migration.down);
      await this.client.query(`DELETE _migrations WHERE id = "${migration.id}"`);
      await this.client.query('COMMIT TRANSACTION;');
      console.log(`✅ Rolled back migration: ${migration.filename}`);
    } catch (error) {
      await this.client.query('CANCEL TRANSACTION;');
      throw new Error(`Rollback ${migration.filename} failed: ${error.message}`);
    }
  }
}