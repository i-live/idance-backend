# nx-surrealdb-migrations Development Plan

## Overview
Refactor nx-surrealdb-migrations plugin to support 3-executor architecture with dependency management while maintaining current functionality.

## Current Functionality to Preserve
- Module reference by number OR name (e.g., `--module 1` or `--module auth`)
- Pattern matching: `normalizedPattern === normalizedNumber || normalizedPattern === name.toLowerCase()`
- Support for: full directory name, number only, name only, number_name format
- File filtering with direction (up/down) and pattern matching
- Environment variable substitution in migration files
- Transaction wrapping for non-DDL operations
- Migration state tracking with checksums and execution times

## Target Architecture
- **migrate**: Apply pending migrations with dependency resolution
- **rollback**: Reverse migrations with safety checks  
- **status**: Show migration state with dependency visualization
- **config**: JSON/YAML configuration with module dependencies
- **gapped numbering**: 000_admin, 010_auth, 020_schema, 030_communications

---

## Step 1: Foundation & Cleanup 📋

### Step 1.1: Update numbering to gapped format ✅
**Tasks:**
- [x] Rename `001_auth` → `010_auth` 
- [x] Rename `002_schema` → `020_schema`
- [x] Update any hardcoded references
- [x] **Test:** Verify existing module reference logic works with new numbering
- [x] **Auto-test:** Create test for `findMatchingSubdirectory` with gapped numbers
- [x] **Commit:** `refactor(migrations): migrate to gapped numbering (010, 020, 030)`

**Completed:** Commit `cbdb1e3`

### Step 1.2: Clean unused code
**Tasks:**
- [ ] Remove `src/lib/migration-parser.ts` (unused, fully commented)
- [ ] Remove `src/lib/query-file-processor.ts` (duplicate of MigrationFileProcessor)
- [ ] Update `src/lib/index.ts` exports
- [ ] Clean up commented code in migrate/rollback/status executors
- [ ] **Test:** Verify all imports still work
- [ ] **Auto-test:** Run existing tests to ensure no regression
- [ ] **Commit:** `refactor(migrations): remove unused migration parser and query processor`

### Step 1.3: Rename path → module terminology
**Tasks:**
- [ ] Update `InitializeExecutorSchema.path` → `InitializeExecutorSchema.module`
- [ ] Update all references in executor.ts (lines 28, 45, 47, etc.)
- [ ] Update CLI help text and error messages
- [ ] **Test:** Verify `--module 1` and `--module auth` both work
- [ ] **Auto-test:** Test module pattern matching preserves current behavior
- [ ] **Commit:** `refactor(migrations): rename path parameter to module for clarity`

### Step 1.4: Add configuration system
**Tasks:**
- [ ] Create `src/lib/config-loader.ts` with JSON/YAML support
- [ ] Create `database/config.json` structure with dependencies
- [ ] Add validation for config format
- [ ] **Test:** Load config and validate dependency structure
- [ ] **Auto-test:** Unit tests for config loading (valid/invalid JSON/YAML)
- [ ] **Commit:** `feat(migrations): add config system with dependency management`

### Step 1.5: Update migration generator  
**Tasks:**
- [ ] Replace timestamp with sequential numbering in generator
- [ ] Add `--module` option to target specific modules
- [ ] Auto-create module directories with gapped numbering (030, 040, etc.)
- [ ] Update generator templates and file naming
- [ ] **Test:** Generate migrations in existing and new modules
- [ ] **Auto-test:** Test generator creates proper file structure
- [ ] **Commit:** `feat(generators): update migration generator for modular structure`

### Step 1.6: Create context documentation
**Tasks:**
- [ ] Create `.claude/CONTEXT.md` with current architecture state
- [ ] Document preserved functionality and patterns
- [ ] Add configuration examples and usage patterns
- [ ] **Commit:** `docs(migrations): add context documentation for development continuity`

---

## Step 2: Migration Engine ⚙️

### Step 2.1: Create dependency resolver
**Tasks:**
- [ ] Create `src/lib/dependency-resolver.ts`
- [ ] Implement config file parsing (JSON/YAML)
- [ ] Add topological sort for execution order
- [ ] Add circular dependency detection
- [ ] **Test:** Test dependency resolution with sample config
- [ ] **Auto-test:** Unit tests for topological sort and circular detection
- [ ] **Commit:** `feat(migrations): add dependency resolution system`

### Step 2.2: Create migration engine
**Tasks:**
- [ ] Create `src/lib/migration-engine.ts`
- [ ] Extract common logic from `initialize/executor.ts`
- [ ] Preserve module discovery pattern matching logic
- [ ] Add pending migration detection with dependencies
- [ ] **Test:** Run migrations using new engine vs old executor (compare results)
- [ ] **Auto-test:** Integration tests for migration execution flow
- [ ] **Commit:** `feat(migrations): create migration engine with dependency awareness`

### Step 2.3: Add rollback safety
**Tasks:**
- [ ] Implement rollback dependency checking in migration engine
- [ ] Prevent rollback if other modules depend on target
- [ ] Add force flag to override safety checks
- [ ] **Test:** Test safe rollback scenarios and blocked rollbacks
- [ ] **Auto-test:** Test rollback safety with dependency chains
- [ ] **Commit:** `feat(migrations): add rollback safety with dependency checking`

---

## Step 3: New Executors 🚀

### Step 3.1: Create `migrate` executor
**Tasks:**
- [ ] Create `src/executors/migrate/executor.ts`
- [ ] Create `src/executors/migrate/schema.json`
- [ ] Implement using `MigrationEngine` and `DependencyResolver`
- [ ] Preserve module filtering (by number/name) from current logic
- [ ] **Test:** Compare migrate vs initialize executor results
- [ ] **Auto-test:** Test module filtering preserves current behavior
- [ ] **Commit:** `feat(executors): add migrate executor with dependency resolution`

