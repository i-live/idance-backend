import { Tree, readProjectConfiguration, formatFiles, joinPathFragments } from '@nx/devkit';
import migrationGenerator from './dist/packages/nx-surrealdb-migrations/src/generators/migration/generator';

class MockTree implements Tree {
  private files: Map<string, string> = new Map();

  write(path: string, content: string): void {
    this.files.set(path, content);
  }

  read(path: string): Buffer | null {
    const content = this.files.get(path);
    return content ? Buffer.from(content) : null;
  }

  exists(path: string): boolean {
    return this.files.has(path);
  }

  delete(path: string): void {}
  rename(from: string, to: string): void {}
  changePermissions(path: string, mode: string): void {}
  children(dirPath: string): string[] { return []; }
  isFile(path: string): boolean { return true; }
  listChanges(): any[] { return []; }
}

async function test() {
  const tree = new MockTree();
  tree.write('database/project.json', JSON.stringify({
    name: 'database',
    root: 'database',
    sourceRoot: 'database'
  }));
  await migrationGenerator(tree, { name: 'test-migration', project: 'database' });
  const content = tree.read('database/migrations/20250602_test-migration.surql')?.toString() || 'File not created';
  console.log(content);
}

test().catch(console.error);
