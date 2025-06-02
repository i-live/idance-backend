import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBConfig, SurrealDBClient, MigrationParser, MigrationTracker } from '../../lib';

export interface RollbackExecutorSchema extends SurrealDBConfig {
  migrationsDir?: string;
}

export default async function runExecutor(
  options: RollbackExecutorSchema,
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
    if (applied.length === 0) {
      console.log('No migrations to rollback.');
      return { success: true };
    }

    const lastMigration = applied[applied.length - 1];
    const downFile = lastMigration.filename.replace('_up.surql', '_down.surql');
    const downFilePath = path.join(migrationsPath, downFile);

    try {
      const content = await fs.readFile(downFilePath, 'utf-8');
      const migration = MigrationParser.parseDown(content, downFile);

      console.log(`Rolling back migration: ${lastMigration.filename}`);
      const statements = MigrationParser.splitStatements(migration.up);
      for (const statement of statements) {
        await client.query(statement);
      }
      await tracker.removeMigration(lastMigration.id);
      console.log(`✅ Rolled back: ${lastMigration.filename}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to rollback: ${lastMigration.filename}`, error);
      return { success: false };
    }
  } finally {
    await client.close();
  }
}