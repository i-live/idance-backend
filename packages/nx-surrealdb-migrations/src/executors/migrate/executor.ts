import { ExecutorContext } from '@nx/devkit';

export interface MigrateExecutorSchema {
  // TODO: Add schema properties for migrate executor
  module?: string;
  target?: string;
  step?: number;
  all?: boolean;
}

export default async function runExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  console.log('Migrate executor not yet implemented');
  return { success: false };
}