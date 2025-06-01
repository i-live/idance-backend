# Database Migrations

This directory contains the database schema and migration setup for the iDance platform using SurrealDB.

## Quick Start

Run all migrations:
```bash
pnpm db:migrate
```

## Migration Script Features

The `run-migration.sh` script provides:

- **Environment Variable Substitution**: Safely injects secrets from `.env` without committing them
- **Validation**: Checks all required environment variables and JWT secret lengths
- **Sequential Execution**: Runs migrations in proper dependency order (0000-0008)
- **Error Handling**: Stops on first failure with clear error messages
- **Selective Migration**: Run specific migrations with `--migration` flag
- **Failsafes**: Multiple validation checks before execution

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm db:migrate` | Run all migrations in sequence |
| `./scripts/run-migration.sh --migration 0003` | Run specific migration |
| `./scripts/run-migration.sh --skip-validation` | Skip environment validation |
| `./scripts/run-migration.sh --help` | Show help and usage |

## Migration Files

All migration files support environment variable substitution:

```
database/migrations/
├── 0000_namespace_database.surql     # Namespace and database setup
├── 0001_authentication.surql         # Authentication system
├── 0002_core_users.surql             # User tables and profiles
├── 0003_lookup_tables.surql          # Reference data
├── 0004_social_interactions.surql    # Social features
├── 0005_messaging.surql              # Messaging system
├── 0006_content_vlogs.surql          # Content and vlogs
├── 0007_groups_sites.surql           # Groups and sites
└── 0008_events_triggers.surql        # Events and triggers
```

## Environment Variables

Required variables in your `.env` file:

```bash
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NAMESPACE=idance
SURREALDB_DATABASE=dev
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=your_secure_password
SURREALDB_JWT_SECRET=your_jwt_secret_min_32_chars
SURREALDB_WORKER_JWT_SECRET=your_worker_jwt_secret_min_32_chars
```

## Variable Substitution

Migration files can use environment variables with `${VARIABLE_NAME}` syntax:

```sql
-- Example from 0000_namespace_database.surql
DEFINE NAMESPACE ${SURREALDB_NAMESPACE};
USE NAMESPACE ${SURREALDB_NAMESPACE};
USE DATABASE ${SURREALDB_DATABASE};
```

## Database Schema

The migrations create a comprehensive schema including:

### Core Tables
- **user** - User accounts with role-based access control
- **profile** - User profiles with location and preferences  
- **device** - Device tokens for push notifications

### Lookup Tables
- **country, state, county, city** - Location hierarchy
- **dance_style** - Dance styles and categories
- **interest** - User interests and hobbies
- **social_platform** - Social media platforms

### Social Features
- **friendship, follow, block** - Social relationships
- **message, conversation** - Messaging system
- **vlog, vlog_like, vlog_comment** - Content system

### Groups & Sites
- **group, group_member** - User groups
- **site, site_member** - User sites/pages

### Events & Triggers
- **event, event_participant** - Event management
- Various triggers for data consistency

## Troubleshooting

- **Environment file missing**: Copy `.env.example` to `.env` and configure
- **JWT secrets too short**: Generate with `openssl rand -base64 64`
- **SurrealDB CLI missing**: Install from https://surrealdb.com/docs/installation
- **Connection issues**: Check your SurrealDB server is running and accessible
- **Permission errors**: Ensure your SurrealDB user has admin privileges

## Development Workflow

1. **Setup**: Copy `.env.example` to `.env` and configure
2. **Run migrations**: `pnpm db:migrate`
3. **Test specific migration**: `./scripts/run-migration.sh --migration 0003`
4. **Schema changes**: Create new migration files, don't modify existing ones

The migration system provides robust error handling, environment variable substitution, and comprehensive validation for production-ready database management.