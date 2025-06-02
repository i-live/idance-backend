import { Tree, readProjectConfiguration, formatFiles, joinPathFragments } from '@nx/devkit';

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

async function generateMigration() {
  const tree = new MockTree();
  tree.write('database/project.json', JSON.stringify({
    name: 'database',
    root: 'database',
    sourceRoot: 'database'
  }));
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
  const options = { name: 'create-users-table', project: 'database' };
  const filename = `${timestamp}_${options.name}.surql`;
  const projectRoot = readProjectConfiguration(tree, options.project).root;
  const filePath = joinPathFragments(projectRoot, 'migrations', filename);
  const content = `-- Migration: ${options.name}\n-- Created: ${new Date().toISOString()}\n\n-- UP\n-- Add your migration SQL here\n`;
  tree.write(filePath, content);
  await formatFiles(tree);
  console.log(tree.read(filePath).toString());
}

generateMigration().catch(console.error);
