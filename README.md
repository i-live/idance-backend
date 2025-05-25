# iDance Backend

SurrealDB-powered backend for the iDance dating application with modern authentication and real-time features.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate JWT secrets
echo "SURREALDB_JWT_SECRET=$(openssl rand -base64 64)" >> .env
echo "SURREALDB_WORKER_JWT_SECRET=$(openssl rand -base64 64)" >> .env

# Edit .env file with your configuration
nano .env
```

### 2. Start SurrealDB

```bash
# Using Docker (recommended)
docker run --rm -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass root memory

# Or install locally: https://surrealdb.com/docs/installation
surreal start --user root --pass root memory
```

### 3. Run Database Migrations

```bash
# Run all migrations in sequence (recommended)
./scripts/run-migration.sh

# Run specific migration for testing
./scripts/run-migration.sh --migration 0003

# Skip validation for development
./scripts/run-migration.sh --skip-validation

# Get help
./scripts/run-migration.sh --help
```

## 📁 Project Structure

```
backend/
├── documentation/           # Comprehensive documentation
│   ├── authentication.md   # Authentication system guide
│   ├── jwt-secrets-guide.md # JWT secrets management
│   ├── architecture.md     # System architecture
│   └── database.md         # Database schema documentation
├── migrations/             # Database migrations
│   └── 0000_initial_schema.surql
├── scripts/               # Utility scripts
│   └── run-migration.sh   # Automated migration runner
├── .env.example          # Environment variables template
└── README.md            # This file
```

## 🔐 Authentication System

### Features

- **SurrealDB v2.0 RECORD-based Authentication**: Modern, native authentication
- **Multi-Provider OAuth**: Google, Facebook, Apple support
- **JWT Token Management**: Secure token generation and validation
- **Real-time User Status**: Active session tracking and validation
- **Enhanced Security**: Argon2 password hashing, session management

### Access Methods

1. **User Access** (`user`): Email/password authentication for end users
2. **OAuth Access** (`oauth`): Social login integration
3. **Worker Access** (`worker`): Backend service authentication

## 🗄️ Database Schema

### Core Tables

- **`user`**: User profiles and authentication data
- **`user_profile`**: Extended user profile information
- **`match`**: User matching system
- **`message`**: Real-time messaging
- **`notification`**: Push notifications
- **`subscription`**: Payment and subscription management

## 🔧 Configuration

### Required Environment Variables

```env
# SurrealDB Connection
SURREALDB_URL=ws://localhost:8000
SURREALDB_NAMESPACE=idance
SURREALDB_DATABASE=dev
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root

# JWT Secrets (Generate with: openssl rand -base64 64)
SURREALDB_JWT_SECRET=your-generated-secret
SURREALDB_WORKER_JWT_SECRET=your-worker-secret
```

## 📚 Documentation

### Essential Guides

- **[Authentication Guide](./documentation/authentication.md)**: Complete authentication setup
- **[Role-Based Access Control](./documentation/role-based-access-control.md)**: User roles and permissions system
- **[JWT Secrets Guide](./documentation/jwt-secrets-guide.md)**: Secure secret management
- **[Database Schema](./documentation/database.md)**: Database design and relationships
- **[Architecture Overview](./documentation/architecture.md)**: System design and patterns

## 🛠️ Development

### Prerequisites

- **SurrealDB**: v2.0+ ([Installation Guide](https://surrealdb.com/docs/installation))
- **Node.js**: v18+ (for client applications)
- **OpenSSL**: For generating JWT secrets

### Development Workflow

1. **Setup Environment**: `cp .env.example .env`
2. **Start Database**: `surreal start --user root --pass root memory`
3. **Run Migrations**: `./scripts/run-migration.sh`
4. **Test Authentication**: Connect via SurrealDB CLI

### Common Commands

```bash
# Generate new JWT secret
openssl rand -base64 64

# Connect to SurrealDB CLI
surreal sql --conn ws://localhost:8000 --user root --pass root --ns idance --db dev

# Export database schema
surreal export --conn ws://localhost:8000 --user root --pass root --ns idance --db dev schema.surql
```

## 🚀 Deployment

### Cloudflare Workers

```bash
# Set environment secrets
wrangler secret put SURREALDB_JWT_SECRET
wrangler secret put SURREALDB_WORKER_JWT_SECRET

# Deploy
wrangler deploy
```

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid JWT signature"**: Verify JWT secrets match between generation and verification
2. **"Connection refused"**: Ensure SurrealDB is running on the correct port
3. **"Migration failed"**: Verify environment variables are set correctly

### Getting Help

- Check the [JWT Secrets Guide](./documentation/jwt-secrets-guide.md) for secret management
- Review [Authentication Documentation](./documentation/authentication.md) for auth setup
- Consult [SurrealDB Documentation](https://surrealdb.com/docs) for database issues

## 📄 License

This project is part of the iDance application. See the main repository for license information.