# NX SurrealDB Migrations Plugin - Architecture Guide

## Migration System Architecture

The migration system follows a **Repository Pattern** with domain-driven design and clean separation of concerns:

## Directory Structure

```
src/lib/
├── infrastructure/          # Database connectivity, utilities
│   ├── client.ts           # SurrealDB client wrapper
│   ├── debug.ts            # Debugging utilities
│   ├── env.ts              # Environment variable handling
│   └── project.ts          # NX project integration
├── configuration/          # Configuration management
│   ├── config-loader.ts    # Module config loading
│   └── types.ts           # Type definitions
├── filesystem/            # File system operations
│   ├── migration-file-processor.ts  # Migration file handling
│   └── tree-utils.ts                # NX Tree utilities
└── domain/               # Core business logic
    ├── dependency-resolver.ts       # Module dependency management
    ├── migration-repository.ts      # Data access layer
    └── migration-service.ts         # Business logic orchestration
```

## MigrationRepository (Data Access Layer)

**Primary Responsibility**: Database operations for migration state management

### ✅ What it SHOULD do:
- **CRUD Operations**: Create, read, update, delete migration records
- **Simple Queries**: Basic database queries with minimal logic
- **Schema Management**: Initialize and maintain database schema
- **Data Validation**: Basic input validation (required fields, formats)
- **Raw Data Operations**: Direct database interactions

### ❌ What it should NOT do:
- **Business Logic**: Complex rules about when migrations can be applied
- **File Operations**: Reading migration files, schema files from disk
- **Workflow Decisions**: Determining execution order or rollback logic
- **Complex State Logic**: Multi-step business rules or validation

### Current Methods (Compliant):
- `addMigration()` - Simple record creation
- `getLatestMigrationStatus()` - Simple data retrieval
- `getMigrationsByDirectionAndPath()` - Basic querying
- `findLastMigrations()` - Data aggregation query
- `updateMigrationStatus()` - Simple record update

### Methods that VIOLATE principles:
- `canApplyMigration()` - **BUSINESS LOGIC** (should be in MigrationService)
- `initialize()` - **FILE OPERATIONS** (should be in MigrationService)

## MigrationService (Business Logic Layer)

**Primary Responsibility**: Orchestrate migration workflows and business rules

### ✅ What it SHOULD do:
- **Workflow Orchestration**: Coordinate between repository, resolver, client
- **Business Logic**: Complex rules for migration applicability
- **File Processing**: Read, parse, and process migration files
- **Execution Logic**: Determine order, handle errors, manage transactions
- **Integration**: Coordinate between different components
- **High-level Operations**: Public API methods for migration operations

### ❌ What it should NOT do:
- **Direct Database Operations**: Bypass the repository for database access
- **Raw SQL Construction**: Build queries directly (use repository methods)

### Current Methods (Compliant):
- `initialize()` - Orchestrates component setup
- `executeMigrations()` - Workflow management
- `validateRollback()` - Business logic for rollback validation
- `findPendingMigrations()` - Complex logic combining file and database state
- `getMigrationStatus()` - High-level status aggregation

## Method Classification

### Data Access (MigrationRepository)
```typescript
// Simple database operations
addMigration(record: MigrationRecord): Promise<void>
getLatestMigrationStatus(number: string, name: string): Promise<Migration | null>
findLastMigrations(moduleIds: string[]): Promise<Migration[]>
updateMigrationStatus(id: string, status: string): Promise<void>
```

### Business Logic (MigrationService)
```typescript
// Complex workflow and rules
canApplyMigration(migration: MigrationFile): Promise<{ canApply: boolean; reason?: string }>
validateRollback(modules: string[]): Promise<RollbackValidation>
findPendingMigrations(modules?: string[]): Promise<MigrationFile[]>
executeMigrations(modules?: string[]): Promise<MigrationResult>
```

## Communication Pattern

```
MigrationService (Business Logic)
    ↓ delegates data operations
MigrationRepository (Data Access)
    ↓ executes queries
SurrealDBClient (Database)
```

**Rule**: MigrationService should NEVER directly access `client` for migration data operations. Always use MigrationRepository methods.

## Future Refactoring Needed

1. **Move `canApplyMigration()` from MigrationRepository to MigrationService**
2. **Move file operations from MigrationRepository.initialize() to MigrationService**
3. **Add schema initialization method to MigrationRepository that takes schema content as parameter**

This ensures:
- **Single Responsibility**: Each class has one clear purpose
- **Testability**: Data access can be mocked, business logic tested separately  
- **Maintainability**: Changes to business rules don't affect data access
- **Scalability**: Can swap database implementations without changing business logic

## Build Commands

- Build package: `nx run nx-surrealdb-migrations:build`
- Run tests: `nx run nx-surrealdb-migrations:test`
- Run single test: `nx run nx-surrealdb-migrations:test --testFile=src/lib/client.spec.ts`

## Critical Reminders

- **NEVER edit contents in dist or compiled folder manually**
- Always rebuild the package after making changes
- Schema files are copied during build process