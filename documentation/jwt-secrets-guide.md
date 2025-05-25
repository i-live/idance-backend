# JWT Secrets Management Guide

This guide explains how to properly generate, manage, and use JWT secrets for your SurrealDB authentication system.

## Overview

JWT secrets are cryptographic keys used to sign and verify JSON Web Tokens. They must be:
- **Secure**: Long, random, and unpredictable
- **Secret**: Never committed to version control
- **Environment-specific**: Different for dev, staging, and production
- **Rotatable**: Able to be changed when needed

## Generating JWT Secrets

### Method 1: Using OpenSSL (Recommended)

```bash
# Generate a 256-bit (32-byte) secret for user authentication
openssl rand -base64 64

# Generate a separate secret for worker authentication
openssl rand -base64 64

# Generate NextAuth.js secret (if using)
openssl rand -base64 32
```

### Method 2: Using Node.js

```javascript
// Generate a 256-bit secret
const crypto = require('crypto');
console.log(crypto.randomBytes(64).toString('base64'));
```

### Method 3: Using Python

```python
import secrets
import base64

# Generate a 256-bit secret
secret = secrets.token_bytes(64)
print(base64.b64encode(secret).decode('utf-8'))
```

### Method 4: Online Generator (Use with caution)

For development only, you can use: https://generate-secret.vercel.app/64

**⚠️ Warning**: Never use online generators for production secrets.

## Environment Configuration

### 1. Copy the Example Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Generate Your Secrets

```bash
# Generate user JWT secret
echo "SURREALDB_JWT_SECRET=$(openssl rand -base64 64)" >> .env

# Generate worker JWT secret  
echo "SURREALDB_WORKER_JWT_SECRET=$(openssl rand -base64 64)" >> .env

# Generate NextAuth secret (if using)
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

### 3. Update Your .env File

Edit `backend/.env` and replace the placeholder values:

```env
# SurrealDB Configuration
SURREALDB_URL=ws://localhost:8000
SURREALDB_NAMESPACE=idance
SURREALDB_DATABASE=dev
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root

# JWT Secrets (Generated with openssl rand -base64 64)
SURREALDB_JWT_SECRET=your-actual-generated-secret-here
SURREALDB_WORKER_JWT_SECRET=your-actual-generated-worker-secret-here

# NextAuth.js Configuration
NEXTAUTH_SECRET=your-actual-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Running Migrations with Environment Variables

### Method 1: Environment Variable Substitution (Recommended)

Create a script to substitute environment variables before running migrations:

```bash
#!/bin/bash
# scripts/run-migration.sh

# Load environment variables
source .env

# Substitute environment variables in migration file
envsubst < migrations/0000_initial_schema.surql > /tmp/migration_with_secrets.surql

# Run the migration
surreal import --conn $SURREALDB_URL --user $SURREALDB_ROOT_USER --pass $SURREALDB_ROOT_PASS --ns $SURREALDB_NAMESPACE --db $SURREALDB_DATABASE /tmp/migration_with_secrets.surql

# Clean up temporary file
rm /tmp/migration_with_secrets.surql
```

### Method 2: Manual Replacement

Before running migrations, manually replace the placeholders:

1. Copy the migration file: `cp migrations/0000_initial_schema.surql migrations/0000_with_secrets.surql`
2. Replace `${SURREALDB_JWT_SECRET}` with your actual user JWT secret
3. Replace `${SURREALDB_WORKER_JWT_SECRET}` with your actual worker JWT secret
4. Run the migration with the updated file
5. Delete the file with secrets: `rm migrations/0000_with_secrets.surql`

### Method 3: Using SurrealDB CLI with Variables

```bash
# Set environment variables
export SURREALDB_JWT_SECRET="your-actual-secret"
export SURREALDB_WORKER_JWT_SECRET="your-actual-worker-secret"

# Run migration with variable substitution
envsubst < migrations/0000_initial_schema.surql | surreal sql --conn ws://localhost:8000 --user root --pass root --ns idance --db dev
```

## Security Best Practices

### 1. Never Commit Secrets to Git

Ensure your `.env` file is in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.staging

# Temporary files with secrets
*_with_secrets.surql
```

### 2. Use Different Secrets for Different Environments

- **Development**: Use generated secrets, can be shared among dev team
- **Staging**: Use different secrets from development
- **Production**: Use highly secure, unique secrets

### 3. Rotate Secrets Regularly

Plan for secret rotation:
- Generate new secrets
- Update environment variables
- Re-run migrations or update access definitions
- Invalidate old tokens

### 4. Store Production Secrets Securely

For production deployments:
- **Cloudflare Workers**: Use Cloudflare Workers secrets
- **Vercel**: Use Vercel environment variables
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Docker**: Use Docker secrets
- **Kubernetes**: Use Kubernetes secrets

## Troubleshooting

### Common Issues

1. **"Invalid JWT signature"**
   - Check that the secret matches between token generation and verification
   - Ensure the secret is base64 encoded correctly

2. **"Environment variable not found"**
   - Verify the `.env` file exists and is in the correct location
   - Check that environment variables are loaded in your application

3. **"Migration fails with placeholder values"**
   - Ensure you're using environment variable substitution
   - Check that all placeholders are replaced before running migrations

### Verification

To verify your JWT secret is working:

```javascript
// Test JWT generation and verification
const jwt = require('jsonwebtoken');
const secret = process.env.SURREALDB_JWT_SECRET;

// Generate a test token
const token = jwt.sign({ test: 'data' }, secret, { algorithm: 'HS256' });
console.log('Generated token:', token);

// Verify the token
try {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  console.log('Token verified successfully:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

## Production Deployment Examples

### Cloudflare Workers

```bash
# Set secrets for Cloudflare Workers
wrangler secret put SURREALDB_JWT_SECRET
wrangler secret put SURREALDB_WORKER_JWT_SECRET
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - SURREALDB_JWT_SECRET_FILE=/run/secrets/jwt_secret
      - SURREALDB_WORKER_JWT_SECRET_FILE=/run/secrets/worker_jwt_secret
    secrets:
      - jwt_secret
      - worker_jwt_secret

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  worker_jwt_secret:
    file: ./secrets/worker_jwt_secret.txt
```

### Kubernetes

```yaml
# k8s-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: jwt-secrets
type: Opaque
data:
  SURREALDB_JWT_SECRET: <base64-encoded-secret>
  SURREALDB_WORKER_JWT_SECRET: <base64-encoded-worker-secret>
```

## Summary

1. **Generate** strong, random JWT secrets using `openssl rand -base64 64`
2. **Store** secrets in environment variables, never in code
3. **Use** different secrets for user and worker authentication
4. **Substitute** environment variables in migration files before running
5. **Rotate** secrets regularly for security
6. **Deploy** using secure secret management for production

Following these practices ensures your JWT authentication system is secure and maintainable.