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

// Type for INFO FOR DB; response
export interface DbInfoResponse {
  result: {
    accesses?: Record<string, any>;
    analyzers?: Record<string, any>;
    apis?: Record<string, any>;
    buckets?: Record<string, any>;
    configs?: Record<string, any>;
    functions?: Record<string, any>;
    models?: Record<string, any>;
    params?: Record<string, any>;
    tables?: Record<string, any>; // Tables object is optional
    users?: Record<string, any>;
  } | null;
  status?: string;
}