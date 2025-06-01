// packages/nx-surrealdb-migrations/src/lib/client.ts
import { Surreal } from 'surrealdb';

export interface SurrealDBConfig {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
}

export class SurrealDBClient {
  private db: Surreal;
  private connected: boolean = false;

  constructor() {
    this.db = new Surreal();
  }

  async connect(config: SurrealDBConfig): Promise<void> {
    try {
      await this.db.connect(config.url);
      await this.db.signin({
        username: config.username,
        password: config.password
      });
      await this.db.use({
        namespace: config.namespace,
        database: config.database
      });
      this.connected = true;
      console.log('✅ Connected to SurrealDB');
    } catch (error) {
      throw new Error(`Failed to connect to SurrealDB: ${error.message}`);
    }
  }

  async query(sql: string): Promise<any> {
    if (!this.connected) {
      throw new Error('SurrealDB client not connected');
    }
    try {
      const result = await this.db.query(sql);
      return result;
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.db.close();
      this.connected = false;
      console.log('✅ SurrealDB connection closed');
    }
  }
}