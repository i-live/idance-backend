// packages/nx-surrealdb-migrations/src/executors/rollback/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { join } from 'path';
import { SurrealDBClient } from '../../lib/client';
import { MigrationRunner } from '../../lib/migration-runner';

export interface RollbackExecutorSchema {
  migrationsPath: string;
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
}

export default async function runExecutor(
  options: RollbackExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const client = new SurrealDBClient();
  const migrationsPath = join(context.root, options.migrationsPath || 'database/migrations');

  try {
    // Connect to SurrealDB
    await client.connect({
      url: options.url,
      namespace: options.namespace,
      database: options.database,
      username: options.username,
      password: options.password
    });

    const runner = new MigrationRunner(client, migrationsPath);
    const applied = await runner.getAppliedMigrations();

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return { success: true };
    }

    // Get the last applied migration
    const lastMigration = applied[applied.length - 1];
    const migration = await runner.parseMigrationFile(lastMigration.filename);
    await runner.rollbackMigration(migration);

    console.log('✅ Rollback completed successfully');
    return { success: true };
  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    return { success: false };
  } finally {
    await client.close();
  }
}