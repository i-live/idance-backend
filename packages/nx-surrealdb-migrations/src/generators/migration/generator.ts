import { Tree, formatFiles, generateFiles, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  migrationsDir?: string;
}

export default async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 4);
  const projectRoot = readProjectConfiguration(tree, options.project).root;
  const migrationsPath = joinPathFragments(projectRoot, options.migrationsDir || 'migrations');

  generateFiles(tree, joinPathFragments(__dirname, 'files'), migrationsPath, {
    name: options.name,
    timestamp,
    date: new Date().toISOString(),
  });

  await formatFiles(tree);
  return `Created migrations: ${timestamp}_${options.name}_up.surql, ${timestamp}_${options.name}_down.surql`;
}