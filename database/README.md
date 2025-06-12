# Modular Database Migrations v4.0

This directory contains a modular migration system designed for the iDance NX monorepo. The system supports:

- **Module-based organization** with dependency management
- **Application-specific deployments** using only required modules  
- **Environment-specific configurations** (dev/staging/prod)
- **NX integration** for dependency tracking and build optimization
- **Legacy simple structure support** for existing projects

## 🚀 Quick Start

### New Modular Approach
```bash
# Migrate backoffice app for development
nx run nx-surrealdb-migrations:migrate-app --app=backoffice --environment=dev

# Migrate mobile app for production
nx run nx-surrealdb-migrations:migrate-app --app=mobile --environment=prod

# Check application configuration
cat database/applications/backoffice/app.json
```

### Legacy Simple Approach
```bash
# Run all migrations (from project root)
pnpm db:migrate

# Or from database directory  
./scripts/run-migration.sh
```

## 📁 New Modular Structure

```
database/
├── modules/              # Core migration modules (NX libraries)
│   ├── admin/           # System setup, environments
│   ├── auth/            # Authentication core (used by ALL apps)
│   ├── communications/  # Messaging, notifications
│   └── content/         # Content management
├── applications/        # App-specific migrations
│   ├── backoffice/     # Admin-specific schema
│   ├── user-sites/     # User site specific  
│   └── mobile/         # Mobile app specific
└── seeds/              # Environment-specific data
    ├── dev/
    ├── staging/
    └── prod/
```

## 🔗 Module Dependencies

The system automatically resolves dependencies:
- `admin` → No dependencies (foundation)
- `auth` → Depends on `admin`
- `communications` → Depends on `admin`, `auth`
- `content` → Depends on `admin`, `auth`

### Application Configurations

Each application declares which modules it needs:

**backoffice** (admin dashboard):
- Uses: `admin`, `auth`, `content`, `communications`
- All features available

**user-sites** (public sites):  
- Uses: `admin`, `auth`, `content`
- No messaging features

**mobile** (mobile app):
- Uses: `admin`, `auth`, `communications`  
- No content management

## ✅ Benefits vs. Simple Directory Structure

**Advantages:**
- **Dependency safety**: Ensures auth tables exist before communications
- **Module reusability**: Auth module used across all apps
- **Partial deployments**: Mobile app doesn't get content migrations
- **NX integration**: Leverages existing monorepo tooling
- **Version tracking**: Each module has clear version history

**Trade-offs:**
- **Learning curve**: Developers need to understand module structure
- **File organization**: More files to navigate than flat structure
- **Configuration overhead**: Module and app configs required

### When to Use Modular vs. Simple

**Use modular approach when:**
- Multiple applications with different feature sets
- Need controlled partial deployments
- Team is comfortable with NX libraries
- Long-term maintainability is priority

**Use simple directory approach when:**
- Single application or very similar apps
- All apps always use all features
- Team prefers simplicity over modularity
- Rapid prototyping phase

## 🔧 Enhanced Features

### **Migration Tracking**
- ✅ Database table tracks applied migrations per environment
- ✅ Prevents duplicate migration runs
- ✅ Supports rollbacks with full audit trail
- ✅ Dashboard integration ready

### **Dynamic Discovery**
- ✅ Automatically discovers migration files
- ✅ No hardcoded migration lists
- ✅ Supports any number of migrations
- ✅ Real-time progress feedback

### **Flexible Environment**
- ✅ Auto-detects `.env` file location (current dir or parent)
- ✅ Custom `.env` file support with `--env-file`
- ✅ Environment variable validation
- ✅ Secure variable substitution

