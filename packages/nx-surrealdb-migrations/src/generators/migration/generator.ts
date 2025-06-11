import {
  Tree,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration
} from '@nx/devkit';

export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  module?: string | number;
  migrationsDir?: string;
  createModule?: boolean;
  positionalArgs?: string[];
}

interface ModuleInfo {
  moduleId: string;
  modulePath: string;
  nextMigrationNumber: string;
}

function generateUpMigration(options: MigrationGeneratorSchema, moduleInfo: ModuleInfo): string {
  return `-- Migration: ${options.name}
-- Module: ${moduleInfo.moduleId}
-- Number: ${moduleInfo.nextMigrationNumber}
-- Created at: ${new Date().toISOString()}

-- Add your up migration SQL here
-- Example:
-- DEFINE TABLE example SCHEMAFULL;
-- DEFINE FIELD name ON example TYPE string;
`;
}

function generateDownMigration(options: MigrationGeneratorSchema, moduleInfo: ModuleInfo): string {
  return `-- Migration: ${options.name}
-- Module: ${moduleInfo.moduleId}
-- Number: ${moduleInfo.nextMigrationNumber}
-- Created at: ${new Date().toISOString()}

-- Add your down migration SQL here
-- Example:
-- REMOVE TABLE example;
`;
}

async function resolveModuleInfo(
  tree: Tree,
  migrationsPath: string,
  modulePattern?: string | number,
  createModule?: boolean
): Promise<ModuleInfo> {
  // Check if we have a specific module pattern
  if (modulePattern) {
    // Try to find existing module
    const existingModule = await findExistingModule(tree, migrationsPath, String(modulePattern));
    if (existingModule) {
      const nextNumber = await getNextMigrationNumber(tree, existingModule.modulePath);
      return {
        moduleId: existingModule.moduleId,
        modulePath: existingModule.modulePath,
        nextMigrationNumber: nextNumber
      };
    }
    
    // Module doesn't exist
    if (createModule) {
      return await createNewModule(tree, migrationsPath, String(modulePattern));
    } else {
      throw new Error(`Module '${modulePattern}' not found. Use --createModule to create it.`);
    }
  }
  
  // No module specified - find the highest numbered existing module
  const existingModules = await discoverExistingModules(tree, migrationsPath);
  if (existingModules.length === 0) {
    // No modules exist, create first one
    return await createNewModule(tree, migrationsPath, '000_admin');
  }
  
  // Use the highest numbered module
  const lastModule = existingModules[existingModules.length - 1];
  const nextNumber = await getNextMigrationNumber(tree, lastModule.modulePath);
  return {
    moduleId: lastModule.moduleId,
    modulePath: lastModule.modulePath,
    nextMigrationNumber: nextNumber
  };
}

async function findExistingModule(
  tree: Tree,
  migrationsPath: string,
  pattern: string
): Promise<{ moduleId: string; modulePath: string } | null> {
  const modules = await discoverExistingModules(tree, migrationsPath);
  
  const normalizedPattern = pattern.trim().toLowerCase();
  const patternAsNumber = parseInt(normalizedPattern, 10);
  const normalizedPatternNumber = isNaN(patternAsNumber) ? null : patternAsNumber.toString();
  
  for (const module of modules) {
    const match = module.moduleId.match(/^(\d{1,4})_(.+)$/);
    if (!match) continue;
    
    const [, number, name] = match;
    const normalizedNumber = parseInt(number, 10).toString();
    
    if (
      module.moduleId.toLowerCase() === normalizedPattern ||
      (normalizedPatternNumber !== null && normalizedPatternNumber === normalizedNumber) ||
      normalizedPattern === name.toLowerCase() ||
      normalizedPattern === `${normalizedNumber}_${name.toLowerCase()}` ||
      normalizedPattern === `${number}_${name.toLowerCase()}`
    ) {
      return module;
    }
  }
  
  return null;
}

async function discoverExistingModules(
  tree: Tree,
  migrationsPath: string
): Promise<{ moduleId: string; modulePath: string }[]> {
  const modules: { moduleId: string; modulePath: string }[] = [];
  
  if (!tree.exists(migrationsPath)) {
    return modules;
  }
  
  const children = tree.children(migrationsPath);
  for (const child of children) {
    const fullPath = joinPathFragments(migrationsPath, child);
    if (tree.isFile(fullPath)) continue;
    
    // Check if it matches module pattern XXX_name
    if (/^\d{1,4}_/.test(child)) {
      modules.push({
        moduleId: child,
        modulePath: fullPath
      });
    }
  }
  
  return modules.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
}

