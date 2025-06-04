import * as dotenv from 'dotenv';
import * as path from 'path';
import { ExecutorContext } from '@nx/devkit';

export function loadEnvFile(context: ExecutorContext): void {
  dotenv.config({ path: path.join(context.root, '.env') });
}

export function replaceEnvVars(content: string): string {
  return content.replace(/\${([^}]+)}/g, (match, key) => {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  });
}