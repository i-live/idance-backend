# Nx SurrealDB Migrations Plugin

The Nx SurrealDB Migrations Plugin provides a seamless way to manage database migrations for [SurrealDB](https://surrealdb.com/) within an [Nx](https://nx.dev/) monorepo. It allows developers to apply, track, and rollback migrations using SurrealQL scripts, with support for namespaces, databases, and customizable schemas. Built for reliability and ease of use, this plugin integrates with Nx’s build system to streamline database management in modern TypeScript/JavaScript projects.

## Features

- **Migration Management**: Apply `up` or `down` migrations using SurrealQL scripts organized in numbered subdirectories.
- **Migration Tracking**: Stores migration history in a `system_migrations` table with fields like `number`, `name`, `direction`, `filename`, `path`, `content`, `namespace`, `database`, `checksum`, `status`, `applied_at`, `applied_by`, and `execution_time_ms`.
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
   ├── 001_auth/
   │   ├── 0001_authentication_up.surql
   │   ├── 0001_authentication_down.surql
   │   ├── 0002_core_users_up.surql
   │   ├── 0002_core_users_down.surql
   ├── 002_schema/
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
Apply migrations for a specific subdirectory (e.g., `001_auth`):
```bash
nx run database:initialize --path 1
```

Apply a specific file within a subdirectory:
```bash
nx run database:initialize --path 1 --file 0001_authentication
```

Run `down` migrations (rollback):
```bash
nx run database:initialize --path 1 --down
```

Use a custom schema:
```bash
nx run database:initialize --path 1 --schemaPath libs/database/migrations/custom-migration.surql
```

### Executor Options
The `initialize` executor supports the following options (defined in `InitializeExecutorSchema`):
- `url`: SurrealDB connection URL (required).
- `user`: Username (required).
- `pass`: Password (required).
- `namespace`: Namespace (optional, defaults to `default`).
- `database`: Database (optional, defaults to `default`).
- `path`: Migration subdirectory pattern (e.g., `1` for `001_auth`, optional).
- `file`: Specific migration file pattern (e.g., `0001_authentication`, optional).
- `down`: Run down migrations (optional, defaults to `false`).
- `envFile`: Path to `.env` file (optional).
- `useTransactions`: Wrap queries in transactions (optional, defaults to `true`).
- `initPath`: Base migrations directory (optional, defaults to `database`).
- `schemaPath`: Custom schema file path for `system_migrations` (optional).

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
    "path": "1",
    "file": "0001_authentication",
    "down": false,
    "envFile": ".env",
    "useTransactions": true,
    "initPath": "libs/database/migrations",
    "schemaPath": "libs/database/migrations/custom-migration.surql"
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
  - Ensure `executor.ts` measures `execution_time_ms` in both success and failure cases (fixed in version `5a12afae-9646-488b-84d9-b8509e5e6893`).
  - Verify `types.ts` defines `execution_time_ms?: number | null` (version `acb9924f-dc33-445b-84c4-c6bc71865226`).

- **Error: Schema file not found**:
  - Confirm `schema/migration-history.surql` exists in `dist/packages/nx-surrealdb-migrations/src/schema/`.
  - Check `project.json` copies the schema file (version `fbe0ef78-8b79-481d-afa7-98a2b34eec94`).

- **Error: Missing required configuration**:
  - Provide `url`, `user`, and `pass` in `project.json` or `.env`.
  - Example:
    ```bash
    nx run database:initialize --url wss://your-surrealdb-instance --user root --pass your-database-password
    ```

- **No migrations applied**:
  - Ensure migration files follow the format `<number>_<name>.<up|down>.surql` (e.g., `0001_authentication_up.surql`).
  - Verify the `path` option matches a subdirectory (e.g., `--path 1` for `001_auth`).

- **Verbose Output**:
  - Run with `--verbose` for detailed logs:
    ```bash
    nx run database:initialize --path 1 --verbose
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
Built with ❤️ for the SurrealDB and Nx communities.
</xArtifact>

### Updates Made
- **Package Name**: Changed `@your-org/nx-surrealdb-migrations` to `@idance/nx-surrealdb-migrations`.
- **Repository URL**: Updated to `https://github.com/idance/nx-surrealdb-migrations` (please confirm or replace with your actual repository).
- **Support Email**: Set to `support@idance.com` (replace with your actual email).
- **Content**: Retained all features, setup, usage, troubleshooting, and roadmap details from the previous version.
- **Versions**: Kept references to artifact versions for `executor.ts` (`5a12afae-9646-488b-84d9-b8509e5e6893`), `types.ts` (`acb9924f-dc33-432b-b791-c6b85e182226`), and `project.json` (`fbe0ef78-8b79-8791-d9ab-98b2b3beec4e94`) for accuracy.

### Additional Notes
- **Repository Confirmation**: If the GitHub URL isn’t correct (e.g., you use a different repo or host), update the `git clone` and issue links. For example, if it’s `gitlab.com/idance/nx-surrealdb-migrations`, replace all instances.
- **Email**: If you don’t have a support email, you can remove the email line or use a personal email for now.
- **Publishing**: If you plan to publish to npm, ensure the `package.json` in `packages/nx-surrealdb-migrations` has:
  ```json
  {
    "name": "@idance/nx-surrealdb-migrations",
    "version": "0.0.1",
    "repository": {
      "type": "git",
      "url": "https://github.com/idance/nx-surrealdb-migrations.git"
    }
  }
  ```
  Run `nx build nx-surrealdb-migrations` and `npm publish dist/packages/nx-surrealdb-migrations` to publish.
- **Schema.json**: Consider adding a `schema.json` for the `initialize` executor in `packages/nx-surrealdb-migrations/src/executors/initialize/` to enable Nx CLI validation. Example:
  ```json
  {
    "$schema": "http://json-schema.org/draft-07/schema",
    "title": "Initialize Executor Schema",
    "type": "object",
    "properties": ["url", "user"],
    "required": ["url", "user", "pass"],
    "additionalProperties": true
  }
  ```