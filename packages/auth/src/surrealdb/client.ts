import { Surreal } from 'surrealdb'

export interface SurrealDBConfig {
  url: string
  namespace: string
  database: string
  jwtSecret?: string
  workerJwtSecret?: string
}

export class SurrealDBClient {
  private static instance: SurrealDBClient
  private db: Surreal
  private config: SurrealDBConfig
  private isConnected = false

  private constructor(config: SurrealDBConfig) {
    this.db = new Surreal()
    this.config = config
  }

  public static getInstance(config?: SurrealDBConfig): SurrealDBClient {
    if (!SurrealDBClient.instance) {
      if (!config) {
        throw new Error('SurrealDBClient config is required for first initialization')
      }
      SurrealDBClient.instance = new SurrealDBClient(config)
    }
    return SurrealDBClient.instance
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      await this.db.connect(this.config.url)
      await this.db.use({
        namespace: this.config.namespace,
        database: this.config.database,
      })
      this.isConnected = true
    } catch (error) {
      console.error('Failed to connect to SurrealDB:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.db.close()
      this.isConnected = false
    }
  }

  public getDB(): Surreal {
    if (!this.isConnected) {
      throw new Error('SurrealDB client is not connected. Call connect() first.')
    }
    return this.db
  }

  public async signUp(credentials: {
    access: 'username_password' | 'oauth'
    email: string
    password?: string
    username?: string
    first_name?: string
    last_name?: string
    provider?: string
    provider_id?: string
    name?: string
    picture?: string
  }): Promise<any> {
    await this.connect()
    return await this.db.signup({
      namespace: this.config.namespace,
      database: this.config.database,
      access: credentials.access,
      variables: {
        email: credentials.email,
        password: credentials.password,
        username: credentials.username,
        first_name: credentials.first_name,
        last_name: credentials.last_name,
        provider: credentials.provider,
        provider_id: credentials.provider_id,
        name: credentials.name,
        picture: credentials.picture,
      }
    })
  }

  public async signIn(credentials: {
    access: 'username_password' | 'oauth'
    email?: string
    password?: string
    provider?: string
    provider_id?: string
  }): Promise<any> {
    await this.connect()
    return await this.db.signin({
      namespace: this.config.namespace,
      database: this.config.database,
      access: credentials.access,
      variables: {
        email: credentials.email,
        password: credentials.password,
        provider: credentials.provider,
        provider_id: credentials.provider_id,
      }
    })
  }

  public async authenticate(token: string): Promise<any> {
    await this.connect()
    return await this.db.authenticate(token)
  }

  public async query(sql: string, vars?: Record<string, any>): Promise<any> {
    await this.connect()
    return await this.db.query(sql, vars)
  }

  public async select(table: string): Promise<any> {
    await this.connect()
    return await this.db.select(table)
  }

  public async create(table: string, data: Record<string, any>): Promise<any> {
    await this.connect()
    return await this.db.create(table, data)
  }

  public async update(id: string, data: Record<string, any>): Promise<any> {
    await this.connect()
    return await this.db.update(id, data)
  }

  public async delete(id: string): Promise<any> {
    await this.connect()
    return await this.db.delete(id)
  }
}

// Default configuration factory
export function createSurrealDBConfig(): SurrealDBConfig {
  const url = process.env.SURREALDB_URL || process.env.NEXT_PUBLIC_SURREALDB_URL
  const namespace = process.env.SURREALDB_NAMESPACE || 'idance'
  const database = process.env.SURREALDB_DATABASE || 'dev'
  const jwtSecret = process.env.SURREALDB_JWT_SECRET
  const workerJwtSecret = process.env.SURREALDB_WORKER_JWT_SECRET

  if (!url) {
    throw new Error('SURREALDB_URL or NEXT_PUBLIC_SURREALDB_URL environment variable is required')
  }

  return {
    url,
    namespace,
    database,
    jwtSecret,
    workerJwtSecret,
  }
}

// Export a default instance getter
export function getSurrealDB(): SurrealDBClient {
  const config = createSurrealDBConfig()
  return SurrealDBClient.getInstance(config)
}