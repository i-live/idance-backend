# Authentication System

This document explains the authentication system implementation using SurrealDB with NextAuth.js integration and OAuth provider support.

## Overview

The authentication system supports dual authentication methods:
- Traditional email/password authentication
- OAuth-based authentication (Google, Facebook, Apple, etc.)

The system uses JWT tokens for session management and provides separate access controls for users and backend workers.

## SurrealDB Schema

### User Authentication Access

```sql
DEFINE ACCESS user ON DATABASE TYPE RECORD
    SIGNUP ( CREATE user SET
        email = $email,
        password = crypto::argon2::generate($password),
        oauth_providers = $oauth_providers,
        username = $username,
        first_name = $first_name,
        last_name = $last_name,
        user_status = 'pending_waitlist_approval',
        user_tier = 'basic',
        created_at = time::now(),
        updated_at = time::now()
    )
    SIGNIN ( SELECT * FROM user WHERE
        (email = $email AND password != NONE AND crypto::argon2::compare(password, $password)) OR
        (oauth_providers[?provider = $provider].id = $provider_id)
    )
    WITH JWT ALGORITHM HS256 DURATION 1h;
```

### Worker Authentication Access

```sql
DEFINE ACCESS worker ON DATABASE TYPE JWT
    WITH ISSUER KEY '<jwt-secret>'
    WITH ALGORITHM HS256
    DURATION 24h;
```

## Authentication Methods

### 1. Email/Password Authentication

**SIGNUP Process:**
- Creates new user record with hashed password using Argon2
- Sets default user status to `pending_waitlist_approval`
- Sets default user tier to `basic`
- Stores creation and update timestamps

**SIGNIN Process:**
- Verifies email exists and password is not null
- Uses Argon2 to compare provided password with stored hash
- Returns user record if authentication successful

### 2. OAuth Authentication

**SIGNUP Process:**
- Creates user record with OAuth provider information
- Stores provider data in `oauth_providers` array field
- No password field required for OAuth-only users

**SIGNIN Process:**
- Matches user by provider and provider-specific user ID
- Uses array query syntax: `oauth_providers[?provider = $provider].id = $provider_id`

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

This authentication system provides a robust, secure foundation for user management with support for both traditional and modern OAuth-based authentication methods.