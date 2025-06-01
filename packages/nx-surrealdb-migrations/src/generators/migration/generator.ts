// packages/nx-surrealdb-migrations/src/generators/migration/generator.ts
import { Tree, formatFiles, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  migrationsDir?: string;
  up?: string;
  down?: string;
}

export async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<void> {
  const timestamp = new Date().toISOString()
    .replace(/[-:T]/g, '')
    .substring(0, 14);
  
  const filename = `${timestamp}_${options.name}.surql`;
  const projectRoot = readProjectConfiguration(tree, options.project).root;
  const filePath = joinPathFragments(
    projectRoot,
    options.migrationsDir || 'database/migrations',
    filename
  );

  const content = `-- Migration: ${options.name}
-- Created: ${new Date().toISOString()}

-- UP
${options.up || '-- Add your migration SQL here'}

${options.down ? `-- DOWN\n${options.down}` : ''}
`;

  tree.write(filePath, content);
  await formatFiles(tree);
}