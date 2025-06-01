// packages/nx-surrealdb-migrations/src/executors/migrate/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { join } from 'path';
import { readdir } from 'fs/promises';
import { SurrealDBClient } from '../../lib/client';
import { MigrationRunner } from '../../lib/migration-runner';

export interface MigrateExecutorSchema {
  migrationsPath: string;
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
}

export default async function runExecutor(
  options: MigrateExecutorSchema,
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
    await runner.ensureMigrationTable();

    // Get applied and pending migrations
    const applied = await runner.getAppliedMigrations();
    const files = await readdir(migrationsPath);
    const pending = files
      .filter(f => f.endsWith('.surql'))
      .filter(f => !applied.some(m => m.filename === f))
      .sort();

    // Apply pending migrations
    for (const file of pending) {
      console.log(`Applying migration: ${file}`);
      const migration = await runner.parseMigrationFile(file);
      await runner.runMigration(migration);
    }

    console.log('✅ All migrations applied successfully');
    return { success: true };
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    return { success: false };
  } finally {
    await client.close();
  }
}