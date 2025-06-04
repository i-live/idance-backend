import { replaceEnvVars } from './env';

export interface QueryFileContext {
  defaultNamespace?: string;
  defaultDatabase?: string;
  useTransactions?: boolean;
}

export class QueryFileProcessor {
  private static readonly NAMESPACE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+NAMESPACE/i;
  private static readonly DATABASE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+DATABASE/i;
  private static readonly DDL_OPERATIONS = /^\s*(DEFINE|REMOVE)\s+(NAMESPACE|DATABASE|TABLE|FIELD|INDEX|FUNCTION)/im;
  private static readonly TRANSACTION_BEGIN = /BEGIN\s+TRANSACTION/i;
  private static readonly TRANSACTION_COMMIT = /COMMIT\s+TRANSACTION/i;

  static process(content: string, context: QueryFileContext): string {
    const processed = replaceEnvVars(content);
    const statements: string[] = [];

    // Check operations in content
    const hasNamespaceOperation = this.NAMESPACE_OPERATIONS.test(processed);
    const hasDatabaseOperation = this.DATABASE_OPERATIONS.test(processed);
    const hasDDLOperation = this.DDL_OPERATIONS.test(processed);
    const hasBeginTransaction = this.TRANSACTION_BEGIN.test(processed);
    const hasCommitTransaction = this.TRANSACTION_COMMIT.test(processed);
    
    // Add context statements if needed
    if (!hasNamespaceOperation && context.defaultNamespace) {
      statements.push(`USE NAMESPACE ${context.defaultNamespace};`);
    }
    if (!hasDatabaseOperation && context.defaultDatabase) {
      statements.push(`USE DATABASE ${context.defaultDatabase};`);
    }

    // Handle content based on operation type
    if (hasDDLOperation || !context.useTransactions || hasBeginTransaction || hasCommitTransaction) {
      statements.push(processed);
    } else {
      statements.push('BEGIN TRANSACTION;');
      statements.push(processed);
      statements.push('COMMIT TRANSACTION;');
    }

    return statements.join('\n\n');
  }
}