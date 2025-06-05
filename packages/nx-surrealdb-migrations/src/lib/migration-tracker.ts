import { Migration } from './types';
import { SurrealDBClient } from './client';

export class MigrationTracker {
  constructor(private client: SurrealDBClient) {}

  async initialize(): Promise<void> {
    const query = `
      DEFINE TABLE IF NOT EXISTS migration_history SCHEMAFULL;

      DEFINE FIELD IF NOT EXISTS number ON migration_history TYPE string;
      DEFINE FIELD IF NOT EXISTS name ON migration_history TYPE string;
      DEFINE FIELD IF NOT EXISTS direction ON migration_history TYPE string ASSERT $value IN ['up', 'down'] DEFAULT 'up';
      DEFINE FIELD IF NOT EXISTS filename ON migration_history TYPE string;
      DEFINE FIELD IF NOT EXISTS path ON migration_history TYPE string;
      DEFINE FIELD IF NOT EXISTS content ON migration_history TYPE string;

      DEFINE FIELD IF NOT EXISTS namespace ON migration_history TYPE string DEFAULT session::ns();
      DEFINE FIELD IF NOT EXISTS database ON migration_history TYPE string DEFAULT session::db();

      DEFINE FIELD IF NOT EXISTS checksum ON migration_history TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS status ON migration_history TYPE string ASSERT $value IN ['success', 'fail'] DEFAULT 'success';
      DEFINE FIELD IF NOT EXISTS applied_at ON migration_history TYPE datetime DEFAULT time::now();
      DEFINE FIELD IF NOT EXISTS applied_by ON migration_history TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS execution_time_ms ON migration_history TYPE option<int>;

      DEFINE INDEX IF NOT EXISTS migration_history_applied_at ON migration_history FIELDS applied_at;
    `;
    await this.client.query(query);
  }

  async addMigration(migration: Migration): Promise<void> {
    await this.initialize();
    
    if (!migration.number || !migration.name || !migration.filename || !migration.path || !migration.content) {
      throw new Error('Missing required migration fields');
    }
    if (!['up', 'down'].includes(migration.direction || 'up')) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!['success', 'fail'].includes(migration.status || 'success')) {
      throw new Error("Status must be 'success' or 'fail'");
    }
    if (!/^[a-zA-Z0-9_/.-]+$/.test(migration.path)) {
      throw new Error('Invalid path format');
    }

    await this.client.create("migration_history", {
      number: migration.number,
      name: migration.name,
      direction: migration.direction || 'up',
      filename: migration.filename,
      path: migration.path,
      content: migration.content,
      checksum: migration.checksum,
      status: migration.status || 'success',
      applied_by: this.client.username,
      execution_time_ms: migration.execution_time_ms || null
    });
  }

  async getMigrationStatus(direction: string, number: string, name: string, filename?: string): Promise<Migration | null> {
    if (!['up', 'down'].includes(direction)) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!number || !name) {
      throw new Error('Number and name are required');
    }
    if (filename && !/^[a-zA-Z0-9_/.-]+$/.test(filename)) {
      throw new Error('Invalid filename format');
    }

    const params: Record<string, string> = { direction, number, name };
    let query = `
      SELECT * FROM migration_history 
      WHERE direction = $direction 
      AND number = $number 
      AND name = $name
    `;
    
    if (filename) {
      query += ` AND filename = $filename`;
      params.filename = filename;
    }

    try {
      const result = await this.client.query(query, params);
      const migration = result[0]?.result?.[0];
      
      if (!migration) return null;
      
      return {
        id: migration.id,
        number: migration.number,
        name: migration.name,
        direction: migration.direction,
        filename: migration.filename,
        path: migration.path,
        content: migration.content,
        checksum: migration.checksum,
        status: migration.status,
        namespace: migration.namespace,
        database: migration.database,
        applied_at: migration.applied_at,
        applied_by: migration.applied_by,
        execution_time_ms: migration.execution_time_ms
      };
    } catch (error) {
      throw new Error(`Failed to fetch migration status: ${error.message}`);
    }
  }

  async getMigrationsByDirectionAndPath(direction: string, path: string): Promise<Migration[]> {
    if (!['up', 'down'].includes(direction)) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!path || !/^[a-zA-Z0-9_/.-]+$/.test(path)) {
      throw new Error('Invalid or missing path');
    }

    try {
      const result = await this.client.query(
        `
        SELECT * FROM migration_history 
        WHERE direction = $direction 
        AND path = $path
        ORDER BY number ASC
        `,
        { direction, path }
      );
      
      return (result[0]?.result || []).map((m: any) => ({
        id: m.id,
        number: m.number,
        name: m.name,
        direction: m.direction,
        filename: m.filename,
        path: m.path,
        content: m.content,
        checksum: m.checksum,
        status: m.status,
        namespace: m.namespace,
        database: m.database,
        applied_at: m.applied_at,
        applied_by: m.applied_by,
        execution_time_ms: m.execution_time_ms
      })) as Migration[];
    } catch (error) {
      throw new Error(`Failed to fetch migrations: ${error.message}`);
    }
  }

  async updateMigrationStatus(recordId: string, status: 'success' | 'fail'): Promise<void> {
    if (!recordId.startsWith('migration_history:') || recordId.length < 18) {
      throw new Error('Invalid record ID format. Expected migration_history:<uuid>');
    }

    try {
      const result = await this.client.query(
        `
        UPDATE $id SET
          status = $status,
          applied_at = $applied_at
        `,
        {
          id: recordId,
          status: status,
          applied_at: new Date().toISOString()
        }
      );

      if (!result[0]?.result?.length) {
        throw new Error(`No record found with ID ${recordId}`);
      }
    } catch (error) {
      throw new Error(`Failed to update migration status: ${error.message}`);
    }
  }
}