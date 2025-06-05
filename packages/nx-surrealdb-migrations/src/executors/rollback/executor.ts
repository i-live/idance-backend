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

// export interface RollbackExecutorSchema extends SurrealDBConfig {
//   migrationsDir?: string;
// }

// export default async function runExecutor(
//   options: RollbackExecutorSchema,
//   context: ExecutorContext
// ): Promise<{ success: boolean }> {
//   const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
//   if (!projectRoot) {
//     throw new Error(`Project ${context.projectName} not found in project graph`);
//   };
//   const migrationsPath = path.join(context.root, projectRoot, options.migrationsDir || 'migrations');

//   const client = new SurrealDBClient();
//   try {
//     await client.connect(options);
//     const tracker = new MigrationTracker(client);
//     await tracker.initialize();

//     const applied = await tracker.getAppliedMigrations();
//     if (applied.length === 0) {
//       console.log('No migrations to rollback.');
//       return { success: true };
//     }

//     const migrationsToRollback = applied.slice(-1);
//     for (const migration of migrationsToRollback) {
//       const content = await fs.readFile(path.join(migrationsPath, migration.filename.replace('_up.', '_down.')), 'utf8');
//       const parsedMigration = MigrationParser.parseDown(content, migration.filename);
      
//       const processedContent = QueryFileProcessor.process(parsedMigration.up, {
//         defaultNamespace: process.env.SURREALDB_NAMESPACE,
//         defaultDatabase: process.env.SURREALDB_DATABASE
//       });

//       await client.query(processedContent);
//       await tracker.removeMigration(migration.id);
//     }
//     return { success: true };
//   } catch (error) {
//     console.error('Error during rollback:', error);
//     return { success: false };
//   } finally {
//     await client.close();
//   }
// }