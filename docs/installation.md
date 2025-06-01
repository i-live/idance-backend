# Installation Guide

This guide will help you set up the iDance development environment from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v8 or higher) - [Installation guide](https://pnpm.io/installation)
- **Git** - [Download here](https://git-scm.com/)

### Verify Prerequisites

```bash
node --version    # Should be v18+
pnpm --version    # Should be v8+
git --version     # Any recent version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/idancelive/idance.git
cd idance
```

### 2. Install Dependencies

This will install all dependencies for the entire monorepo:

```bash
pnpm install
```

### 3. Install NX CLI Globally (Recommended)

Install NX globally to use `nx` commands directly from anywhere:

```bash
pnpm add -g nx@20.8.2
```

Verify the installation:

```bash
nx --version
# Should show both Local and Global versions
```

### 4. Set Up Environment Variables

#### For Backoffice Development

```bash
# Copy the environment template
cp apps/backoffice/.env.example apps/backoffice/.env.local

# Edit with your actual values
nano apps/backoffice/.env.local
```

Your `.env.local` should contain:

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET="your-super-secret-key-for-jwt-tokens-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3002"

# SurrealDB Cloud Configuration (replace with your actual credentials)
SURREALDB_URL="wss://your-instance.surrealdb.cloud"
SURREALDB_NAMESPACE="idance"
SURREALDB_DATABASE="dev"
SURREALDB_ROOT_USER="your-username"
SURREALDB_ROOT_PASS="your-password"
#### NX Cloud Setup (Optional)

For distributed caching and CI optimization:

```bash
# Connect to NX Cloud
nx connect
```

Follow the browser prompts to create an account, then add the generated NX Cloud ID to your environment files:

```bash
# Add to .env or apps/backoffice/.env.local
NX_CLOUD_ID=your-generated-cloud-id
```
```

> **💡 Tip**: Generate a secure `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

### 4. Set Up Test User (SurrealDB Cloud)

If you're using SurrealDB Cloud, create a test user:

```bash
pnpm setup:test-user:dev
```

This will create a test user with:
- **Email**: `admin@idance.com`
- **Password**: `admin123`

### 5. Start Development

```bash
# Start the backoffice app
pnpm dev
```

The backoffice will be available at: http://localhost:3002

### 6. Test Authentication

1. Open http://localhost:3002
2. Click "Sign In"
3. Use the test credentials:
   - **Email**: `admin@idance.com`
   - **Password**: `admin123`

## Available Commands

### Development

```bash
# Start backoffice development server
pnpm dev

# Start specific app (when multiple apps are available)
pnpm exec nx run backoffice:dev
pnpm exec nx run user-sites:dev
pnpm exec nx run mobile:start
```

### Building

```bash
# Build all projects
pnpm build

# Build specific project
pnpm exec nx run backoffice:build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific project
pnpm exec nx run backoffice:test
pnpm exec nx run auth:test
```

### Database Setup

```bash
# Run database migrations
pnpm db:migrate
# or with nx directly
nx run database:migrate

# Test database connection
pnpm db:test-connection
# or with nx directly
nx run database:test-connection

# Create test user for development
pnpm setup:test-user:dev

# Create test user for staging
pnpm setup:test-user:staging

# Create test user for production
pnpm setup:test-user:prod

# Create test user for CI/CD
pnpm ci:setup-test-user
```

### Linting & Type Checking

```bash
# Lint all projects
pnpm lint

# Type check all projects
pnpm type-check

# Lint specific project
pnpm exec nx run backoffice:lint
```

## Project Structure

```
idance/
├── apps/
│   ├── backoffice/           # Admin interface (Next.js)
│   ├── user-sites/           # Dynamic user sites (Next.js)
│   ├── mobile/               # Mobile app (Expo/React Native)
│   └── services/             # Cloudflare Workers
├── packages/
│   ├── auth/                 # Shared authentication logic
│   ├── ui/                   # Shared UI components
│   ├── utils/                # Shared utilities
│   └── types/                # Shared TypeScript types
├── database/
│   ├── migrations/           # SurrealDB migrations
│   └── scripts/              # Database scripts
├── docs/                     # Documentation
├── nx.json                   # NX configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── package.json              # Root package.json with scripts
```

## Environment Setup

### Development Environment

For local development, you'll need:

1. **SurrealDB Cloud account** (recommended) or local SurrealDB instance
2. **Environment variables** configured in `.env.local` files
3. **Test user** created in your database

### SurrealDB Cloud Setup

1. Sign up at [SurrealDB Cloud](https://surrealdb.cloud/)
2. Create a new database instance
3. Note down your connection details:
   - WebSocket URL (starts with `wss://`)
   - Namespace and database names
   - Root user credentials
4. Update your `.env.local` file with these details

### Local SurrealDB (Alternative)

If you prefer to run SurrealDB locally:

```bash
# Using Docker
docker run -d -p 8000:8000 surrealdb/surrealdb:latest start --log trace --user root --pass root memory

# Update your .env.local
SURREALDB_URL="ws://localhost:8000/rpc"
SURREALDB_ROOT_USER="root"
SURREALDB_ROOT_PASS="root"
```

## Troubleshooting

### Common Issues

#### 1. "nx: command not found"

Install NX globally for direct access:

```bash
pnpm add -g nx@20.8.2
```

Alternative options:

**Option A: Use pnpm exec**
```bash
pnpm exec nx run backoffice:dev
```

**Option B: Use npm scripts (easiest)**
```bash
pnpm dev  # Uses the predefined scripts
```

#### 2. "Module not found" errors

Make sure all dependencies are installed:

```bash
pnpm install
```

#### 3. "Connection failed" to SurrealDB

- Verify your `SURREALDB_URL` is correct
- Check your SurrealDB Cloud instance is running
- Ensure your credentials are correct

#### 4. "Authentication failed"

- Verify your `SURREALDB_ROOT_USER` and `SURREALDB_ROOT_PASS`
- Make sure the user has admin privileges

#### 5. "Test user creation failed"

Run the setup script with debugging:

```bash
DEBUG=* pnpm setup:test-user:dev
```

### Getting Help

1. Check the [troubleshooting guide](./testing-authentication.md#debugging)
2. Review the [authentication documentation](./authentication.md)
3. Check the [architecture documentation](./architecture.md)

## Next Steps

Once you have the basic setup working:

1. **Explore the codebase** - Start with `apps/backoffice/src/app/page.tsx`
2. **Read the documentation** - Check out the files in `/docs`
3. **Set up additional apps** - Configure user-sites and mobile apps
4. **Deploy to staging** - Set up Cloudflare Pages deployment

## Development Workflow

### Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `pnpm test`
4. Lint your code: `pnpm lint`
5. Commit and push: `git commit -m "feat: your feature" && git push`
6. Create a pull request

### Working with NX

NX helps manage the monorepo efficiently:

```bash
# See what projects are affected by your changes
pnpm exec nx affected:graph

# Run tests only for affected projects
pnpm exec nx affected:test

# Build only affected projects
pnpm exec nx affected:build
```

### Environment Management

- **Development**: Use `.env.local` files
- **Staging**: Use `.env.staging` files
- **Production**: Use `.env.production` files
- **CI/CD**: Use `.env` files or environment variables

Happy coding! 🎉