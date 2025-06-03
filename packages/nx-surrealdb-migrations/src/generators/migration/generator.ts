import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration
} from '@nx/devkit';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  migrationsDir?: string;
  positionalArgs?: string[];
}

export default async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<void> {
  const normalizedOptions = {
    ...options,
    name: options.name || options.positionalArgs?.[0] || '',
    project: options.project,
    migrationsDir: options.migrationsDir
  };

  if (!normalizedOptions.name) {
    throw new Error('The "name" property is required. Provide it using --name or as a positional argument.');
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const projectConfig = readProjectConfiguration(tree, normalizedOptions.project);
  const projectRoot = projectConfig.root;
  const migrationsPath = joinPathFragments(projectRoot, normalizedOptions.migrationsDir || 'migrations');

  const moduleDir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

  console.log('Template path:', joinPathFragments(moduleDir, 'files'));
  console.log('Output path:', migrationsPath);
  console.log('Variables:', {
    name: normalizedOptions.name,
    timestamp,
    date: new Date().toISOString(),
  });

  generateFiles(tree, joinPathFragments(moduleDir, 'files'), migrationsPath, {
    name: normalizedOptions.name,
    timestamp,
    date: new Date().toISOString(),
  });

  await formatFiles(tree);
}