import * as path from 'path';
import { ExecutorContext } from '@nx/devkit';

export function getProjectRoot(context: ExecutorContext): string {
  const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
  if (!projectRoot) {
    throw new Error(`Project ${context.projectName} not found in project graph`);
  }
  return projectRoot;
}

export function resolveProjectPath(context: ExecutorContext, relativePath?: string): string {
  return path.join(getProjectRoot(context), relativePath || '');
}