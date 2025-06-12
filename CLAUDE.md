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

## File Organization
- Place package-specific files in their respective package directories (packages/package-name/)
- Never add package-specific code/docs to monorepo root
- Use package-local documentation: packages/package-name/CONTEXT.md, DEVELOPMENT_PLAN.md
- Claude-specific files: Use .claude/ folder in package directory for context files
- Always check latest documentation using Context7 MCP tools before implementation