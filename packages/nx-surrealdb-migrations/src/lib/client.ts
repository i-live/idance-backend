import { Surreal } from 'surrealdb';
import { SurrealDBConfig, SurrealQueryResult } from './types';

export class SurrealDBClient {
  private db: Surreal;

  constructor() {
    this.db = new Surreal();
  }

  async connect(config: SurrealDBConfig) {
    try {
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
      throw new Error(`Failed to connect to SurrealDB: ${error.message}`);
    }
  }

  async query(sql: string): Promise<SurrealQueryResult[]> {
    try {
      return await this.db.query(sql);
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async close() {
    await this.db.close();
  }
}