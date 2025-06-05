export interface SurrealDBConfig {
  url?: string;
  namespace?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface Migration {
  id: string;
  path: string;
  file: string;
  number: string;
  name: string;
  direction: string;
  status: string;
  checksum: string;
  applied_at?: string;
  applied_by?: string;
  execution_time_ms?: number;
}

// Type for SurrealDB query response
export interface SurrealQueryResult {
  result: any[]; // Can be refined based on specific query (e.g., Migration[])
  status?: string;
  [key: string]: any; // Allow additional properties
}