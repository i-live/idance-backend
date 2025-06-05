// import { ExecutorContext } from '@nx/devkit';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { 
//   SurrealDBConfig, 
//   SurrealDBClient, 
//   MigrationParser, 
//   MigrationTracker 
// } from '../../lib';
// import { QueryFileProcessor } from '../../lib/query-file-processor';

// export interface MigrateExecutorSchema extends SurrealDBConfig {
//   migrationsDir?: string;
// }

// export default async function runExecutor(
//   options: MigrateExecutorSchema,
//   context: ExecutorContext
// ): Promise<{ success: boolean }> {
//   const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
//   if (!projectRoot) {
//     throw new Error(`Project ${context.projectName} not found in project graph`);
//   }

//   const migrationsPath = path.join(context.root, projectRoot, options.migrationsDir || 'migrations');
//   const client = new SurrealDBClient();

//   try {
//     await client.connect(options);
//     const tracker = new MigrationTracker(client);
//     await tracker.initialize();

//     // Get all migration files
//     const files = (await fs.readdir(migrationsPath))
//       .filter(f => f.endsWith('_up.surql'))
//       .sort();

//     // Get applied migrations
//     const applied = await tracker.getAppliedMigrations();
//     const appliedFilenames = applied.map(m => m.filename);

//     // Determine pending migrations
//     const pendingMigrations = files.filter(f => !appliedFilenames.includes(f));

//     if (pendingMigrations.length === 0) {
//       console.log('No pending migrations.');
//       return { success: true };
//     }

//     console.log(`Found ${pendingMigrations.length} pending migration(s)`);

//     for (const file of pendingMigrations) {
//       console.log(`Processing ${file}...`);
//       const content = await fs.readFile(path.join(migrationsPath, file), 'utf8');
//       const migration = MigrationParser.parseUp(content, file);
      
//       const processedContent = QueryFileProcessor.process(migration.up, {
//         defaultNamespace: process.env.SURREALDB_NAMESPACE,
//         defaultDatabase: process.env.SURREALDB_DATABASE
//       });

//       await client.query(processedContent);
//       await tracker.recordMigration(migration);
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Error during migration:', error);
//     return { success: false };
//   } finally {
//     await client.close();
//   }
// }