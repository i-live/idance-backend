import { Surreal } from 'surrealdb'

// Create a singleton SurrealDB client instance
class SurrealDBClient {
  private static instance: SurrealDBClient
  private db: Surreal
  private isConnected: boolean = false

  private constructor() {
    this.db = new Surreal()
  }

  public static getInstance(): SurrealDBClient {
    if (!SurrealDBClient.instance) {
      SurrealDBClient.instance = new SurrealDBClient()
    }
    return SurrealDBClient.instance
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      const url = process.env.SURREALDB_URL || 'ws://localhost:8000/rpc'
      const namespace = process.env.SURREALDB_NAMESPACE || 'idance'
      const database = process.env.SURREALDB_DATABASE || 'dev'
      const username = process.env.SURREALDB_ROOT_USER || 'root'
      const password = process.env.SURREALDB_ROOT_PASS || 'root'

      // Connect to the database
      await this.db.connect(url)

      // Select namespace and database
      await this.db.use({
        namespace,
        database
      })

      // Sign in as root user
      await this.db.signin({
        username,
        password
      })

      this.isConnected = true
      console.log('✅ Connected to SurrealDB')
    } catch (error) {
      console.error('❌ Failed to connect to SurrealDB:', error)
      this.isConnected = false
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.db.close()
      this.isConnected = false
      console.log('🔌 Disconnected from SurrealDB')
    }
  }

  public async query<T = any>(sql: string, vars?: Record<string, any>): Promise<T[]> {
    await this.ensureConnected()
    return this.db.query(sql, vars)
  }

  public async select<T = any>(thing: string): Promise<T[]> {
    await this.ensureConnected()
    const result = await this.db.select(thing)
    return result as T[]
  }

  public async create<T = any>(thing: string, data?: Record<string, any>): Promise<T> {
    await this.ensureConnected()
    const result = await this.db.create(thing, data)
    return result as T
  }

  public async update<T = any>(thing: string, data?: Record<string, any>): Promise<T> {
    await this.ensureConnected()
    const result = await this.db.update(thing, data)
    return result as T
  }

  public async merge<T = any>(thing: string, data?: Record<string, any>): Promise<T> {
    await this.ensureConnected()
    const result = await this.db.merge(thing, data)
    return result as T
  }

  public async delete(thing: string): Promise<void> {
    await this.ensureConnected()
    await this.db.delete(thing)
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect()
    }
  }

  public getDb(): Surreal {
    return this.db
  }

  public isDbConnected(): boolean {
    return this.isConnected
  }
}

// Export singleton instance
export const surrealClient = SurrealDBClient.getInstance()
export default surrealClient