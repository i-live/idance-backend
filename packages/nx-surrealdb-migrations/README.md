# Nx SurrealDB Migrations Plugin

The Nx SurrealDB Migrations Plugin provides a seamless way to manage database migrations for [SurrealDB](https://surrealdb.com/) within an [Nx](https://nx.dev/) monorepo. It allows developers to apply, track, and rollback migrations using SurrealQL scripts, with support for namespaces, databases, and customizable schemas. Built for reliability and ease of use, this plugin integrates with Nx’s build system to streamline database management in modern TypeScript/JavaScript projects.

## Features

- **Migration Management**: Apply `up` or `down` migrations using SurrealQL scripts organized in numbered subdirectories.
- **Migration Tracking**: Stores migration history in a `system_migrations` table with fields like `number`, `name`, `direction`, `filename`, `path`, `content`, `namespace`, `database`, `checksum`, `status`, `applied_at`, `applied_by`, and `execution_time_ms`.
- **State Enforcement**: Prevents re-running migrations in the same state (e.g., `up` when already `up`) with warnings, skippable via `--force`.
- **Executor Support**: Includes an `initialize` executor to run migrations with configurable options (e.g., URL, namespace, path).
- **Custom Schema**: Allows custom `system_migrations` table schemas via a `schemaPath` option.
- **Checksum Validation**: Computes SHA-256 checksums for migration files to ensure integrity.
- **Transaction Control**: Optionally wraps migrations in transactions for atomicity (configurable via `useTransactions`).
- **Environment Variables**: Supports `.env` files and environment variable interpolation for configuration.
- **Type Safety**: Centralized TypeScript interfaces in `lib/types.ts` for robust typing (e.g., `InitializeExecutorSchema`, `Migration`).
- **Data Migration**: Automatically migrates data from legacy tables (`migration_history`, `system_migration_history`) to `system_migrations`.
- **Flexible Path Resolution**: Supports migration subdirectories with numeric prefixes (e.g., `001_auth`) and file filtering.

## Prerequisites

- **Node.js**: Version 16 or higher.
- **Nx**: Version 16 or higher (`npm install -g nx`).
- **SurrealDB**: A running SurrealDB instance (local or cloud).
- **TypeScript**: Recommended for type safety (included in Nx projects).

## Installation

1. **Add the Plugin to Your Nx Workspace**:
   ```bash
   npm install @idance/nx-surrealdb-migrations --save-dev
   ```

2. **Verify Installation**:
   Ensure the plugin is listed in `package.json` and available in `nx list`.
   ```bash
   nx list @idance/nx-surrealdb-migrations
   ```

3. **Set Up a Project**:
   If you don’t have an Nx project, create one:
   ```bash
   npx create-nx-workspace@latest my-workspace
   cd my-workspace
   ```

## Setup

1. **Create a Database Project**:
   Generate a new project in your Nx workspace to manage migrations:
   ```bash
   nx generate @nx/js:library database --directory=libs/database --bundler=none
   ```

2. **Configure the Executor**:
   Add the `initialize` executor to your project’s `project.json` (e.g., `libs/database/project.json`):
   ```json
   {
     "name": "database",
     "sourceRoot": "libs/database/src",
     "projectType": "library",
     "targets": {
       "initialize": {
         "executor": "@idance/nx-surrealdb-migrations:initialize",
         "options": {
           "url": "wss://your-surrealdb-instance",
           "user": "root",
           "pass": "your-password",
           "namespace": "idance",
           "database": "local",
           "initPath": "libs/database/migrations",
           "useTransactions": true
         }
       }
     }
   }
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in your workspace root to store sensitive configuration:
   ```env
   SURREALDB_URL=wss://your-surrealdb-instance
   SURREALDB_ROOT_USER=root
   SURREALDB_ROOT_PASS=your-password
   SURREALDB_NAMESPACE=idance
   SURREALDB_DATABASE=local
   MIGRATIONS_PATH=libs/database/migrations
   ```
   Specify the `.env` file in `project.json`:
   ```json
   "initialize": {
     "options": {
       "envFile": ".env"
     }
   }
   ```

4. **Create Migration Files**:
   Organize migrations in numbered subdirectories under `libs/database/migrations` (or your `initPath`). Example:
   ```
   libs/database/migrations/
   ├── 000_admin/
   │   ├── 0000_db_server_namespaces_up.surql
   │   ├── 0000_db_server_namespaces_down.surql
   ├── 010_auth/
   │   ├── 0001_authentication_up.surql
   │   ├── 0001_authentication_down.surql
   │   ├── 0002_core_users_up.surql
   │   ├── 0002_core_users_down.surql
   ├── 020_schema/
   │   ├── 0001_tables_up.surql
   │   ├── 0001_tables_down.surql
   ```
   Example `0001_authentication_up.surql`:
   ```surql
   DEFINE TABLE users SCHEMAFULL;
   DEFINE FIELD email ON users TYPE string;
   DEFINE FIELD password ON users TYPE string;
   ```

5. **Custom Schema (Optional)**:
   To customize the `system_migrations` table, create a schema file (e.g., `libs/database/migrations/custom-migration.surql`) and specify it in `project.json`:
   ```json
   "initialize": {
     "options": {
       "schemaPath": "libs/database/migrations/custom-migration.surql"
     }
   }
   ```
   Ensure the custom schema includes required fields: `number`, `name`, `direction`, `filename`, `path`, `content`, `status`, `applied_at`.

## Usage

### Run Migrations
Apply migrations for a specific module (e.g., `010_auth`):
```bash
nx run database:initialize --module 10
```

Apply a specific file within a module:
```bash
nx run database:initialize --module 10 --file 0001_authentication
```

Run `down` migrations (rollback):
```bash
nx run database:initialize --module 10 --down
```

Use a custom schema:
```bash
nx run database:initialize --module 10 --schemaPath libs/database/migrations/custom-migration.surql
```

Force apply migrations regardless of state:
```bash
nx run database:initialize --module 10 --force
```

### Migration State Rules
- **Up Migrations**: Can only be applied if the migration has never been run or is in a `down` state. Re-running an `up` migration is skipped with a warning unless `--force` is used.
- **Down Migrations**: Can only be applied if the migration is in an `up` state. Running `down` on a non-existent or `down` migration is skipped with a warning unless `--force` is used.
- **Warnings**: Skipped migrations log warnings (e.g., “Skipping migration 0001_authentication: already up. Use --force to override.”).

### Executor Options
The `initialize` executor supports the following options (defined in `InitializeExecutorSchema`):
- `url`: SurrealDB connection URL (required).
- `user`: Username (required).
- `pass`: Password (required).
- `namespace`: Namespace (optional, defaults to `default`).
- `database`: Database (optional, defaults to `default`).
- `module`: Migration module pattern (e.g., `10` for `010_auth`, optional).
- `file`: Specific migration file pattern (e.g., `0001_authentication`, optional).
- `down`: Run down migrations (optional, defaults to `false`).
- `envFile`: Path to `.env` file (optional).
- `useTransactions`: Wrap queries in transactions (optional, defaults to `true`).
- `initPath`: Base migrations directory (optional, defaults to `database`).
- `schemaPath`: Custom schema file path for `system_migrations` (optional).
- `force`: Bypass migration state checks (optional, defaults to `false`).

Example `project.json` with all options:
```json
"initialize": {
  "executor": "@idance/nx-surrealdb-migrations:initialize",
  "options": {
    "url": "${SURREALDB_URL}",
    "user": "${SURREALDB_ROOT_USER}",
    "pass": "${SURREALDB_ROOT_PASS}",
    "namespace": "idance",
    "database": "local",
    "module": "1",
    "file": "0001_authentication",
    "down": false,
    "envFile": ".env",
    "useTransactions": true,
    "initPath": "libs/database/migrations",
    "schemaPath": "libs/database/migrations/custom-migration.surql",
    "force": false
  }
}
```

### View Migration History
Query the `system_migrations` table in SurrealDB to view applied migrations:
```surql
SELECT * FROM system_migrations ORDER BY applied_at DESC;
```

Fields include:
- `number`: Migration number (e.g., `0001`).
- `name`: Migration name (e.g., `authentication`).
- `direction`: `up` or `down`.
- `filename`: Migration file name (e.g., `0001_authentication_up.surql`).
- `path`: File path.
- `content`: Migration script content.
- `namespace`: Namespace (e.g., `idance`).
- `database`: Database (e.g., `local`).
- `checksum`: SHA-256 checksum of the file content.
- `status`: `success` or `fail`.
- `applied_at`: Timestamp of application.
- `applied_by`: User who applied the migration (e.g., `root`).
- `execution_time_ms`: Execution time in milliseconds.

## Troubleshooting

- **Error: Failed to create record: Found NULL for field `execution_time_ms`**:
  - Ensure `executor.ts` measures `execution_time_ms` in both success and failure cases (fixed in version `7f4e5f90-0f4b-4c6b-a8c8-5e3f6f3f3b3b`).
  - Verify `types.ts` defines `execution_time_ms?: number | null` (version `7e0d0e80-0f4b-4a6b-a4c8-5e3f6f3f3b3b`).

- **Error: Schema file not found**:
  - Confirm `schema/migration-history.surql` exists in `dist/packages/nx-surrealdb-migrations/src/schema/`.
  - Check `project.json` copies the schema file (version `fbe0ef78-8b79-481d-afa7-98a2b34eec94`).

- **Error: Missing required configuration**:
  - Provide `url`, `user`, and `pass` in `project.json` or `.env`.
  - Example:
    ```bash
    nx run database:initialize --url wss://your-surrealdb-instance --user root --pass your-password
    ```

- **No migrations applied**:
  - Ensure migration files follow the format `<number>_<name>.<up|down>.surql` (e.g., `0001_authentication_up.surql`).
  - Verify the `module` option matches a migration module (e.g., `--module 10` for `010_auth`).
  - Check if migrations were skipped due to state conflicts (use `--force` to override).

- **Verbose Output**:
  - Run with `--verbose` for detailed logs:
    ```bash
    nx run database:initialize --module 10 --verbose
    ```

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository**:
   ```bash
   git clone https://github.com/idance/nx-surrealdb-migrations.git
   cd nx-surrealdb-migrations
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Make Changes**:
   - Update code in `packages/nx-surrealdb-migrations/src/`.
   - Add tests in `packages/nx-surrealdb-migrations/__tests__/`.

4. **Test Locally**:
   ```bash
   nx test nx-surrealdb-migrations
   nx build nx-surrealdb-migrations
   ```

5. **Submit a Pull Request**:
   - Push changes to your fork and open a PR against the main branch.

## Roadmap

- **Rollback Executor**: Add a `rollback` executor to undo migrations by steps or specific files.
- **Migration Generator**: Create a generator to scaffold migration files and subdirectories.
- **Validation Checks**: Add pre-migration validation for checksum mismatches or duplicate migrations.
- **Multi-Database Support**: Allow migrations across multiple namespaces/databases in a single run.
- **CLI Integration**: Provide a CLI for running migrations outside Nx (e.g., `nx-surrealdb-migrate`).

## License
MIT License. See [LICENSE](LICENSE.md) for details.

## Support
For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/idance/nx-surrealdb-migrations/issues).
- Contact the maintainers at [support@idance.com](mailto:support@idance.com).

---
Built with ❤️ for the Nx and SurrealDB communities.