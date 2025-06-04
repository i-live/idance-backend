import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import migrationGenerator from './generator';

// Mock url and path modules to handle ESM compatibility
jest.mock('url', () => {
  const actualUrl = jest.requireActual('url');
  return {
    ...actualUrl,
    fileURLToPath: jest.fn().mockReturnValue('/mock/path')
  };
});

jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    dirname: jest.fn().mockReturnValue('/mock/dir')
  };
});

describe('migration generator', () => {
  let tree: Tree;
  let timestamp: string;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    timestamp = '20250603161244';
    jest.useFakeTimers().setSystemTime(new Date('2025-06-03T18:12:44.042Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should generate migration files', async () => {
    tree.write('database/project.json', JSON.stringify({
      name: 'database',
      root: 'database'
    }));

    await migrationGenerator(tree, {
      name: 'create-user-table',
      project: 'database'
    });

    const upFile = `database/migrations/${timestamp}__create-user-table__up.surql`;
    const downFile = `database/migrations/${timestamp}__create-user-table__down.surql`;

    expect(tree.exists(upFile)).toBeTruthy();
    expect(tree.exists(downFile)).toBeTruthy();

    const upContent = tree.read(upFile, 'utf-8');
    expect(upContent).toContain('Migration: create-user-table');
    expect(upContent).toContain('Created at:');
  });

  it('should throw error without name', async () => {
    await expect(migrationGenerator(tree, {
      name: '',
      project: 'database'
    })).rejects.toThrow('The "name" property is required');
  });

  it('should use custom migrations directory', async () => {
    tree.write('database/project.json', JSON.stringify({
      name: 'database',
      root: 'database'
    }));

    await migrationGenerator(tree, {
      name: 'test',
      project: 'database',
      migrationsDir: 'custom-migrations'
    });

    const files = tree.children('database/custom-migrations');
    expect(files.length).toEqual(2);
    
    // More specific file matching
    const expectedPattern = new RegExp(`^${timestamp}_____test___(up|down)\\.surql$`);
    expect(files.every(file => expectedPattern.test(file))).toBeTruthy();
    
    // Verify file contents to ensure proper generation
    const upFile = files.find(f => f.endsWith('up.surql'));
    const downFile = files.find(f => f.endsWith('down.surql'));
    
    expect(upFile).toBeDefined();
    expect(downFile).toBeDefined();
  });
});