// packages/nx-surrealdb-migrations/src/executors/status/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { join } from 'path';
import { readdir } from 'fs/promises';
import { SurrealDBClient } from '../../lib/client';
import { MigrationRunner } from '../../lib/migration-runner';

export interface StatusExecutorSchema {
  migrationsPath: string;
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
  verbose?: boolean;
}

export default async function runExecutor(
  options: StatusExecutorSchema,
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
    const files = await readdir(migrationsPath);
    const pending = files
      .filter(f => f.endsWith('.surql'))
      .filter(f => !applied.some(m => m.filename === f))
      .sort();

    console.log('Migration Status:');
    console.log('================');
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending: ${pending.length}`);

    if (options.verbose) {
      console.log('\nApplied Migrations:');
      applied.forEach(m => {
        console.log(`  ✅ ${m.filename} (${m.executed_at})`);
      });
      console.log('\nPending Migrations:');
      pending.forEach(f => {
        console.log(`  ⏳ ${f}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Status check failed: ${error.message}`);
    return { success: false };
  } finally {
    await client.close();
  }
}