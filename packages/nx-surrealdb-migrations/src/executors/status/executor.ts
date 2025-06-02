import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBConfig, SurrealDBClient, MigrationTracker } from '../../lib';

export interface StatusExecutorSchema extends SurrealDBConfig {
  migrationsDir?: string;
  verbose?: boolean;
}

export default async function runExecutor(
  options: StatusExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
  if (!projectRoot) {
    throw new Error(`Project ${context.projectName} not found in project graph`);
  };
  const migrationsPath = path.join(context.root, projectRoot, options.migrationsDir || 'migrations');

  const client = new SurrealDBClient();
  try {
    await client.connect(options);
    const tracker = new MigrationTracker(client);
    await tracker.initialize();

    const applied = await tracker.getAppliedMigrations();
    const files = (await fs.readdir(migrationsPath))
      .filter(f => f.endsWith('_up.surql'))
      .sort();
    const pending = files.filter(f => !applied.some(m => m.filename === f));

    console.log('Migration Status:');
    console.log('================');
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending: ${pending.length}`);

    if (options.verbose) {
      console.log('\nApplied Migrations:');
      applied.forEach(m => {
        console.log(`  ✅ ${m.filename} (${m.applied_at})`);
      });

      console.log('\nPending Migrations:');
      pending.forEach(f => {
        console.log(`  ⏳ ${f}`);
      });
    }

    return { success: true };
  } finally {
    await client.close();
  }
}