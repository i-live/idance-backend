# nx-surrealdb-migrations Context

## Current State

### Phase: Step 1 - Foundation & Cleanup
- **Step 1.1**: ✅ Update numbering to gapped format (COMPLETED)
  - Renamed 001_auth → 010_auth, 002_schema → 020_schema
  - Updated README examples
  - Fixed pattern matching logic for gapped numbering
  - Added comprehensive tests (all passing)
  - Committed: `cbdb1e3`
  
- **Step 1.2**: ✅ Clean unused code (COMPLETED)
  - Removed migration-parser.ts, query-file-processor.ts
  - Removed unplanned migrate-app executor and module-loader.ts
  - Created placeholder implementations for migrate/rollback/status executors
  - Updated imports in index.ts
  - All tests passing
  - Ready to commit

## Architecture Decisions

### 1. Module Numbering (Gapped)
- **Decision**: Use gapped numbering (000, 010, 020, 030...)
- **Rationale**: Allows inserting new modules between existing ones
- **Pattern**: `XXX_modulename` where XXX is padded to 3 digits with 10-increment gaps

### 2. Testing Strategy (NX Standards)
- **Pattern**: Use `*.spec.ts` files (not `*.test.ts`)
- **Location**: Colocated with source files
- **Framework**: Jest with @nx/devkit/testing utilities
- **Mocking**: Mock fs/external dependencies to avoid I/O in tests
- **Coverage**: Target >90% for critical migration logic

### 3. Configuration System
- **Format**: Support both JSON and YAML
- **Location**: `database/config.json` (or `.yaml`)
- **Structure**: Module dependencies declared explicitly
```json
{
  "modules": {
    "010_auth": {
      "depends": ["000_admin"]
    }
  }
}
```

### 4. 3-Executor Architecture
- **migrate**: Apply pending migrations (replaces initialize)
- **rollback**: Reverse migrations with safety checks
- **status**: Show migration state with dependencies

## Preserved Functionality

### Module Reference Patterns
All these patterns must continue to work:
- By number: `--module 10` → `010_auth`
- By name: `--module auth` → `010_auth`
- By full name: `--module 010_auth` → `010_auth`
- Legacy support: `--module 0` → `000_admin`

### Pattern Matching Logic
```typescript
// Current logic that must be preserved:
normalizedPattern === normalizedNumber ||
normalizedPattern === name.toLowerCase() ||
normalizedPattern === `${normalizedNumber}_${name.toLowerCase()}`
```

## Test Patterns (NX Community Standards)

### 1. File Structure
```
src/
├── lib/
│   ├── migration-file.ts
│   └── migration-file.spec.ts    # Colocated test
├── executors/
│   └── migrate/
│       ├── executor.ts
│       └── executor.spec.ts      # Executor tests
```

### 2. Test Template
```typescript
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

describe('FeatureName', () => {
  let tree: Tree;
  
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });
  
  it('should do something', async () => {
    // Test implementation
  });
});
```

### 3. Mocking Patterns
```typescript
// Mock fs to avoid file I/O
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock responses
mockFs.readdir.mockResolvedValue([...]);
```

## Next Steps

1. Complete Step 1.2: Remove unused files
2. Step 1.3: Rename path → module terminology
3. Step 1.4: Add configuration system
4. Step 1.5: Update migration generator
5. Create comprehensive tests for each component

## Known Issues

- NX cache error when running tests (use `--skip-nx-cache`)
- Jest heap memory issues with large test suites

## Development Commands

```bash
# Run specific test
nx test nx-surrealdb-migrations --testPathPattern=migration-file.spec.ts

# Run without cache
nx test nx-surrealdb-migrations --skip-nx-cache

# Generate migration
nx g @idance/nx-surrealdb-migrations:migration create-users --module auth

# Test current functionality
nx run database:initialize --module 10
```