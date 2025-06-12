# Nx SurrealDB Migrations Plugin

A modern, dependency-aware migration management system for [SurrealDB](https://surrealdb.com/) within [Nx](https://nx.dev/) monorepos. Features a 3-executor architecture (`migrate`, `rollback`, `status`) with comprehensive dependency resolution, safety validation, and rich console visualization.

## Features

### 🚀 **3-Executor Architecture**
- **`migrate`**: Apply pending migrations with dependency resolution
- **`rollback`**: Safe rollback with dependency conflict detection  
- **`status`**: Rich status visualization with dependency graphs

### 🔄 **Dependency Management**
- **Module Dependencies**: JSON/YAML configuration with explicit dependency declarations
- **Topological Sorting**: Automatic execution order based on dependency graphs
- **Circular Detection**: Prevents circular dependency configurations
- **Safety Validation**: Blocks unsafe rollbacks that would break dependent modules

### 📊 **Rich Visualization**
- **ASCII Dependency Trees**: Beautiful console visualization of module relationships
- **Status Indicators**: Clear up-to-date vs pending migration states
- **JSON Output**: Machine-readable output for automation and CI/CD integration
- **Detailed Mode**: Show specific pending migration files and metadata

### 🛡️ **Safety & Reliability**
- **Migration Tracking**: Complete history in `system_migrations` table with checksums and timing
- **Rollback Safety**: Pre-validation prevents dependency conflicts
- **Force Override**: Bypass safety checks when needed for emergency situations
- **Dry-Run Mode**: Preview operations without executing changes
- **Transaction Control**: Optional transaction wrapping for atomicity

### 🎯 **Developer Experience**
- **Module Targeting**: Reference modules by name (`auth`), number (`10`), or full path (`010_auth`)
- **Environment Variables**: Full `.env` support with variable interpolation
- **Rich Logging**: Emoji-enhanced console output with detailed execution statistics
- **Error Handling**: Comprehensive error messages with actionable guidance

## Prerequisites

- **Node.js**: Version 16 or higher
- **Nx**: Version 16 or higher (`npm install -g nx`)
- **SurrealDB**: A running SurrealDB instance (local or cloud)
- **TypeScript**: Recommended for type safety (included in Nx projects)

## Installation

1. **Add the Plugin to Your Nx Workspace**:
   ```bash
   npm install @idance/nx-surrealdb-migrations --save-dev
   ```

2. **Verify Installation**:
   ```bash
   nx list @idance/nx-surrealdb-migrations
   ```

## Quick Start

### 1. Create a Database Project

```bash
# Generate a new database project
nx g @nx/node:application database --bundler=webpack --framework=none

# Or add to existing project by updating project.json
```

### 2. Configure Project Targets

Update your `database/project.json`:

```json
{
  "name": "database",
  "targets": {
    "migrate": {
      "executor": "@idance/nx-surrealdb-migrations:migrate",
      "options": {
        "url": "${SURREALDB_URL}",
        "user": "${SURREALDB_ROOT_USER}",
        "pass": "${SURREALDB_ROOT_PASS}",
        "namespace": "${SURREALDB_NAMESPACE}",
        "database": "${SURREALDB_DATABASE}",
        "initPath": "database"
      }
    },
    "rollback": {
      "executor": "@idance/nx-surrealdb-migrations:rollback",
      "options": {
        "url": "${SURREALDB_URL}",
        "user": "${SURREALDB_ROOT_USER}",
        "pass": "${SURREALDB_ROOT_PASS}",
        "namespace": "${SURREALDB_NAMESPACE}",
        "database": "${SURREALDB_DATABASE}",
        "initPath": "database"
      }
    },
    "status": {
      "executor": "@idance/nx-surrealdb-migrations:status",
      "options": {
        "url": "${SURREALDB_URL}",
        "user": "${SURREALDB_ROOT_USER}",
        "pass": "${SURREALDB_ROOT_PASS}",
        "namespace": "${SURREALDB_NAMESPACE}",
        "database": "${SURREALDB_DATABASE}",
        "initPath": "database"
      }
    }
  }
}
```

### 3. Set Up Environment Variables

Create `.env` in your workspace root:

```bash
# SurrealDB Connection
SURREALDB_URL=ws://localhost:8000
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root
SURREALDB_NAMESPACE=myapp
SURREALDB_DATABASE=main
```

### 4. Create Module Configuration

Create `database/config.json`:

```json
{
  "modules": {
    "000_admin": {
      "name": "System Administration",
      "description": "Core system setup and administrative functions",
      "depends": []
    },
    "010_auth": {
      "name": "Authentication & Users", 
      "description": "User authentication and authorization system",
      "depends": ["000_admin"]
    },
    "020_schema": {
      "name": "Application Schema",
      "description": "Core application data models and relationships", 
      "depends": ["010_auth"]
    }
  },
  "settings": {
    "configFormat": "json",
    "useTransactions": true,
    "defaultNamespace": "myapp",
    "defaultDatabase": "main"
  }
}
```

### 5. Create Migration Directory Structure

```
database/
├── 000_admin/
│   ├── 0001_setup_up.surql
│   └── 0001_setup_down.surql
├── 010_auth/
│   ├── 0001_users_up.surql
│   ├── 0001_users_down.surql
│   ├── 0002_sessions_up.surql
│   └── 0002_sessions_down.surql
├── 020_schema/
│   └── ...
└── config.json
```

## Usage

### Generate New Migrations

```bash
# Generate migration in existing module
nx g @idance/nx-surrealdb-migrations:migration create-users --project database --module auth

# Generate migration with new module creation  
nx g @idance/nx-surrealdb-migrations:migration setup-notifications --project database --module notifications --createModule
```

### Apply Migrations

```bash
# Apply all pending migrations
nx run database:migrate

# Apply migrations for specific module
nx run database:migrate --module auth
nx run database:migrate --module 10

# Dry run to see what would be applied
nx run database:migrate --dryRun

# Force apply even if already applied
nx run database:migrate --force
```

### Check Status

```bash
# Show overall migration status
nx run database:status

# Show status for specific module
nx run database:status --module auth

# Show detailed information with file names
nx run database:status --detailed

# Output as JSON for automation
nx run database:status --json
```

### Rollback Migrations

```bash
# Rollback specific module (with safety validation)
nx run database:rollback --module auth

# Dry run to see what would be rolled back
nx run database:rollback --module auth --dryRun

# Force rollback (bypass safety checks)
nx run database:rollback --module auth --force

# Rollback specific number of steps
nx run database:rollback --module auth --steps 2
```

## Configuration

### Module Dependencies

The `config.json` file defines module dependencies:

```json
{
  "modules": {
    "000_admin": {
      "name": "System Administration",
      "depends": []
    },
    "010_auth": {
      "name": "Authentication",
      "depends": ["000_admin"]
    },
    "020_messaging": {
      "name": "Messaging System", 
      "depends": ["010_auth"]
    },
    "030_notifications": {
      "name": "Notifications",
      "depends": ["010_auth", "020_messaging"]
    }
  }
}
```

### Executor Options

#### Common Options (all executors)
- `url`: SurrealDB connection URL
- `user`: SurrealDB username  
- `pass`: SurrealDB password
- `namespace`: SurrealDB namespace
- `database`: SurrealDB database
- `module`: Target specific module (string or number)
- `envFile`: Path to environment file
- `initPath`: Path to migrations directory (default: "database")
- `configPath`: Path to config file (default: auto-detected)

#### Migrate-specific Options
- `dryRun`: Preview migrations without applying
- `force`: Apply migrations even if already applied
- `useTransactions`: Wrap migrations in transactions (default: true)

#### Rollback-specific Options  
- `dryRun`: Preview rollbacks without applying
- `force`: Bypass safety validation checks
- `steps`: Number of migration steps to rollback (default: 1)

#### Status-specific Options
- `detailed`: Show detailed migration file information
- `json`: Output as JSON instead of human-readable format

## Migration File Format

### Up Migration (`*_up.surql`)
```sql
-- Create users table
DEFINE TABLE IF NOT EXISTS users SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS email ON users TYPE string;
DEFINE FIELD IF NOT EXISTS password ON users TYPE string;
DEFINE INDEX IF NOT EXISTS email_idx ON users FIELDS email UNIQUE;
```

### Down Migration (`*_down.surql`)
```sql
-- Remove users table
REMOVE INDEX IF EXISTS email_idx ON users;
REMOVE TABLE IF EXISTS users;
```

## Module Structure

### Gapped Numbering
Use gapped numbering (000, 010, 020, 030) to allow insertion of new modules:

```
000_admin     # System administration
010_auth      # Authentication  
020_schema    # Core schema
030_messaging # Messaging system
040_reporting # Reporting (can be inserted later)
```

### Module Reference Patterns
All these patterns work for module targeting:

- By number: `--module 10` → `010_auth`
- By name: `--module auth` → `010_auth`  
- By full path: `--module 010_auth` → `010_auth`
- Legacy support: `--module 0` → `000_admin`

## Console Output Examples

### Status Command
```
📊 Checking migration status...

📈 Migration Status Summary
   Total Applied: 8
   Total Pending: 2
   🔄 2 migration(s) pending

📋 Module Details:

   ✅ 000_admin [UP-TO-DATE]
      Applied: 3 migration(s)
      Last Applied: 2024-01-15T10:30:00.000Z

   🔄 010_auth [PENDING]
      Applied: 2 migration(s)
      Pending: 1 migration(s)
      Dependencies: 000_admin

   ✅ 020_schema [UP-TO-DATE]
      Applied: 3 migration(s)
      Dependencies: 010_auth

🌐 Dependency Graph:
   000_admin (root)
   └─ 010_auth
      └─ 020_schema
```

### Migrate Command  
```
🚀 Starting migration execution...
✅ Migration completed successfully!
   Files processed: 3
   Files skipped: 0
   Execution time: 1,247ms

📊 Migration Details:
   ✅ 000_admin/0001_setup_up.surql
   ✅ 010_auth/0001_users_up.surql
   ✅ 010_auth/0002_sessions_up.surql
```

### Rollback Safety Validation
```
🔍 Validating rollback safety...
❌ Rollback validation failed!
   Blocked by dependencies:
   • 020_schema
   • 030_messaging
   Warnings:
   • Module 010_auth has active dependents

💡 Use --force to bypass safety checks
```

## Best Practices

### 1. **Module Organization**
- Use descriptive module names that reflect functional areas
- Keep modules focused on single concerns
- Use gapped numbering to allow future insertions

### 2. **Migration Writing**
- Always write corresponding down migrations
- Use `IF NOT EXISTS` and `IF EXISTS` for idempotent operations
- Test migrations in development before applying to production

### 3. **Dependency Management**
- Clearly define module dependencies in config.json
- Avoid circular dependencies
- Keep dependency chains shallow when possible

### 4. **Safety Practices**
- Use dry-run mode to preview changes
- Validate rollback safety before applying
- Use force flag sparingly and with caution
- Test migration paths in development environments

### 5. **Environment Management**
- Use environment variables for all connection details
- Never commit credentials to version control
- Use different databases for different environments

## Troubleshooting

### Common Issues

#### 1. **Connection Errors**
```bash
# Verify SurrealDB is running
surreal start --log trace --user root --pass root memory

# Check environment variables
echo $SURREALDB_URL
```

#### 2. **Module Not Found**
```bash
# List available modules
nx run database:status

# Check module naming (case sensitive)
ls database/
```

#### 3. **Dependency Conflicts**
```bash
# Check dependency graph
nx run database:status --detailed

# Validate rollback safety
nx run database:rollback --module mymodule --dryRun
```

#### 4. **Migration State Issues**
```bash
# Check current state
nx run database:status --module mymodule --detailed

# Force apply if needed (use with caution)
nx run database:migrate --module mymodule --force
```


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass: `nx test nx-surrealdb-migrations`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- [GitHub Issues](https://github.com/your-org/nx-surrealdb-migrations/issues)
- [Documentation](https://docs.your-domain.com/nx-surrealdb-migrations)
- [SurrealDB Community](https://surrealdb.com/community)