import { Migration } from './types';
import { SurrealDBClient } from './client';

export class MigrationTracker {
  constructor(private client: SurrealDBClient) {}

  async initialize(): Promise<void> {
    const query = `
      DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
      DEFINE FIELD id ON _migrations TYPE string;
      DEFINE FIELD name ON _migrations TYPE string;
      DEFINE FIELD filename ON _migrations TYPE string;
      DEFINE FIELD checksum ON _migrations TYPE string;
      DEFINE FIELD applied_at ON _migrations TYPE datetime DEFAULT time::now();
      DEFINE FIELD applied_by ON _migrations TYPE string;
      DEFINE INDEX idx_migrations_id ON _migrations COLUMNS id UNIQUE;
    `;
    await this.client.query(query);
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.client.query('SELECT * FROM _migrations ORDER BY id ASC');
    return (result[0]?.result || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      up: m.up || '',
      checksum: m.checksum,
      applied_at: m.applied_at,
    })) as Migration[];
  }

  async recordMigration(migration: Migration): Promise<void> {
    const query = `
      CREATE _migrations SET
        id = "${migration.id}",
        name = "${migration.name}",
        filename = "${migration.filename}",
        checksum = "${migration.checksum}",
        applied_by = "${process.env.USER || 'nx-plugin'}"
    `;
    await this.client.query(query);
  }

  async removeMigration(id: string): Promise<void> {
    await this.client.query(`DELETE _migrations WHERE id = "${id}"`);
  }
}