### Step 3.2: Create `rollback` executor  
**Tasks:**
- [ ] Create `src/executors/rollback/executor.ts`
- [ ] Create `src/executors/rollback/schema.json`
- [ ] Implement reverse migration logic with safety checks
- [ ] Add cascade rollback option
- [ ] **Test:** Test rollback with dependency conflicts
- [ ] **Auto-test:** Test rollback execution and safety validation
- [ ] **Commit:** `feat(executors): add rollback executor with safety checks`

### Step 3.3: Create `status` executor
**Tasks:**
- [ ] Create `src/executors/status/executor.ts`
- [ ] Create `src/executors/status/schema.json`
- [ ] Create pretty status output with dependency info
- [ ] Show pending migrations and dependency blocks
- [ ] **Test:** Verify status output accuracy against database state
- [ ] **Auto-test:** Test status formatting and dependency visualization
- [ ] **Commit:** `feat(executors): add status executor with dependency visualization`

---

## Step 4: Integration & Testing 🔄

### Step 4.1: Update database project configuration
**Tasks:**
- [ ] Update `database/project.json` with new executor targets
- [ ] Keep `initialize` for transition period
- [ ] Add sample `database/config.json` with current structure
- [ ] **Test:** Test all executors through NX commands
- [ ] **Auto-test:** Integration tests for NX executor configuration
- [ ] **Commit:** `feat(config): update database project with new executors`

### Step 4.2: Update plugin configuration
**Tasks:**
- [ ] Update `executors.json` with new executor definitions
- [ ] Mark `initialize` as deprecated in schema
- [ ] Update package exports and index files
- [ ] **Test:** Verify plugin discovery and executor registration
- [ ] **Auto-test:** Test executor schema validation
- [ ] **Commit:** `feat(plugin): register new executors and deprecate initialize`

### Step 4.3: End-to-end testing
**Tasks:**
- [ ] Test fresh database setup with `migrate`
- [ ] Test module-specific migrations (`--module 010` and `--module auth`)
- [ ] Test dependency blocking (communications without auth)
- [ ] Test rollback safety and force override
- [ ] Test status reporting accuracy
- [ ] **Auto-test:** Complete E2E test suite covering all scenarios
- [ ] **Commit:** `test(migrations): validate complete migration workflow`

---

## Step 5: Polish & Documentation ✨

### Step 5.1: Remove deprecated `initialize`
**Tasks:**
- [ ] Remove `src/executors/initialize/` directory
- [ ] Update `executors.json` and remove initialize references
- [ ] Update documentation examples
- [ ] **Test:** Verify all functionality available through new executors
- [ ] **Auto-test:** Ensure no broken references to initialize
- [ ] **Commit:** `refactor(executors): remove deprecated initialize executor`

### Step 5.2: Update README and documentation
**Tasks:**
- [ ] Update `README.md` with new workflow examples
- [ ] Document configuration file format and dependencies
- [ ] Add troubleshooting guide for dependency issues
- [ ] Create migration best practices guide
- [ ] Update `CONTEXT.md` with final architecture
- [ ] **Test:** Verify all documented examples work
- [ ] **Commit:** `docs(migrations): complete documentation for new architecture`

---

## Future Enhancements (Step 6: Phase II) 🚀

### Step 6.1: Export/Import generators
**Tasks:**
- [ ] Create `export-module` generator for packaging modules
- [ ] Create `import-module` generator for reusing modules
- [ ] Support module packaging with dependencies
- [ ] **Test:** Test module export/import workflow
- [ ] **Auto-test:** Test module packaging and validation
- [ ] **Commit:** `feat(generators): add module export/import functionality`

---

## Testing Strategy

### Unit Tests
- Config loader (JSON/YAML parsing, validation)
- Dependency resolver (topological sort, circular detection)
- Migration engine (execution logic, state management)
- Module pattern matching (preserve current behavior)

### Integration Tests  
- Complete migration workflows
- Executor parameter handling
- Database state consistency
- Error handling and recovery

### End-to-End Tests
- Fresh database setup
- Module dependency enforcement
- Rollback safety mechanisms
- Status reporting accuracy

## Configuration Format

```json
{
  "modules": {
    "000_admin": {
      "name": "System Administration", 
      "depends": []
    },
    "010_auth": {
      "name": "Authentication & Users",
      "depends": ["000_admin"]  
    },
    "020_schema": {
      "name": "Application Schema",
      "depends": ["010_auth"]
    },
    "030_communications": {
      "name": "Messaging & Social",
      "depends": ["010_auth"]
    }
  },
  "settings": {
    "configFormat": "json",
    "useTransactions": true
  }
}
```

## Preserved Functionality Checklist
- [x] Module reference by number (1, 10, 20) or name (auth, schema)
- [x] Pattern matching: `001_auth` matches `1`, `auth`, `1_auth`, `001_auth`
- [x] File filtering by direction (up/down) and pattern
- [x] Environment variable substitution `${VARIABLE_NAME}`
- [x] Transaction wrapping for non-DDL operations
- [x] Migration tracking with checksums and execution times
- [x] Force flag to override state conflicts
- [x] Subdirectory discovery and matching logic

## Success Criteria
✅ All current functionality preserved
✅ New dependency management prevents conflicts  
✅ Safe rollback with dependency checking
✅ Clear status visualization with dependencies
✅ Comprehensive test coverage (>90%)
✅ Complete documentation with examples
✅ Smooth transition from initialize executor