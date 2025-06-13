# Filename Parameter Feature

## Overview

Added filename parameter support to all NX SurrealDB executors with auto-globbing pattern matching, similar to the existing module resolution.

## Features

### Auto-Globbing Pattern Matching

The filename parameter supports intelligent pattern matching:

- **Numeric patterns**: `--filename 1` resolves to `0001_authentication_up.surql`
- **Name patterns**: `--filename auth` resolves to `0001_authentication_up.surql`  
- **Full filename**: `--filename 0001_authentication_up.surql` resolves to exact match
- **Multiple patterns**: `--filename 1,2,auth` resolves to multiple files
- **Mixed patterns**: `--filename 0001,auth,0003_users_up.surql` supports mixed pattern types

### Executor Support

#### Migrate Executor
```bash
# Run specific migration file by number
nx run database:migrate --filename 1

# Run specific migration file by name
nx run database:migrate --filename auth

# Run specific migration file by full name
nx run database:migrate --filename 0001_authentication_up.surql

# Combine with module filtering
nx run database:migrate --module auth --filename 1

# Run multiple specific files
nx run database:migrate --filename 1,2,auth

# Multiple modules with multiple files
nx run database:migrate --module 010,020 --filename 1,2
```

#### Rollback Executor
```bash
# Rollback specific file by number (finds corresponding down file)
nx run database:rollback --filename 1

# Rollback specific file by name
nx run database:rollback --filename auth

# Combine with module filtering
nx run database:rollback --module auth --filename 1

# Rollback multiple specific files
nx run database:rollback --filename 1,2,auth

# Multiple modules with multiple files
nx run database:rollback --module 010,020 --filename 1,2
```

**Special Rollback Logic:**
- Automatically resolves to `_down.surql` files
- Validates dependency conflicts before rollback
- Shows warnings for potential dependency issues

#### Status Executor
```bash
# Show status for specific file
nx run database:status --filename 1

# Show status for specific file by name
nx run database:status --filename auth

# JSON output for specific file
nx run database:status --filename 1 --json
```

## Architecture

### PatternResolver Class

Central utility for all pattern resolution:

```typescript
class PatternResolver {
  // Resolve module patterns (existing functionality)
  resolveModules(patterns: string[]): PatternResolutionResult<ResolvedModule>
  
  // Resolve filename patterns with direction support
  async resolveFilenames(
    patterns: string[], 
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<PatternResolutionResult<ResolvedFilename>>
  
  // Special rollback filename resolution with dependency checking
  async resolveRollbackFilenames(
    patterns: string[],
    targetModules?: string[]
  ): Promise<PatternResolutionResult<ResolvedFilename> & { dependencyWarnings: string[] }>
}
```

### Integration with MigrationService

The `MigrationService` now provides filename resolution methods:

```typescript
class MigrationService {
  // Existing module resolution
  resolveTargetModules(targetModules: string[]): string[]
  
  // New filename resolution methods
  async resolveTargetFilenames(
    filenamePatterns: string[], 
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<ResolvedFilename[]>
  
  async resolveRollbackFilenames(
    filenamePatterns: string[],
    targetModules?: string[]
  ): Promise<{ resolved: ResolvedFilename[]; warnings: string[] }>
}
```

### Executor Integration

All executors now support the `filename` parameter:

```typescript
interface ExecutorSchema {
  // ... existing parameters
  filename?: string | number;
}
```

The `executeMigrations` method was updated to support filename filtering:

```typescript
async executeMigrations(
  targetModules?: string[],
  operation: 'migrate' | 'rollback' = 'migrate',
  targetFilenames?: string[]
): Promise<MigrationResult>
```

## Error Handling

- **Pattern Not Found**: Clear error messages showing available options
- **Dependency Conflicts**: Warnings for rollback operations that might break dependencies
- **File Access**: Graceful handling of missing directories or files

## Conflict Resolution

### Multiple Module Matches

When a filename pattern matches files in multiple modules:

**Without module specified:**
```bash
# This will operate on ALL matching files across modules
nx run database:status --filename 0001
# → Shows: 000_admin/0001_db_server_databases_up.surql
#          010_auth/0001_authentication_up.surql
#          020_users/0001_create_users_up.surql
```

**With module specified:**
```bash
# This will only look in the specified module
nx run database:status --filename 0001 --module 010
# → Shows: 010_auth/0001_authentication_up.surql (only)
```

### Behavior Guidelines

1. **Module + Filename**: When both are specified, search only within that module
2. **Filename Only**: When multiple matches exist, operate on all of them
3. **Exact Matches**: Full filenames always take precedence over pattern matching

## Examples

### Migration Scenarios

```bash
# Migrate only the authentication setup file
nx run database:migrate --filename auth

# Migrate a specific numbered file in the users module
nx run database:migrate --module users --filename 2

# Migrate all files matching pattern "0001" across all modules
nx run database:migrate --filename 0001

# Dry run a specific migration
nx run database:migrate --filename 1 --dryRun
```

### Rollback Scenarios

```bash
# Rollback the last authentication migration
nx run database:rollback --filename auth
# → Automatically finds and runs 0001_authentication_down.surql

# Force rollback despite dependency warnings
nx run database:rollback --filename auth --force

# Dry run rollback to see what would happen
nx run database:rollback --filename 1 --dryRun
```

### Status Scenarios

```bash
# Check status of a specific file
nx run database:status --filename auth
# → Shows: ✅ 010_auth/0001_authentication_up.surql

# Get JSON status for automation
nx run database:status --filename 1 --json
# → {"files": [{"filename": "0001_authentication_up.surql", ...}]}

# Check status of multiple files
nx run database:status --filename 1,2,auth --detailed

# Multiple modules with multiple files
nx run database:status --module 010,000 --filename 0001,0002 --detailed
```

## Benefits

1. **Granular Control**: Target specific migration files instead of entire modules
2. **Intuitive Patterns**: Use numbers, names, or full filenames as convenient
3. **Safety**: Rollback validation prevents breaking dependencies
4. **Consistency**: Same pattern matching logic across all executors
5. **Backward Compatible**: Existing module-only workflows continue to work

## Implementation Notes

- **Code Reuse**: Single `PatternResolver` class handles both modules and filenames
- **Performance**: Filesystem operations are cached and optimized
- **Testing**: Comprehensive test coverage for all pattern matching scenarios
- **Error Messages**: Clear, actionable error messages for failed pattern resolution

This feature significantly enhances the developer experience by providing fine-grained control over which migrations to execute while maintaining the existing module-based workflow.