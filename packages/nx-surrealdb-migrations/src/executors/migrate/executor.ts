import { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SurrealDBClient, MigrationParser, MigrationTracker, SurrealDBConfig } from '../../lib';

export interface MigrateExecutorSchema extends SurrealDBConfig {
  migrationsDir?: string;
}

export default async function runExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
  if (!projectRoot) {
    throw new Error(`Project ${context.projectName} not found in project graph`);
  }
  const migrationsPath = path.join(context.root, projectRoot, options.migrationsDir || 'migrations');

  const client = new SurrealDBClient();
  try {
    await client.connect(options);
    const tracker = new MigrationTracker(client);
    await tracker.initialize();

    const applied = await tracker.getAppliedMigrations();
    const files = (await fs.readdir(migrationsPath))
      .filter(f => f.endsWith('_up.surql'))
      .filter(f => !applied.some(m => m.filename === f))
      .sort();

    for (const file of files) {
      console.log(`Applying migration: ${file}`);
      const content = await fs.readFile(path.join(migrationsPath, file), 'utf-8');
      const migration = MigrationParser.parse(content, file);

      try {
        const statements = MigrationParser.splitStatements(migration.up);
        for (const statement of statements) {
          await client.query(statement);
        }
        await tracker.recordMigration(migration);
        console.log(`✅ Applied: ${file}`);
      } catch (error) {
        console.error(`❌ Failed: ${file}`, error);
        return { success: false };
      }
    }

    return { success: true };
  } finally {
    await client.close();
  }
}