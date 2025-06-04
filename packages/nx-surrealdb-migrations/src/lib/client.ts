import { Surreal } from 'surrealdb';
import { SurrealDBConfig, SurrealQueryResult } from './types';

export class SurrealDBClient {
  private db: Surreal;

  constructor() {
    this.db = new Surreal();
  }

  async connect(config: SurrealDBConfig) {
    try {
      console.log('Attempting to connect with config:', {
        url: config.url,
        namespace: config.namespace,
        database: config.database,
        username: config.username,
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
    } catch (error) {
      console.error('Connection error details:', error);
      throw new Error(`Failed to connect to SurrealDB: ${error.message}`);
    }
  }

  async query(sql: string, vars?: Record<string, unknown>): Promise<SurrealQueryResult[]> {
    try {
      return await this.db.query(sql, vars);
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async close() {
    await this.db.close();
  }
}