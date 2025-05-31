# iDance Project AI Instructions

## Project Overview
This is a monorepo for the iDance platform using pnpm + NX for package management and task running.

## CRITICAL COMMAND RULES

### ALWAYS run commands from root directory (/home/nsm/code/idance/idance/)
- ❌ NEVER: `cd apps/backoffice && npm run dev`
- ❌ NEVER: `cd database && ./scripts/migrate.sh`
- ✅ ALWAYS: `pnpm dev` (from root)
- ✅ ALWAYS: `pnpm db:migrate` (from root)

### Standardized Commands (from root only)
```bash
# Package management
pnpm install
pnpm add --filter <workspace> <package>

# Development
pnpm dev                         # Start backoffice development
pnpm build                       # Build all applications
pnpm test                        # Run all tests
pnpm lint                        # Lint all code

# Database operations
pnpm db:migrate                  # Run database migrations
pnpm db:test-connection          # Test database connection

# Advanced NX commands
nx run <project>:<target>        # Run specific project tasks
nx graph                         # View dependency graph
```

## File Structure
- All file paths relative to root: `apps/backoffice/src/app/page.tsx`
- Environment variables in root `.env` file
- Never assume files exist in subdirectories without checking

## Technology Stack
- **Package Manager**: pnpm
- **Build System**: NX
- **Frontend**: NextJS 14+ with App Router
- **Authentication**: NextAuth.js v5
- **Database**: SurrealDB Cloud
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages/Workers

## Before Suggesting Commands
1. Verify execution from root directory
2. Use standardized pnpm scripts when available
3. Only use direct NX commands for advanced operations
4. Reference docs/architecture.md for detailed patterns

## Common Patterns
- Always start suggestions with "From the root directory:"
- Use documented command patterns consistently
- Check existing files before creating new ones
- Follow the established monorepo structure