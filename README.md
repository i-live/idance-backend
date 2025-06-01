# iDance Project

## Overview
iDance is a dance-focused social app enabling users to create dynamic, customizable professional dance sites  with admin tools and a mobile app that allows dancers to connect, hire, find work, find dance partners, showcase their work. It uses advanced AI techniques to assist dancers in achieving all of this.

### The monorepo uses:

#### Hosting:
- **CloudFlare Workers/Pages**: For Services, User Sites and Backoffice.
- **SurrealDB**: for managed hosting of the surrealdb database.
- **GitLab**: Primary code hosting (mirrored to GitHub).
- **Expo**: For building the React Native mobile app.

#### Building:
- **nx**: For task management and monorepo structure.
- **pnpm**: For efficient dependency management.
- **CircleCI**: For continuous integration and deployment.
- **Nx Cloud**: For distributed CI/CD and task caching.

#### AI:
- **Claude Code**: LLM for coding assistance.


## Stack
- **Apps**:
  - `/user-site`: Next.js for dynamic user sites, deployed on Cloudflare Pages with Workers.
  - `/backoffice`: Next.js admin interface, deployed on Cloudflare Pages.
  - `/mobile`: Expo/React Native app for iOS/Android.
  - `/backend/*`: Cloudflare Workers (notifications, image processing, vectorization, scheduler).
- **Packages**: `/packages/auth` (NextAuth.js, Expo auth), `/utils`, `/types`.
- **Database**: SurrealDB with migrations in `/database/migrations`.
- **Documentation**: `/docs` (Markdown/Mermaid).
- **CI/CD**: CircleCI (6,000 minutes), Nx Cloud (50,000 credits).
- **Hosting**: Github (primary), Gitlab (mirror), Cloudflare for apps/workers.
- **Development**: Windows laptop, Claude Code for coding/PRs/Wiki updates.

## Directory Structure
```
idance/
├── apps/
│   ├── user-sites/           # Next.js (Cloudflare Pages)
│   ├── backoffice/           # Next.js (Cloudflare Pages)
│   ├── mobile/               # Expo/React Native
│   └── services/             # Services running as Cloudflare Workers
│       ├── auth/             # unified authentication from expo
│       ├── notifications/    # native notifications to ios/android.
│       ├── image-processing/
│       ├── vectorization/
│       └── scheduler/
├── packages/
│   ├── auth/             # Shared auth logic
│   ├── utils/
│   └── types/
├── database/
│   ├── migrations/       # SurrealDB migrations
│   └── scripts/
├── docs/                 # Documentation (sync to GitLab Wiki)
├── marketing/
│   ├── pitchdeck/
│   └── outreach/
├── .circleci/
├── .gitignore
├── nx.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

## Authentication Flow
- **Providers**: Google OAuth, SurrealDB credentials (email/password).
- **Apps**:
  - `/user-sites`, `/backoffice`: NextAuth.js with JWT sessions, roles (user/admin).
  - `/mobile`: Expo `expo-auth-session` for Google OAuth, SurrealDB login.
- **Shared**: `/packages/auth` centralizes logic, storing users in SurrealDB.
- **Dynamic Sites**: `/user-sites` fetches user-specific data via DNS/database.

## Quick Start

For detailed setup instructions, see the [Installation Guide](./docs/installation.md).

### Prerequisites
- Node.js v18+
- pnpm v8+
- SurrealDB Cloud account (recommended)

### Basic Setup
```bash
# 1. Clone and install
git clone https://github.com/idancelive/idance.git
cd idance
pnpm install

# 2. Configure environment
cp apps/backoffice/.env.example apps/backoffice/.env.local
# Edit .env.local with your SurrealDB Cloud credentials

# 3. Create test user
pnpm setup:test-user:dev

# 4. Start development
pnpm dev
```

Visit http://localhost:3002 and sign in with:
- **Email**: `admin@idance.com`
- **Password**: `admin123`

### Available Commands
- `pnpm dev` - Start backoffice development server
- `pnpm build` - Build all projects
- `pnpm test` - Run all tests
- `pnpm setup:test-user:dev` - Create test user in database

For more commands and detailed setup, see [Installation Guide](./docs/installation.md).

## CI/CD
- **CircleCI**: Builds/tests (macOS for iOS), configured in `.circleci/config.yml`.
- **Nx Cloud**: Backup CI/CD with distributed tasks.
- **GitLab**: Primary host, mirrored to GitHub for redundancy.

## Documentation
- **/docs**: Markdown/Mermaid files (e.g., `auth-flow.mmd`), version-controlled.
- **GitLab Wiki**: Synced from `/docs` via Claude Code for accessibility.

## Contributing
- Use Claude Code for coding, PRs, and Wiki updates.
- Follow Nx conventions: `pnpm nx lint`, `pnpm nx test`.

## License
MIT