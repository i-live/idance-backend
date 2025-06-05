import { Surreal } from 'surrealdb';
import { SurrealDBConfig, SurrealQueryResult } from './types';

export class SurrealDBClient {
  private db: Surreal;
  public username?: string;
  public namespace?: string;
  public database?: string;

  constructor() {
    this.db = new Surreal();
  }

  async create(table: string, data: Record<string, unknown>): Promise<void> {
    try {
      await this.db.create(table, data as Record<string, unknown>); // Cast to any if library expects it, or ensure library handles unknown
    } catch (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }
  }

  async connect(config: SurrealDBConfig) {
    try {
      console.log('Attempting to connect with config:', {
        url: config.url,
        namespace: config.namespace,
        database: config.database,
        username: config.username,
        // Don't log the actual password
        hasPassword: !!config.password
      });
      
      await this.db.connect(config.url);
      await this.db.signin({
        username: config.username,
        password: config.password,
      });
      await this.db.use({
        namespace: config.namespace,
        database: config.database,
      });

      // Store connection details
      this.username = config.username;
      this.namespace = config.namespace;
      this.database = config.database;
    } catch (error) {
      console.error('Connection error details:', error);
      throw new Error(`Failed to connect to SurrealDB: ${error.message}`);
    }
  }

  async query(sql: string, params?: Record<string, unknown>): Promise<SurrealQueryResult[]> {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async close() {
    await this.db.close();
  }
}