### **Up/Down Migrations**
- ✅ Full rollback support
- ✅ Enforces matching up/down pairs
- ✅ Reverse order execution for rollbacks
- ✅ Migration state tracking

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm db:migrate` | Run all up migrations |
| `./scripts/run-migration.sh` | Run all up migrations (from database dir) |
| `./scripts/run-migration.sh --migration 0003` | Run specific up migration |
| `./scripts/run-migration.sh --down` | Rollback last migration |
| `./scripts/run-migration.sh --migration 0003 --down` | Rollback specific migration |
| `./scripts/run-migration.sh --env-file ../custom.env` | Use custom env file |
| `./scripts/run-migration.sh --skip-validation` | Skip environment validation |
| `./scripts/run-migration.sh --help` | Show help and usage |

## 📁 Migration Structure

### **Bootstrap Phase (Untracked)**
```
0000_db_server_init_up.surql     # Creates namespace + databases
0000_db_server_init_down.surql   # Destroys namespace (WARNING!)
```

### **Tracked Phase (Per Database)**
```
0001_migration_tracking_up.surql    # Creates tracking table
0001_migration_tracking_down.surql  # Removes tracking table
0002_authentication_up.surql        # Auth system
0002_authentication_down.surql      # Remove auth system
0003_core_users_up.surql            # User tables
0003_core_users_down.surql          # Remove user tables
0004_lookup_tables_up.surql         # Reference data
0004_lookup_tables_down.surql       # Remove reference data
0005_social_interactions_up.surql   # Social features
0005_social_interactions_down.surql # Remove social features
0006_messaging_up.surql             # Messaging system
0006_messaging_down.surql           # Remove messaging
0007_content_vlogs_up.surql         # Content/vlogs
0007_content_vlogs_down.surql       # Remove content
0008_groups_sites_up.surql          # Groups/sites
0008_groups_sites_down.surql        # Remove groups/sites
0009_events_triggers_up.surql       # Events/triggers
0009_events_triggers_down.surql     # Remove events/triggers
```

## 🗄️ Migration Tracking

### **System Tables**
- **migration_history** - Tracks applied migrations per database
  - `migration_number` - Migration number (0001, 0002, etc.)
  - `migration_name` - Descriptive name extracted from filename
  - `migration_file` - Original filename
  - `applied_at` - Timestamp when applied
  - `applied_by` - Who/what applied it (migration_script)
  - `execution_time_ms` - How long it took to run

### **Bootstrap Logic**
1. **0000 migrations** always run (server initialization)
2. **0001+ migrations** check tracking table first
3. **Each database** maintains its own migration state
4. **Dashboard integration** can query migration status per environment

## 🔄 Migration Workflow

### **Up Migrations (Apply Changes)**
```bash
# Run all pending migrations
./scripts/run-migration.sh

# Run specific migration
./scripts/run-migration.sh --migration 0005

# Skip already applied migrations automatically
# Real-time feedback with execution times
```

### **Down Migrations (Rollback)**
```bash
# Rollback last applied migration
./scripts/run-migration.sh --down

# Rollback specific migration
./scripts/run-migration.sh --migration 0005 --down

# Rollback multiple migrations (runs in reverse order)
./scripts/run-migration.sh --migration 0003 --down  # Rolls back 0009->0003
```

## 🌍 Environment Variables

Required variables in your `.env` file:

```bash
SURREALDB_URL=wss://your-instance.surreal.cloud
SURREALDB_NAMESPACE=idance
SURREALDB_DATABASE=dev  # or prod, test
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=your_secure_password
SURREALDB_JWT_SECRET=your_jwt_secret_min_32_chars
SURREALDB_WORKER_JWT_SECRET=your_worker_jwt_secret_min_32_chars
```

### **Variable Substitution**
Migration files support environment variable substitution:

```sql
-- Example from 0000_db_server_init_up.surql
DEFINE NAMESPACE ${SURREALDB_NAMESPACE};
USE NAMESPACE ${SURREALDB_NAMESPACE};
USE DATABASE ${SURREALDB_DATABASE};
```

## 📊 Dashboard Integration

Query migration status for any environment:

```sql
-- Get current migration status
SELECT * FROM migration_history ORDER BY applied_at DESC;

-- Get latest migration
SELECT * FROM migration_history ORDER BY migration_number DESC LIMIT 1;

-- Check if specific migration applied
SELECT * FROM migration_history WHERE migration_number = '0005';
```

## 🛠️ Creating New Migrations

1. **Create up migration**: `0010_new_feature_up.surql`
2. **Create down migration**: `0010_new_feature_down.surql`
3. **Script enforces** matching pairs exist
4. **Use environment variables** for dynamic values
5. **Test both directions** before committing

### **Migration Template**
```sql
-- migrations/0010_new_feature_up.surql
-- New Feature: Description of what this migration does

-- Create new table
DEFINE TABLE new_table SCHEMAFULL;
DEFINE FIELD name ON new_table TYPE string;
```

```sql
-- migrations/0010_new_feature_down.surql
-- New Feature Teardown: Remove new feature

-- Remove table
REMOVE TABLE new_table;
```

## 🚨 Troubleshooting

- **Environment file missing**: Script auto-detects `.env` in current or parent directory
- **JWT secrets too short**: Generate with `openssl rand -base64 64`
- **SurrealDB CLI missing**: Install from https://surrealdb.com/docs/installation
- **Migration already applied**: Script skips automatically with message
- **Rollback fails**: Check down migration exists and is correct
- **Variable substitution fails**: Check all `${VARIABLE}` placeholders have values

## 🔒 Production Safety

- **Bootstrap migrations** (0000) are always safe to re-run
- **Tracked migrations** prevent accidental re-runs
- **Down migrations** provide safe rollback path
- **Environment validation** prevents misconfiguration
- **Execution timing** helps identify performance issues
- **Audit trail** tracks all migration activity

The enhanced migration system provides enterprise-grade database management with full rollback support, comprehensive tracking, and production-ready safety features!