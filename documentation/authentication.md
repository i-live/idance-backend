# Authentication System

This document explains the authentication system implementation using SurrealDB with NextAuth.js integration and OAuth provider support.

## Overview

The authentication system supports dual authentication methods:
- Traditional email/password authentication
- OAuth-based authentication (Google, Facebook, Apple, etc.)

The system uses JWT tokens for session management and provides separate access controls for users and backend workers.

## Database Scope

**Important**: The authentication access definitions are scoped to individual databases, not across all databases in the SurrealDB instance.

```sql
DEFINE ACCESS user ON DATABASE TYPE RECORD
DEFINE ACCESS worker ON DATABASE TYPE JWT
```

This means:
- Each database (`dev`, `prod`, `test`) has its own authentication configuration
- Users authenticated in the `dev` database cannot access `prod` database without re-authentication
- Access tokens are database-specific
- You must define the same access rules in each database environment

### Multi-Environment Setup

The schema defines three databases:
```sql
DEFINE DATABASE dev;    -- Development environment
DEFINE DATABASE prod;   -- Production environment
DEFINE DATABASE test;   -- Testing environment
```

Each database requires its own access definitions to be applied separately.

## Cross-Platform Compatibility

This authentication system is designed to work seamlessly across multiple platforms:

### Supported Platforms
- **Web Applications** (Next.js with NextAuth.js)
- **React Native Mobile Apps** (iOS and Android)
- **Backend Services** (Cloudflare Workers, Node.js, etc.)

### Unified Backend Approach
All platforms use the same backend API endpoints for authentication:
- **Single Source of Truth**: All authentication logic is centralized in your backend
- **Consistent JWT Tokens**: Same JWT tokens work across web and mobile
- **Shared User Database**: All platforms access the same SurrealDB user records
- **OAuth Flexibility**: OAuth providers work on both web and mobile through the backend

### Platform-Specific Integration
- **Web (NextAuth.js)**: NextAuth.js handles OAuth flows and calls your backend API
- **Mobile (React Native)**: Direct API calls to your backend, with libraries like `expo-auth-session` for OAuth
- **Backend Services**: Direct SurrealDB function calls with worker JWT tokens

## SurrealDB Schema

### User Authentication Access (JWT-based for NextAuth.js)

```sql
-- User Authentication Access (JWT-based for NextAuth.js compatibility)
DEFINE ACCESS user ON DATABASE TYPE JWT
    WITH ISSUER KEY 'your-jwt-secret-key'
    WITH ALGORITHM HS256
    WITH DURATION 1h;

-- User signup function (called by your backend)
DEFINE FUNCTION fn::signup($email: string, $password: string, $oauth_providers: array, $username: string, $first_name: string, $last_name: string) {
    CREATE user SET
        email = $email,
        password = IF $password != NONE THEN crypto::argon2::generate($password) ELSE NONE END,
        oauth_providers = $oauth_providers,
        username = $username,
        first_name = $first_name,
        last_name = $last_name,
        user_status = 'pending_waitlist_approval',
        user_tier = 'basic',
        created_at = time::now(),
        updated_at = time::now()
};

-- User signin function (called by your backend)
DEFINE FUNCTION fn::signin($email: string, $password: string, $provider: string, $provider_id: string) {
    SELECT * FROM user WHERE
        (email = $email AND password != NONE AND crypto::argon2::compare(password, $password)) OR
        (oauth_providers[?provider = $provider].id = $provider_id)
};
```

### Worker Authentication Access

```sql
DEFINE ACCESS worker ON DATABASE TYPE JWT
    WITH ISSUER KEY '<jwt-secret>'
    WITH ALGORITHM HS256
    WITH DURATION 24h;
```

## Authentication Methods

### JWT-Based Authentication for NextAuth.js

This approach uses JWT tokens that are compatible with NextAuth.js while leveraging SurrealDB's authentication system.

**Key Benefits:**
- **NextAuth.js Compatibility**: JWT tokens work seamlessly with NextAuth.js
- **Centralized Authentication**: Your backend handles all authentication logic
- **Flexible Integration**: Supports both traditional and OAuth authentication flows

### 1. Email/Password Authentication

**SIGNUP Process:**
- Your backend calls `fn::signup()` function with user data
- Function creates new user record with hashed password using Argon2
- Sets default user status to `pending_waitlist_approval`
- Sets default user tier to `basic`
- Your backend generates JWT token for the user

**SIGNIN Process:**
- Your backend calls `fn::signin()` function with credentials
- Function verifies email exists and password is not null
- Uses Argon2 to compare provided password with stored hash
- Your backend generates JWT token if authentication successful

### 2. OAuth Authentication

**SIGNUP Process:**
- NextAuth.js handles OAuth flow and returns user data
- Your backend calls `fn::signup()` with OAuth provider information
- Function creates user record with provider data in `oauth_providers` array
- No password field required for OAuth-only users
- Your backend generates JWT token for the user

