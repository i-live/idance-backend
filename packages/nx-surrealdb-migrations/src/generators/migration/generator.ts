import {
  Tree,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration
} from '@nx/devkit';
import * as path from 'path';
import { MigrationParser } from '../../lib/migration-parser';

export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  migrationsDir?: string;
  positionalArgs?: string[];
}

function generateUpMigration(options: MigrationGeneratorSchema): string {
  return `-- ${options.name} Up Migration
-- Created at: ${new Date().toISOString()}

-- Add your up migration SQL here
`;
}

function generateDownMigration(options: MigrationGeneratorSchema): string {
  return `-- ${options.name} Down Migration
-- Created at: ${new Date().toISOString()}

-- Add your down migration SQL here
`;
}

export async function migrationGenerator(
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
    throw new Error('The "name" property is required.');
  }

  const projectConfig = readProjectConfiguration(tree, normalizedOptions.project);
  const projectRoot = projectConfig.root;
  const migrationsPath = joinPathFragments(projectRoot, normalizedOptions.migrationsDir || 'migrations');

  const timestamp = new Date().getTime();

  const upFileName = `${timestamp}_${normalizedOptions.name}_up.surql`;
  const downFileName = `${timestamp}_${normalizedOptions.name}_down.surql`;

  // Create up migration
  const upContent = generateUpMigration(normalizedOptions);
  tree.write(joinPathFragments(migrationsPath, upFileName), upContent);

  // Create down migration
  const downContent = generateDownMigration(normalizedOptions);
  tree.write(joinPathFragments(migrationsPath, downFileName), downContent);

  // Validate migrations can be parsed
  try {
    MigrationParser.parseUp(upContent, upFileName);
    MigrationParser.parseDown(downContent, downFileName);
  } catch (error) {
    throw new Error(`Generated invalid migration files: ${error.message}`);
  }

  await formatFiles(tree);
}