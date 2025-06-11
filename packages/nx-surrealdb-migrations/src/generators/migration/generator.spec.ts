import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { migrationGenerator } from './generator';

// Simple test without complex mocking
describe('migration generator - simple', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate migration files with basic options', async () => {
    tree.write('database/project.json', JSON.stringify({
      name: 'database',
      root: 'database'
    }));

    await migrationGenerator(tree, {
      name: 'create-user-table',
      project: 'database'
    });

    // Just check that files were created
    const files = tree.children('database/migrations');
    expect(files.length).toBe(2);
    expect(files.some(f => f.includes('create-user-table') && f.includes('up'))).toBe(true);
    expect(files.some(f => f.includes('create-user-table') && f.includes('down'))).toBe(true);
  });

  it('should throw error without name', async () => {
    await expect(migrationGenerator(tree, {
      name: '',
      project: 'database'
    })).rejects.toThrow('The "name" property is required');
  });
});