**SIGNIN Process:**
- NextAuth.js handles OAuth flow and returns user data
- Your backend calls `fn::signin()` with provider credentials
- Function matches user by provider and provider-specific user ID
- Your backend generates JWT token if user found

## OAuth Providers Data Structure

The `oauth_providers` field stores an array of provider objects:

```json
[
  {
    "provider": "google",
    "id": "google_user_id_123",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  {
    "provider": "facebook",
    "id": "facebook_user_id_456",
    "email": "user@gmail.com",
    "name": "John Doe"
  }
]
```

## NextAuth.js Integration

### Configuration

NextAuth.js acts as the OAuth middleware, handling provider redirects and user data retrieval.

```javascript
// Example NextAuth configuration
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import AppleProvider from "next-auth/providers/apple"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom logic to handle SurrealDB authentication
      return true
    },
    async jwt({ token, user, account }) {
      // Handle JWT token creation
      return token
    },
    async session({ session, token }) {
      // Handle session data
      return session
    }
  }
}
```

### Authentication Flow

#### New OAuth User Registration

1. User clicks "Sign in with [Provider]"
2. NextAuth redirects to OAuth provider
3. Provider returns user data to NextAuth callback
4. NextAuth calls backend API with provider data
5. Backend calls SurrealDB SIGNUP with:
   ```javascript
   {
     email: providerData.email,
     password: null, // No password for OAuth users
     oauth_providers: [{
       provider: 'google',
       id: providerData.id,
       email: providerData.email,
       name: providerData.name,
       picture: providerData.picture
     }],
     username: providerData.email,
     first_name: providerData.given_name,
     last_name: providerData.family_name
   }
   ```

#### Existing OAuth User Login

1. User attempts OAuth login
2. NextAuth gets provider data
3. Backend calls SurrealDB SIGNIN with:
   ```javascript
   {
     provider: 'google',
     provider_id: 'google_user_id_123'
   }
   ```
4. SurrealDB matches user using array query
5. Returns user record and generates JWT

#### Traditional Email/Password Flow

1. User submits email/password form
2. Backend calls SurrealDB SIGNIN with:
   ```javascript
   {
     email: 'user@example.com',
     password: 'user_password'
   }
   ```
3. SurrealDB verifies credentials using Argon2
4. Returns user record and generates JWT

## JWT Token Management

### User Tokens
- **Algorithm**: HS256
- **Duration**: 1 hour
- **Type**: Record-based (tied to user records)
- **Usage**: Client authentication

### Worker Tokens
- **Algorithm**: HS256
- **Duration**: 24 hours
- **Type**: JWT-based (not tied to records)
- **Usage**: Backend service authentication

## User Status and Tiers

### User Status Values
- `pending_waitlist_approval`: New users awaiting approval
- `active`: Approved and active users
- `suspended`: Temporarily suspended users
- `banned`: Permanently banned users

### User Tier Values
- `basic`: Default tier for new users
- `premium`: Paid tier with additional features
- `admin`: Administrative access

## Security Features

### Password Security
- **Hashing Algorithm**: Argon2 (industry standard)
- **Salt**: Automatically generated per password
- **Verification**: Constant-time comparison

### JWT Security
- **Signing Algorithm**: HS256
- **Secret Key**: Environment-based configuration
- **Expiration**: Short-lived tokens (1h for users)
- **Refresh**: Handled by NextAuth.js

### OAuth Security
- **Provider Verification**: OAuth providers handle user verification
- **State Parameter**: CSRF protection via NextAuth.js
- **Secure Callbacks**: HTTPS-only callback URLs

## Database Queries

### Create New User (Email/Password)
```sql
CREATE user SET
    email = 'user@example.com',
    password = crypto::argon2::generate('user_password'),
    username = 'username',
    first_name = 'John',
    last_name = 'Doe',
    user_status = 'pending_waitlist_approval',
    user_tier = 'basic',
    created_at = time::now(),
    updated_at = time::now();
```

### Create New User (OAuth)
```sql
CREATE user SET
    email = 'user@gmail.com',
    oauth_providers = [{
        provider: 'google',
        id: 'google_user_id_123',
        email: 'user@gmail.com',
        name: 'John Doe'
    }],
    username = 'user@gmail.com',
    first_name = 'John',
    last_name = 'Doe',
    user_status = 'pending_waitlist_approval',
    user_tier = 'basic',
    created_at = time::now(),
    updated_at = time::now();
```

### Authenticate User (Email/Password)
```sql
SELECT * FROM user WHERE
    email = 'user@example.com' AND
    password != NONE AND
    crypto::argon2::compare(password, 'user_password');
```

### Authenticate User (OAuth)
```sql
SELECT * FROM user WHERE
    oauth_providers[?provider = 'google'].id = 'google_user_id_123';
```

## Error Handling