async function createNewModule(
  tree: Tree,
  migrationsPath: string,
  pattern: string
): Promise<ModuleInfo> {
  // Parse the pattern to determine module ID
  let moduleId: string;
  
  if (/^\d{1,4}_/.test(pattern)) {
    // Already in XXX_name format
    moduleId = pattern;
  } else {
    // Need to determine next available number
    const existingModules = await discoverExistingModules(tree, migrationsPath);
    const nextNumber = getNextModuleNumber(existingModules);
    
    const cleanName = pattern.replace(/^\d+_?/, '').toLowerCase();
    moduleId = `${nextNumber.toString().padStart(3, '0')}_${cleanName}`;
  }
  
  const modulePath = joinPathFragments(migrationsPath, moduleId);
  
  // Create the module directory
  if (!tree.exists(modulePath)) {
    tree.write(joinPathFragments(modulePath, '.gitkeep'), '');
  }
  
  return {
    moduleId,
    modulePath,
    nextMigrationNumber: '0001'
  };
}

function getNextModuleNumber(existingModules: { moduleId: string }[]): number {
  if (existingModules.length === 0) {
    return 0;
  }
  
  // Find the highest number
  let maxNumber = 0;
  for (const module of existingModules) {
    const match = module.moduleId.match(/^(\d{1,4})_/);
    if (match) {
      const number = parseInt(match[1], 10);
      maxNumber = Math.max(maxNumber, number);
    }
  }
  
  // Return next gapped number (increment by 10)
  return maxNumber + 10;
}

async function getNextMigrationNumber(tree: Tree, modulePath: string): Promise<string> {
  if (!tree.exists(modulePath)) {
    return '0001';
  }
  
  const files = tree.children(modulePath)
    .filter(file => file.endsWith('.surql'))
    .filter(file => /^\d{4}_.*_(up|down)\.surql$/.test(file));
  
  if (files.length === 0) {
    return '0001';
  }
  
  // Find the highest migration number
  let maxNumber = 0;
  for (const file of files) {
    const match = file.match(/^(\d{4})_/);
    if (match) {
      const number = parseInt(match[1], 10);
      maxNumber = Math.max(maxNumber, number);
    }
  }
  
  return (maxNumber + 1).toString().padStart(4, '0');
}

export async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<void> {
  const normalizedOptions = {
    ...options,
    name: options.name || options.positionalArgs?.[0] || '',
    project: options.project,
    migrationsDir: options.migrationsDir || 'migrations',
    module: options.module,
    createModule: options.createModule || false
  };

  if (!normalizedOptions.name) {
    throw new Error('The "name" property is required.');
  }

  // Normalize migration name (replace spaces and special chars with underscores)
  const migrationName = normalizedOptions.name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  const projectConfig = readProjectConfiguration(tree, normalizedOptions.project);
  const projectRoot = projectConfig.root;
  const migrationsPath = joinPathFragments(projectRoot, normalizedOptions.migrationsDir);

  // Resolve module information
  const moduleInfo = await resolveModuleInfo(
    tree,
    migrationsPath,
    normalizedOptions.module,
    normalizedOptions.createModule
  );

  // Generate file names with sequential numbering
  const upFileName = `${moduleInfo.nextMigrationNumber}_${migrationName}_up.surql`;
  const downFileName = `${moduleInfo.nextMigrationNumber}_${migrationName}_down.surql`;

  // Create up migration
  const upContent = generateUpMigration(normalizedOptions, moduleInfo);
  tree.write(joinPathFragments(moduleInfo.modulePath, upFileName), upContent);

  // Create down migration
  const downContent = generateDownMigration(normalizedOptions, moduleInfo);
  tree.write(joinPathFragments(moduleInfo.modulePath, downFileName), downContent);

  // console.log(`Generated migration files:`);
  // console.log(`  Up:   ${moduleInfo.moduleId}/${upFileName}`);
  // console.log(`  Down: ${moduleInfo.moduleId}/${downFileName}`);

  await formatFiles(tree);
}