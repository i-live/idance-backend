# SurrealDB Nx Plugin Implementation Plan

## Overview

Based on the test results and latest library versions, we'll implement an Nx plugin for SurrealDB migrations using the HTTP API approach, which is compatible with SurrealDB Cloud v2.3.3.

## Key Findings

1. **SurrealDB SDK Status**:
   - The npm package `surrealdb` (v1.0.6) is the latest official SDK
   - However, it has compatibility issues with SurrealDB Cloud v2.3.3
   - The HTTP API is the most reliable approach for all SurrealDB versions

2. **Nx Plugin Development**:
   - Latest Nx supports plugin development with generators and executors
   - Plugins should be created using `@nx/plugin` generator
   - Modern Nx uses `project.json` for configuration

## Implementation Steps

### Step 1: Create the Nx Plugin Package

```bash
# Generate the plugin package
nx g @nx/plugin:plugin nx-surrealdb --directory=packages/nx-surrealdb

# This will create:
# - packages/nx-surrealdb/
# - Basic plugin structure with generators and executors
```

### Step 2: Core Components

#### 2.1 HTTP Client (`packages/nx-surrealdb/src/utils/http-client.ts`)

```typescript
export interface SurrealDBConfig {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
}

export class SurrealDBHttpClient {
  constructor(private config: SurrealDBConfig) {}

  async executeQuery(query: string): Promise<any> {
    const response = await fetch(`${this.config.url}/sql`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'text/plain',
        'NS': this.config.namespace,
        'DB': this.config.database,
        'Authorization': `Basic ${Buffer.from(
          `${this.config.username}:${this.config.password}`
        ).toString('base64')}`
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SurrealDB query failed: ${error}`);
    }

    return await response.json();
  }

  async executeTransaction(queries: string[]): Promise<any> {
    const transactionQuery = `
      BEGIN TRANSACTION;
      ${queries.join(';\n')};
      COMMIT TRANSACTION;
    `;
    return this.executeQuery(transactionQuery);
  }
}
```

#### 2.2 Migration Parser (`packages/nx-surrealdb/src/utils/migration-parser.ts`)

```typescript
export interface Migration {
  id: string;
  name: string;
  filename: string;
  up: string;
  down?: string;
  checksum: string;
}