### Common Authentication Errors
- **Invalid Credentials**: Wrong email/password combination
- **User Not Found**: Email not registered
- **OAuth Provider Error**: Provider authentication failed
- **Token Expired**: JWT token needs refresh
- **Account Suspended**: User account is not active

### Error Response Format
```json
{
  "error": "authentication_failed",
  "message": "Invalid email or password",
  "code": 401
}
```

## Best Practices

### Implementation Guidelines
1. Always use HTTPS for OAuth callbacks
2. Validate JWT tokens on every protected request
3. Implement proper error handling for all auth flows
4. Use environment variables for sensitive configuration
5. Implement rate limiting for authentication endpoints

### Security Considerations
1. Never store plain text passwords
2. Use secure, random JWT signing keys
3. Implement proper session management
4. Validate OAuth state parameters
5. Monitor for suspicious authentication patterns

## Integration Examples

### Frontend Authentication Check
```javascript
// Check if user is authenticated
const session = await getServerSession(authOptions)
if (!session) {
  redirect('/login')
}
```

### Backend API Protection
```javascript
// Protect API routes
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Proceed with authenticated request
}
```

### Database Connection with Worker Auth
```javascript
// Connect to SurrealDB with worker credentials
const db = new Surreal()
await db.connect('ws://localhost:8000/rpc')
await db.use('namespace', 'database')
await db.authenticate(workerJWT)
```

## Cross-Database Authentication Considerations

### Database Isolation
- **No Cross-Database Access**: Authentication tokens are scoped to the specific database where they were issued
- **Environment Separation**: Users in `dev` database are completely separate from `prod` database users
- **Migration Requirements**: User data must be explicitly migrated between databases if needed

### Production Deployment Strategy
1. **Development**: Use `dev` database for local development and testing
2. **Staging**: Use `test` database for integration testing
3. **Production**: Use `prod` database for live application

### Connection Examples

```javascript
// Development environment
await db.connect('ws://localhost:8000/rpc')
await db.use('idance', 'dev')
await db.signin({ /* user credentials */ })

// Production environment
await db.connect('wss://your-surrealdb-instance.com/rpc')
await db.use('idance', 'prod')
await db.signin({ /* user credentials */ })
```

### Best Practices for Multi-Database Setup
1. **Consistent Schema**: Apply the same access definitions to all databases
2. **Environment Variables**: Use different connection strings per environment
3. **Data Synchronization**: Implement proper data migration strategies if needed
4. **Testing**: Test authentication in each database environment separately

## React Native Integration

### Authentication Flow for Mobile Apps

React Native apps can use the same backend API endpoints as the web application:

```javascript
// React Native authentication service
class AuthService {
  constructor() {
    this.baseURL = 'https://your-backend-api.com'
  }

  // Email/Password Sign In
  async signInWithCredentials(email, password) {
    const response = await fetch(`${this.baseURL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (response.ok) {
      const { token, user } = await response.json()
      await this.storeToken(token)
      return { token, user }
    }
    throw new Error('Authentication failed')
  }

  // OAuth Sign In (using expo-auth-session or similar)
  async signInWithOAuth(provider) {
    // Use expo-auth-session or react-native-app-auth
    const oauthResult = await this.performOAuthFlow(provider)
    
    const response = await fetch(`${this.baseURL}/auth/oauth-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider,
        provider_id: oauthResult.user.id,
        email: oauthResult.user.email,
        name: oauthResult.user.name,
        picture: oauthResult.user.picture
      })
    })
    
    if (response.ok) {
      const { token, user } = await response.json()
      await this.storeToken(token)
      return { token, user }
    }
    throw new Error('OAuth authentication failed')
  }

  // Store JWT token securely
  async storeToken(token) {
    // Use @react-native-async-storage/async-storage or expo-secure-store
    await SecureStore.setItemAsync('auth_token', token)
  }

  // Get stored token
  async getToken() {
    return await SecureStore.getItemAsync('auth_token')
  }

  // Make authenticated API calls
  async authenticatedFetch(url, options = {}) {
    const token = await this.getToken()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    })
  }
}
```

### OAuth Libraries for React Native

**Recommended Libraries:**
- **Expo**: `expo-auth-session` for OAuth flows
- **React Native**: `react-native-app-auth` for OAuth flows
- **Storage**: `expo-secure-store` or `@react-native-keychain/react-native-keychain` for secure token storage

### Backend API Endpoints

Your backend should expose these endpoints for both web and mobile:

```javascript
// Backend API endpoints (same for web and mobile)
POST /auth/signin              // Email/password authentication
POST /auth/signup              // User registration
POST /auth/oauth-signin        // OAuth authentication
POST /auth/refresh             // Token refresh
POST /auth/logout              // User logout
GET  /auth/me                  // Get current user info
```

This authentication system provides a robust, secure foundation for user management with support for both traditional and modern OAuth-based authentication methods, with proper database isolation for different environments and full cross-platform compatibility.