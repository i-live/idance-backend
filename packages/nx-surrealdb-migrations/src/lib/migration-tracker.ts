import { Migration } from './types';
import { SurrealDBClient } from './client';

export class MigrationTracker {
  constructor(private client: SurrealDBClient) {}

  async initialize(): Promise<void> {
    const query = `
    DEFINE TABLE IF NOT EXISTS migration_history SCHEMAFULL;

    DEFINE FIELD IF NOT EXISTS number ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS name ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS direction ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS file ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS path ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS content ON migration_history TYPE string;
    DEFINE FIELD IF NOT EXISTS checksum ON migration_history TYPE option<string>;

    DEFINE FIELD IF NOT EXISTS applied_at ON migration_history TYPE datetime DEFAULT time::now();
    DEFINE FIELD IF NOT EXISTS applied_by ON migration_history TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS execution_time_ms ON migration_history TYPE option<int>;

    DEFINE INDEX IF NOT EXISTS migration_history_applied_at ON migration_history FIELDS applied_at;
    DEFINE INDEX IF NOT EXISTS migration_history_name ON migration_history FIELDS name;

    `;
    await this.client.query(query);
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.client.query('SELECT * FROM migration_history ORDER BY id ASC');
    return (result[0]?.result || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      file: m.file,
      status: m.status || 'up',
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