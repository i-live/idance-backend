# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Run dev server: `nx run backoffice:dev` or `pnpm dev`
- Build all apps: `nx run-many --target=build --all` or `pnpm build`
- Lint all code: `nx run-many --target=lint --all` or `pnpm lint`
- Type check: `nx run-many --target=type-check --all` or `pnpm type-check`
- Run all tests: `nx run-many --target=test --all` or `pnpm test`
- Run specific app tests: `nx run backoffice:test` or `cd apps/backoffice && pnpm test`
- Run single test file: `nx run backoffice:test --testFile=__tests__/auth.test.ts`
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