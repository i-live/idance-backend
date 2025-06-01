// packages/nx-surrealdb-migrations/src/lib/types.ts
export interface Migration {
  id: string;
  name: string;
  filename: string;
  up: string;
  down?: string;
  checksum: string;
  executed_at?: string;
}