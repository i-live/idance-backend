export interface SurrealDBConfig {
  url?: string;
  namespace?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface ModuleConfig {
  name: string;
  description: string;
  version: string;
  dependencies: string[];
  migrations: ModuleMigration[];
  tags: string[];
  environments: string[];
}

export interface ModuleMigration {
  id: string;
  description: string;
  timestamp: string;
}

export interface ApplicationConfig {
  name: string;
  description: string;
  modules: string[];
  customMigrations: string[];
  environment: {
    [env: string]: {
      database: string;
      namespace: string;
    };
  };
}

export interface Migration {
  id?: string;
  path: string;
  filename: string;
  number?: string;
  name?: string;
  direction: string;
  content?: string;
  namespace?: string;
  database?: string;
  status: string;
  checksum?: string;
  applied_at?: Date;
  applied_by?: string;
  execution_time_ms?: number;
}

// Type for SurrealDB query response
export interface SurrealQueryResult {
  result: any[]; // Can be refined based on specific query (e.g., Migration[])
  status?: string;
  [key: string]: any; // Allow additional properties
}


