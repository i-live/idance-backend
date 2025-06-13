# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
**ALWAYS use NX native commands for testing - never use `npm test` directly:**
- Run dev server: `nx run backoffice:dev` or `pnpm dev`
- Build all apps: `nx run-many --target=build --all` or `pnpm build`
- Lint all code: `nx run-many --target=lint --all` or `pnpm lint`
- Type check: `nx run-many --target=type-check --all` or `pnpm type-check`
- Run all tests: `nx run-many --target=test --all` or `pnpm test`
- Run specific app tests: `nx run backoffice:test`
- Run package tests: `nx run nx-surrealdb-migrations:test`
- Run single test file: `nx run nx-surrealdb-migrations:test --testFile=src/lib/client.spec.ts`
- Run database migrations: `pnpm db:migrate`

## Code Style Guidelines
- Use TypeScript for type safety with strict type checking
- Follow NX monorepo structure with apps and packages
- Import order: external libraries first, then internal packages (@idance/*)
- Use React 19 with Next.js 15 for frontend apps
- Error handling: use try/catch with specific error types
- Naming: camelCase for variables/functions, PascalCase for components/types
- Testing: use Vitest with testing-library for React components
- Database: SurrealDB with migration scripts in the database directory
- For React components: prefer functional components with hooks
- Authentication: use NextAuth for auth flows

## Code Organization & Reuse - MANDATORY
**ALWAYS prioritize modular design and code reuse:**

### 1. **Create Shared Utilities Before Writing Duplicate Code**
- **Identify Patterns**: Before implementing functionality, check if similar code exists
- **Abstract Early**: When you see the same pattern twice, create a shared utility
- **Central Libraries**: Place shared utilities in the appropriate shared directory for the codebase:
  - **Analyze Existing Structure**: Look for existing utility/lib directories in the codebase
  - **Follow Conventions**: Use the same patterns as existing shared code
  - **Common Locations**: 
    - NX plugins: `/src/lib/` directories
    - React apps: `/src/utils/`, `/src/lib/`, or `/src/shared/`
    - Node.js: `/lib/`, `/utils/`, or `/src/common/`
    - Monorepos: Shared packages or workspace-level utilities
  - **When in Doubt**: Create a `/utils/` or `/lib/` directory following the project's naming conventions
- **Example**: TreeUtils library for NX Tree API operations

### 2. **Shared Library Guidelines**
- **Comprehensive Testing**: Every shared utility must have complete test coverage
- **Clear Documentation**: Document all public methods with examples
- **Single Responsibility**: Each utility should have a clear, focused purpose
- **Error Handling**: Centralize error handling patterns in utilities
- **Type Safety**: Use TypeScript generics for flexible, type-safe utilities

### 3. **Refactoring for Reuse**
- **Look for Duplication**: Actively search for code patterns that repeat
- **Extract Utilities**: Move duplicated logic to shared libraries
- **Update All Usages**: Ensure all existing code uses the new utilities
- **Maintain Tests**: Keep all tests passing during refactoring

### 4. **Examples of Good Abstractions**
```typescript
// ❌ BAD: Duplicated Tree operations across files
if (tree.exists(modulePath)) {
  const files = tree.children(modulePath);
  const sqlFiles = files.filter(f => f.endsWith('.surql'));
}

// ✅ GOOD: Shared utility for common operations
import { TreeUtils } from '../../lib/tree-utils';
const migrationFiles = TreeUtils.getMigrationFiles(tree, modulePath);
```

### 5. **Benefits of This Approach**
- **DRY Principle**: Don't Repeat Yourself - write code once, use everywhere
- **Consistency**: All components behave identically using shared logic
- **Maintainability**: Updates happen in one place, benefit all users
- **Testing**: Centralized testing of core functionality
- **Extensibility**: New features can leverage existing utilities

## Documentation Access
- For up-to-date library documentation, use Context7 MCP tools
- Always check current docs for Next.js, React, SurrealDB, NX, and other key dependencies
- When encountering library-specific issues, fetch latest docs first

## Usage Tracking
Always include usage updates in responses showing:
- Current usage percentage of plan limit
- Time remaining until 5-hour auto-reset
- Alert when approaching limits
- Estimated API costs if using pay-per-token (AWS Bedrock, Anthropic API)
- Token usage breakdown (input/output tokens when relevant)

**User Plan:** Claude Max Pro ($100/month) - includes higher usage limits and priority access

## Development Workflow

### Test-Driven Development (TDD) - MANDATORY
**ALWAYS follow TDD methodology:**
1. **Write Tests First**: Before implementing any feature, write comprehensive tests that define the expected behavior
2. **Red Phase**: Run tests to confirm they fail (proving they test the right thing)
3. **Green Phase**: Write minimal code to make tests pass
4. **Refactor Phase**: Improve code quality while keeping tests green
5. **Repeat**: For each new feature or bug fix

### TDD Implementation Guidelines
- **Never write production code without a failing test first**
- Write the simplest test that could possibly fail
- Write only enough production code to make the failing test pass
- Refactor both test and production code to improve design
- Each test should test one specific behavior
- Use descriptive test names that explain the expected behavior
- Mock external dependencies and filesystem operations in tests
- Prefer integration tests for NX generators and executors

### Test Quality Standards
- **All tests must pass before committing any code**
- **No timeouts in tests** - if a test times out, investigate the root cause:
  - Check for infinite loops or blocking operations
  - Verify mocks are properly configured
  - Use debug logging to identify bottlenecks
  - Consider if the code under test is doing too much
- Use debug messages and logging to understand test failures
- Test edge cases and error conditions
- Ensure tests are deterministic and isolated

### Commit Standards
- Commit each major implementation milestone with descriptive messages
- Use conventional commit format: feat/fix/refactor/docs followed by scope
- Regular commits allow testing and rollback at each phase
- Example: "feat(migrations): add dependency resolution system"
- Update DEVELOPMENT_PLAN.md checkboxes as tasks are completed
- Maintain .claude/CONTEXT.md with current state and decisions
- Use TodoWrite tool to track work-in-progress items
- Document test patterns following NX community standards

## Session Continuation
**IMPORTANT:** After context compacting or session continuation:
1. Always read this CLAUDE.md file first to refresh instructions
2. Use TodoRead tool to check current task status
3. Continue from the last task that was in progress
4. Follow the exact commands and patterns documented here

## Package Development
**IMPORTANT:** When making changes to NX packages (e.g., nx-surrealdb-migrations):
1. Always build the package after making changes: `nx run <package-name>:build`
2. Changes won't take effect until the package is built
3. Example: `nx run nx-surrealdb-migrations:build`
4. This applies to all code changes in packages/ directory

**CRITICAL - NEVER EDIT COMPILED FILES:**
- NEVER manually edit files in `dist/` or any compiled/generated folders
- NEVER attempt to fix issues by modifying compiled JavaScript files
- ALWAYS edit the source TypeScript files in `src/` directories
- If something is missing in `dist/`, check the build configuration in `project.json`
- If files aren't being copied correctly, rebuild with `nx run <package>:build`

## File Organization
- Place package-specific files in their respective package directories (packages/package-name/)
- Never add package-specific code/docs to monorepo root
- Use package-local documentation: packages/package-name/CONTEXT.md, DEVELOPMENT_PLAN.md
- Claude-specific files: Use .claude/ folder in package directory for context files
- Always check latest documentation using Context7 MCP tools before implementation