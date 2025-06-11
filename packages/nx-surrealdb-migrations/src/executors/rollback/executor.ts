import { ExecutorContext } from '@nx/devkit';

export interface RollbackExecutorSchema {
  // TODO: Add schema properties for rollback executor
  module?: string;
  target?: string;
  step?: number;
  last?: boolean;
}

export default async function runExecutor(
  options: RollbackExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  console.log('Rollback executor not yet implemented');
  return { success: false };
}