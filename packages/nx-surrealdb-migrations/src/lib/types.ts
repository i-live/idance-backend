export interface SurrealDBConfig {
  url?: string;
  namespace?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface Migration {
  id: string;
  name: string;
  filename: string;
  up: string;
  down?: string;
  checksum: string;
  applied_at?: string;
}

// Type for SurrealDB query response
export interface SurrealQueryResult {
  result: any[]; // Can be refined based on specific query (e.g., Migration[])
  status?: string;
  [key: string]: any; // Allow additional properties
}