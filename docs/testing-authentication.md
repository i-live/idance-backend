# Testing Authentication with SurrealDB Cloud

This guide walks you through testing the iDance backoffice authentication system with your SurrealDB Cloud database.

## 🚀 Quick Start

### 1. Set up your environment variables

First, update your `.env.local` file in the backoffice app with your actual SurrealDB Cloud credentials:

```bash
# Copy the template
cp apps/backoffice/.env.example apps/backoffice/.env.local

# Edit with your credentials
nano apps/backoffice/.env.local
```

Your `.env.local` should look like this:

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET="your-super-secret-key-for-jwt-tokens-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3002"

# SurrealDB Cloud Configuration
SURREALDB_URL="wss://your-instance.surrealdb.cloud"
SURREALDB_NAMESPACE="idance"
SURREALDB_DATABASE="dev"
SURREALDB_ROOT_USER="your-username"
SURREALDB_ROOT_PASS="your-password"
```

### 2. Install dependencies

```bash
# Install all dependencies
pnpm install
```

### 3. Create a test user in SurrealDB Cloud

```bash
# Create test user with your environment
pnpm setup:test-user:dev
```

This will:
- Connect to your SurrealDB Cloud instance
- Create a test user with email `admin@idance.com` and password `admin123`
- Hash the password securely with bcrypt
- Set the user status to `active` and role to `admin`

### 4. Start the development server

```bash
# Start the backoffice app
pnpm dev
```

### 5. Test authentication

1. Open your browser to http://localhost:3002
2. Click "Sign In"
3. Enter the test credentials:
   - **Email**: `admin@idance.com`
   - **Password**: `admin123`
4. You should be successfully authenticated and see the dashboard

## 🔧 Environment-Specific Setup

### Development Environment
```bash
pnpm setup:test-user:dev
```
Uses `apps/backoffice/.env.local`

### Staging Environment
```bash
pnpm setup:test-user:staging
```
Uses `.env.staging` (create this file with staging credentials)

### Production Environment
```bash
pnpm setup:test-user:prod
```
Uses `.env.production` (create this file with production credentials)

### CI/CD Environment
```bash
pnpm ci:setup-test-user
```
Uses `.env` (for CI/CD pipelines)

## 🧪 Testing Scenarios

### 1. Valid Login Test
- **Email**: `admin@idance.com`
- **Password**: `admin123`
- **Expected**: Successful login, redirect to dashboard

### 2. Invalid Password Test
- **Email**: `admin@idance.com`
- **Password**: `wrongpassword`
- **Expected**: Login failure, error message

### 3. Non-existent User Test
- **Email**: `nonexistent@example.com`
- **Password**: `anypassword`
- **Expected**: Login failure, error message

### 4. Development Fallback Test
If SurrealDB is unavailable, the system falls back to hardcoded credentials:
- **Email**: `admin@idance.com`
- **Password**: `admin123`
- **Expected**: Successful login with development user

### 5. Session Persistence Test
1. Login successfully
2. Refresh the page
3. **Expected**: User remains logged in

### 6. Logout Test
1. Login successfully
2. Click "Sign Out"
3. **Expected**: User is logged out, redirected to login page

## 🔍 Debugging

### Check SurrealDB Connection
```bash
# Test connection manually
node -e "
import { Surreal } from 'surrealdb';
const db = new Surreal();
await db.connect(process.env.SURREALDB_URL);
console.log('✅ Connected to SurrealDB');
await db.close();
"
```

### View User in Database
```bash
# Query the user directly
node -e "
import { Surreal } from 'surrealdb';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/backoffice/.env.local' });

const db = new Surreal();
await db.connect(process.env.SURREALDB_URL);
await db.signin({
  username: process.env.SURREALDB_ROOT_USER,
  password: process.env.SURREALDB_ROOT_PASS,
});
await db.use({
  namespace: process.env.SURREALDB_NAMESPACE,
  database: process.env.SURREALDB_DATABASE,
});

const users = await db.query('SELECT * FROM users WHERE email = \$email', {
  email: 'admin@idance.com'
});
console.log('User:', JSON.stringify(users[0], null, 2));
await db.close();
"
```

### Enable Debug Logging
```bash
# Start with NextAuth debug logging
DEBUG=next-auth* pnpm dev
```

### Common Issues

#### 1. "Connection failed"
- **Cause**: Invalid SurrealDB URL or network issues
- **Solution**: 
  - Verify `SURREALDB_URL` starts with `wss://`
  - Check your SurrealDB Cloud instance is running
  - Test network connectivity

#### 2. "Authentication failed"
- **Cause**: Invalid root credentials
- **Solution**:
  - Verify `SURREALDB_ROOT_USER` and `SURREALDB_ROOT_PASS`
  - Check user has admin privileges on the database

#### 3. "User not found"
- **Cause**: Test user doesn't exist in database
- **Solution**: Run `pnpm setup:test-user:dev` again

#### 4. "Invalid password"
- **Cause**: Password doesn't match hash in database
- **Solution**: 
  - Verify you're using `admin123` as password
  - Re-run the setup script to reset the password

#### 5. "NextAuth configuration error"
- **Cause**: Missing or invalid `NEXTAUTH_SECRET`
- **Solution**: Generate a new secret:
  ```bash
  openssl rand -base64 32
  ```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Authentication
on: [push, pull_request]

jobs:
  test-auth:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Setup test user
        env:
          SURREALDB_URL: ${{ secrets.SURREALDB_URL }}
          SURREALDB_NAMESPACE: ${{ secrets.SURREALDB_NAMESPACE }}
          SURREALDB_DATABASE: ${{ secrets.SURREALDB_DATABASE }}
          SURREALDB_ROOT_USER: ${{ secrets.SURREALDB_ROOT_USER }}
          SURREALDB_ROOT_PASS: ${{ secrets.SURREALDB_ROOT_PASS }}
        run: pnpm ci:setup-test-user
      
      - name: Run tests
        run: pnpm test
```

### Environment Variables for CI/CD
Set these secrets in your CI/CD platform:
- `SURREALDB_URL`
- `SURREALDB_NAMESPACE`
- `SURREALDB_DATABASE`
- `SURREALDB_ROOT_USER`
- `SURREALDB_ROOT_PASS`

## 📊 Testing Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Test user created in SurrealDB Cloud
- [ ] Development server starts without errors
- [ ] Can access http://localhost:3002
- [ ] Login page loads correctly
- [ ] Valid credentials work
- [ ] Invalid credentials are rejected
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Development fallback works when database is unavailable

## 🎯 Next Steps

Once authentication is working:

1. **Add OAuth providers** (Google, Facebook, Apple)
2. **Implement role-based access control**
3. **Add user registration flow**
4. **Set up automated testing**
5. **Deploy to Cloudflare Pages**

## 📚 Related Documentation

- [Authentication System Overview](./authentication.md)
- [Database Schema](./database.md)
- [Deployment Guide](./setup-guide.md)
- [Architecture Overview](./architecture.md)