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
  // Normalize options to handle positional argument
  const normalizedOptions = {
    ...options,
    name: options.name || (options as any).positionalArgs?.[0] || '', // Fallback for positional argument
  };

  if (!normalizedOptions.name) {
    throw new Error('The "name" property is required. Provide it using --name or as a positional argument.');
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const projectConfig = readProjectConfiguration(tree, normalizedOptions.project);
  const projectRoot = projectConfig.root;
  const migrationsPath = joinPathFragments(projectRoot, normalizedOptions.migrationsDir || 'migrations');

  generateFiles(tree, joinPathFragments(__dirname, 'files'), migrationsPath, {
    name: normalizedOptions.name,
    timestamp,
    date: new Date().toISOString(),
  });

  await formatFiles(tree);
  return `Created migrations: ${timestamp}_${normalizedOptions.name}_up.surql, ${timestamp}_${normalizedOptions.name}_down.surql`;
}