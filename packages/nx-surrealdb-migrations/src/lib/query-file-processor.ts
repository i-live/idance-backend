import { replaceEnvVars } from './env';

export interface QueryFileContext {
  defaultNamespace?: string;
  defaultDatabase?: string;
}

export class QueryFileProcessor {
  private static readonly NAMESPACE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+NAMESPACE/i;
  private static readonly DATABASE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+DATABASE/i;

  static process(fileContent: string, context: QueryFileContext): string {
    const processedContent = replaceEnvVars(fileContent);
    
    const hasNamespaceOperation = this.NAMESPACE_OPERATIONS.test(processedContent);
    const hasDatabaseOperation = this.DATABASE_OPERATIONS.test(processedContent);
    
    const prefixStatements = [];
    if (!hasNamespaceOperation && context.defaultNamespace) {
      prefixStatements.push(`USE NAMESPACE ${context.defaultNamespace};`);
    }
    if (!hasDatabaseOperation && context.defaultDatabase) {
      prefixStatements.push(`USE DATABASE ${context.defaultDatabase};`);
    }

    return [
      ...prefixStatements,
      processedContent
    ].join('\n');
  }
}