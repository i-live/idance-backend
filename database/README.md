# Database Migrations

This directory contains the database schema and migration setup for the iDance platform using SurrealDB.

## Quick Start

1. **Install the migration tool:**
   ```bash
   pnpm db:install
   ```

2. **Run migrations (includes namespace/database setup):**
   ```bash
   pnpm db:migrate
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm db:install` | Install the surrealdb-migrations CLI tool |
| `pnpm db:migrate` | Apply all pending migrations (includes namespace/DB setup) |
| `pnpm db:migrate-down` | Revert the last migration |
| `pnpm db:create-migration --args.name="AddUserTable"` | Create a new migration |

## Migration Files

All migration files are properly timestamped and ordered:

```
database/migrations/
├── 20250531_174300_NamespaceDatabase.surql    # Namespace/DB setup
├── 20250531_174301_authentication.surql       # Auth system
├── 20250531_174302_core_users.surql          # User tables
├── 20250531_174303_lookup_tables.surql       # Reference data
├── 20250531_174304_social_interactions.surql # Social features
├── 20250531_174305_messaging.surql           # Messaging system
├── 20250531_174306_content_vlogs.surql       # Content/vlogs
├── 20250531_174307_groups_sites.surql        # Groups/sites
└── 20250531_174308_events_triggers.surql     # Events/triggers
```

## Environment Variables

The migration tool uses these environment variables (automatically set from your `.env` file):

- `SURREAL_MIG_ADDRESS` - SurrealDB connection URL
- `SURREAL_MIG_USER` - Database username
- `SURREAL_MIG_PASS` - Database password
- `SURREAL_MIG_NS` - Database namespace
- `SURREAL_MIG_DB` - Database name

## Creating New Migrations

To create a new migration:

```bash
pnpm db:create-migration --args.name="DescriptiveChangeName"
```

This creates a timestamped migration file in the `migrations/` directory.

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

- **Migration tool not found**: Run `pnpm db:install` to install the CLI
- **Connection issues**: Check your `.env` file has correct SurrealDB credentials
- **Permission errors**: Ensure your SurrealDB user has admin privileges
- **Namespace/DB issues**: The first migration automatically creates namespace and databases

## Development Workflow

1. **Day 0 Setup**: `pnpm db:install && pnpm db:migrate`
2. **Daily Development**: `pnpm db:migrate` (applies any new migrations)
3. **Schema Changes**: Create new migration files, don't modify existing ones
4. **Rollbacks**: Use `pnpm db:migrate-down` if needed