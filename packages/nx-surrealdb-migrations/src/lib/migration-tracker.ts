import { Migration } from './types';
import { SurrealDBClient } from './client';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MigrationTracker {
  constructor(
    private client: SurrealDBClient,
    private schemaPath?: string
  ) {}

  async initialize(): Promise<void> {
    // Default schema path relative to the plugin
    const defaultSchemaPath = path.join(__dirname, '../schema/system_migrations.surql');
    const schemaFile = this.schemaPath || defaultSchemaPath;

    try {
      // Read the schema file
      const schemaQuery = await fs.readFile(schemaFile, 'utf8');

      // Basic validation to ensure required fields are defined
      const requiredFields = ['number', 'name', 'direction', 'filename', 'path', 'content', 'status', 'applied_at'];
      for (const field of requiredFields) {
        if (!schemaQuery.includes(`DEFINE FIELD IF NOT EXISTS ${field} ON system_migrations`)) {
          throw new Error(`Schema file ${schemaFile} is missing required field: ${field}`);
        }
      }

      // Execute the schema query
      await this.client.query(schemaQuery);
      console.log('Initialized system_migrations table');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Schema file not found: ${schemaFile}`);
      }
      throw new Error(`Failed to initialize system_migrations table: ${error.message}`);
    }
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

    await this.client.create("system_migrations", {
      number: migration.number,
      name: migration.name,
      direction: migration.direction ?? 'up',
      filename: migration.filename,
      path: migration.path,
      content: migration.content,
      checksum: migration.checksum,
      status: migration.status ?? 'success',
      applied_by: this.client.username,
      execution_time_ms: migration.execution_time_ms
    });
  }

  async getMigrationStatus(direction: string, number: string, name: string, filename?: string):
  Promise<Migration | null> {
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
      SELECT * FROM system_migrations 
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
        SELECT * FROM system_migrations 
        WHERE direction = $direction 
        AND path = $path
        ORDER BY number ASC
        `,
        { direction, path }
      );
      
      return (result[0]?.result || []).map((m: Migration) => ({
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
    if (!recordId.startsWith('system_migrations:') || recordId.length < 18) {
      throw new Error('Invalid record ID format. Expected system_migrations:<uuid>');
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