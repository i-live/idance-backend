import * as fs from 'fs/promises';

export async function resolveDefaultPath(basePath: string): Promise<string> {
  const subDirs = await fs.readdir(basePath, { withFileTypes: true })
    .then(dirs => dirs.filter(dir => dir.isDirectory()).map(dir => dir.name));
  const sortedDirs = subDirs.sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
    return numB - numA; // Highest number first
  });
  return sortedDirs[0] || 'unknown';
}