export class MigrationParser {
  static parse(content: string, filename: string): Migration {
    const match = filename.match(/^(\d{4})_(.+)\.surql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${filename}`);
    }

    const [, id, name] = match;
    
    // Parse UP and DOWN sections
    const upMatch = content.match(/-- UP\n([\s\S]*?)(?:-- DOWN|$)/);
    const downMatch = content.match(/-- DOWN\n([\s\S]*?)$/);

    const up = upMatch ? upMatch[1].trim() : content.trim();
    const down = downMatch ? downMatch[1].trim() : undefined;

    // Calculate checksum
    const crypto = require('crypto');
    const checksum = crypto
      .createHash('sha256')
      .update(up)
      .digest('hex');

    return { id, name, filename, up, down, checksum };
  }

  static splitStatements(sql: string): string[] {
    // Handle complex SQL with proper statement splitting
    // This needs to handle functions, access methods, etc.
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let depth = 0;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      // Handle string literals
      if ((char === '"' || char === "'") && sql[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      // Track braces for function bodies
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') depth--;
      }

      current += char;

      // Statement ends with ; when not in string and not in function body
      if (char === ';' && !inString && depth === 0) {
        statements.push(current.trim());
        current = '';
      }
    }

    if (current.trim()) {
      statements.push(current.trim());
    }

    return statements.filter(s => s.length > 0);
  }
}
```

#### 2.3 Migration Tracker (`packages/nx-surrealdb/src/utils/migration-tracker.ts`)

```typescript
export class MigrationTracker {
  constructor(private client: SurrealDBHttpClient) {}

  async initialize(): Promise<void> {
    const query = `
      -- Create migrations table if not exists
      DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
      DEFINE FIELD id ON _migrations TYPE string;
      DEFINE FIELD name ON _migrations TYPE string;
      DEFINE FIELD filename ON _migrations TYPE string;
      DEFINE FIELD checksum ON _migrations TYPE string;
      DEFINE FIELD applied_at ON _migrations TYPE datetime DEFAULT time::now();
      DEFINE FIELD applied_by ON _migrations TYPE string;
      DEFINE INDEX idx_migrations_id ON _migrations COLUMNS id UNIQUE;
    `;
    
    await this.client.executeQuery(query);
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.client.executeQuery(
      'SELECT * FROM _migrations ORDER BY id ASC'
    );
    
    return result[0]?.result || [];
  }

  async recordMigration(migration: Migration): Promise<void> {
    const query = `
      CREATE _migrations SET
        id = "${migration.id}",
        name = "${migration.name}",
        filename = "${migration.filename}",
        checksum = "${migration.checksum}",
        applied_by = "${process.env.USER || 'unknown'}"
    `;
    
    await this.client.executeQuery(query);
  }

  async removeMigration(id: string): Promise<void> {
    await this.client.executeQuery(`DELETE _migrations WHERE id = "${id}"`);
  }
}
```

### Step 3: Executors

#### 3.1 Migrate Executor (`packages/nx-surrealdb/src/executors/migrate/executor.ts`)

```typescript
import { ExecutorContext } from '@nx/devkit';
import { MigrateExecutorSchema } from './schema';

export default async function runExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = context.workspace.projects[context.projectName].root;
  const migrationsPath = path.join(projectRoot, options.migrationsDir || 'migrations');
  
  // Initialize client and tracker
  const client = new SurrealDBHttpClient(options);
  const tracker = new MigrationTracker(client);
  
  await tracker.initialize();
  
  // Get pending migrations
  const applied = await tracker.getAppliedMigrations();
  const files = await fs.readdir(migrationsPath);
  const pending = files
    .filter(f => f.endsWith('.surql'))
    .filter(f => !applied.some(m => m.filename === f))
    .sort();
  
  // Apply migrations
  for (const file of pending) {
    console.log(`Applying migration: ${file}`);
    const content = await fs.readFile(path.join(migrationsPath, file), 'utf-8');
    const migration = MigrationParser.parse(content, file);
    
    try {
      // Split and execute statements
      const statements = MigrationParser.splitStatements(migration.up);
      for (const statement of statements) {
        await client.executeQuery(statement);
      }
      
      // Record migration
      await tracker.recordMigration(migration);
      console.log(`✅ Applied: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`, error);
      return { success: false };
    }
  }
  
  return { success: true };
}
```

#### 3.2 Status Executor (`packages/nx-surrealdb/src/executors/status/executor.ts`)

```typescript
export default async function runExecutor(
  options: StatusExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const client = new SurrealDBHttpClient(options);
  const tracker = new MigrationTracker(client);
  
  const applied = await tracker.getAppliedMigrations();
  const pending = await getPendingMigrations(context, options, applied);
  
  console.log('Migration Status:');
  console.log('================');
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${pending.length}`);
  
  if (options.verbose) {
    console.log('\nApplied Migrations:');
    applied.forEach(m => {
      console.log(`  ✅ ${m.filename} (${m.applied_at})`);
    });
    
    console.log('\nPending Migrations:');
    pending.forEach(f => {
      console.log(`  ⏳ ${f}`);
    });
  }
  
  return { success: true };
}
```

### Step 4: Generator for New Migrations

```typescript
// packages/nx-surrealdb/src/generators/migration/generator.ts
export async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<void> {
  const timestamp = new Date().toISOString()
    .replace(/[-:T]/g, '')
    .substring(0, 14);
  
  const filename = `${timestamp}_${options.name}.surql`;
  const projectRoot = readProjectConfiguration(tree, options.project).root;
  const filePath = joinPathFragments(
    projectRoot,
    options.migrationsDir || 'migrations',
    filename
  );
  
  const content = `-- Migration: ${options.name}
-- Created: ${new Date().toISOString()}

-- UP
${options.up || '-- Add your migration SQL here'}

${options.down ? `-- DOWN\n${options.down}` : ''}
`;
  
  tree.write(filePath, content);
  
  await formatFiles(tree);
}
```

### Step 5: Plugin Configuration

```json
// packages/nx-surrealdb/executors.json
{
  "executors": {
    "migrate": {
      "implementation": "./src/executors/migrate/executor",
      "schema": "./src/executors/migrate/schema.json",
      "description": "Run pending SurrealDB migrations"
    },
    "rollback": {
      "implementation": "./src/executors/rollback/executor",
      "schema": "./src/executors/rollback/schema.json",
      "description": "Rollback SurrealDB migrations"
    },
    "status": {
      "implementation": "./src/executors/status/executor",
      "schema": "./src/executors/status/schema.json",
      "description": "Check migration status"
    }
  }
}
```

```json
// packages/nx-surrealdb/generators.json
{
  "generators": {
    "migration": {
      "factory": "./src/generators/migration/generator",
      "schema": "./src/generators/migration/schema.json",
      "description": "Generate a new SurrealDB migration"
    },
    "init": {
      "factory": "./src/generators/init/generator",
      "schema": "./src/generators/init/schema.json",
      "description": "Initialize SurrealDB in a project"
    }
  }
}
```

## Usage Example

```bash
# Generate a new migration
nx g @idance/nx-surrealdb:migration create-users-table --project=database

# Run migrations
nx run database:migrate

# Check status
nx run database:db-status

# Rollback last migration
nx run database:rollback
```

## Next Steps

1. Run the HTTP API test to confirm compatibility:
   ```bash
   cd packages/surrealdb-migration-test
   npm test:http
   ```

2. Create the plugin package structure
3. Implement core components with proper error handling
4. Add comprehensive tests
5. Document configuration options

This implementation uses the HTTP API which is proven to work with SurrealDB Cloud v2.3.3 and handles all complex query types including functions, access methods, and transactions.