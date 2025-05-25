# iDance Authentication System

This document outlines the authentication system for the iDance application using SurrealDB v2.0's modern RECORD-based access methods.

## 🔐 Overview

The authentication system supports:
- **Email/Password authentication** - Traditional signup/signin
- **OAuth authentication** - Google, Facebook, Apple integration
- **Unified access method** - Single endpoint for all authentication flows
- **JWT tokens** - Stateless authentication with configurable duration
- **Worker access** - Separate authentication for Cloudflare Workers

## 🏗️ Architecture

### **Single Access Method Design**
Unlike traditional systems with separate OAuth and password flows, iDance uses **unified access methods** that intelligently handle different authentication types based on the provided parameters.

### **Access Methods**
1. **`username_password`** - Email/password authentication for users
2. **`oauth`** - OAuth authentication (Google, Facebook, Apple) for users  
3. **`backend_worker`** - JWT-based access for Cloudflare Workers

## 📋 Authentication Flows

### **Email/Password Signup**
```javascript
// Client-side signup
const result = await db.signup({
    access: 'username_password',
    email: 'user@example.com',
    password: 'securepassword',
    username: 'username',
    first_name: 'John',
    last_name: 'Doe'
});
```

### **Email/Password Signin**
```javascript
// Client-side signin
const result = await db.signin({
    access: 'username_password',
    email: 'user@example.com',
    password: 'securepassword'
});
```

### **OAuth Signup**
```javascript
// OAuth signup (Google, Facebook, Apple)
const result = await db.signup({
    access: 'oauth',
    provider: 'google',
    provider_id: 'google_user_id',
    email: 'user@gmail.com',
    name: 'John Doe',
    picture: 'https://avatar.url',
    first_name: 'John',
    last_name: 'Doe',
    username: 'john.doe'
});
```

### **OAuth Signin**
```javascript
// OAuth signin
const result = await db.signin({
    access: 'oauth',
    provider: 'google',
    provider_id: 'google_user_id'
});
```

## 🔧 Implementation Details

### **Unified SIGNUP Logic**
The system automatically detects authentication type:
- **OAuth flow**: When `provider` and `provider_id` are provided
- **Email/Password flow**: When `email` and `password` are provided

### **Enhanced AUTHENTICATE Block**
- **User status validation**: Ensures user account is active
- **Last activity tracking**: Updates `last_active_at` on each authentication
- **NextAuth.js integration**: Supports JWT tokens with email claims
- **Error handling**: Clear error messages for different failure scenarios

### **Security Features**
- **Argon2 password hashing**: Industry-standard password security
- **JWT token validation**: Stateless authentication
- **User status checks**: Prevents access for suspended/deleted accounts
- **OAuth account linking**: Prevents duplicate OAuth accounts

## 🛠️ Utility Functions

### **User Access Validation**
```sql
-- Validate user access and status
SELECT fn::validate_user_access($auth.id);
```

### **OAuth Provider Management**
```sql
-- Link OAuth provider to existing user
SELECT fn::link_oauth_provider($user_id, 'google', $provider_id, $email, $name, $picture);

-- Unlink OAuth provider
SELECT fn::unlink_oauth_provider($user_id, 'google');
```

## 🔑 Environment Variables

### **Required Variables**
```bash
# JWT secret for user authentication
SURREALDB_JWT_SECRET=your-256-bit-secret-key

# JWT secret for worker authentication  
SURREALDB_WORKER_JWT_SECRET=your-worker-secret-key
```

### **Generating Secrets**
```bash
# Generate secure JWT secrets
openssl rand -base64 32
```

## 🔗 NextAuth.js Integration

### **Primary Authentication Method**
The authentication system is specifically designed to work seamlessly with NextAuth.js as the primary authentication method. The `user` access method includes special handling for NextAuth.js JWT tokens.

### **NextAuth.js Configuration**
```javascript
// pages/api/auth/[...nextauth].js or app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { Surreal } from 'surrealdb.js'

const db = new Surreal()

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    // Add more providers as needed
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await db.connect(process.env.SURREALDB_URL)
        
        // Use the unified 'user' access method for OAuth signup/signin
        const result = await db.signup({
          access: 'oauth',
          provider: account.provider,
          provider_id: account.providerAccountId,
          email: user.email,
          name: user.name,
          picture: user.image,
          first_name: profile.given_name || user.name?.split(' ')[0],
          last_name: profile.family_name || user.name?.split(' ').slice(1).join(' '),
          username: user.email
        })
        
        return true
      } catch (error) {
        console.error('NextAuth SignIn Error:', error)
        return false
      }
    },
    
    async jwt({ token, user, account }) {
      // Add SurrealDB user info to JWT token
      if (account && user) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },
    
    async session({ session, token }) {
      // The AUTHENTICATE block in SurrealDB will handle JWT tokens with email claims
      session.user.provider = token.provider
      return session
    }
  },
  
  // Use JWT strategy for stateless authentication
  session: {
    strategy: 'jwt',
  },
  
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  }
})
```

### **SurrealDB Integration with NextAuth.js**
The authentication system automatically handles NextAuth.js tokens through the AUTHENTICATE block:

```sql
-- This is already built into the user access method
AUTHENTICATE {
    -- ... other authentication logic ...
    
    ELSE IF $token.email {
        -- For JWT tokens with email claims (NextAuth.js integration)
        LET $user = SELECT * FROM user WHERE email = $token.email AND user_status = 'active';
        IF $user {
            UPDATE user SET last_active_at = time::now() WHERE email = $token.email;
            RETURN $user[0];
        } ELSE {
            THROW "User not found or inactive";
        };
    };
}
```

### **Using SurrealDB with NextAuth.js Session**
```javascript
// In your Next.js pages/components
import { useSession } from 'next-auth/react'
import { Surreal } from 'surrealdb.js'

export default function Dashboard() {
  const { data: session } = useSession()
  const [db] = useState(() => new Surreal())
  
  useEffect(() => {
    if (session?.user?.email) {
      // Connect to SurrealDB and authenticate with NextAuth session
      connectToSurrealDB()
    }
  }, [session])
  
  const connectToSurrealDB = async () => {
    try {
      await db.connect(process.env.NEXT_PUBLIC_SURREALDB_URL)
      
      // The SurrealDB AUTHENTICATE block will validate the NextAuth JWT
      // and find the user by email automatically
      await db.authenticate(session.accessToken) // If you have access token
      
      // Or use the email from session to query user data
      const user = await db.query(`
        SELECT * FROM user WHERE email = $email AND user_status = 'active'
      `, { email: session.user.email })
      
    } catch (error) {
      console.error('SurrealDB connection error:', error)
    }
  }
  
  return (
    <div>
      {session ? (
        <p>Welcome, {session.user.name}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  )
}
```

### **Environment Variables for NextAuth.js**
```bash
# NextAuth.js configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OAuth Provider credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# SurrealDB configuration
SURREALDB_URL=wss://your-surrealdb-endpoint
NEXT_PUBLIC_SURREALDB_URL=wss://your-surrealdb-endpoint
SURREALDB_JWT_SECRET=your-surrealdb-jwt-secret
```

## � Client Integration

### **React Native / Next.js**
```javascript
import { Surreal } from 'surrealdb.js';

const db = new Surreal();
await db.connect('wss://your-surrealdb-endpoint');

// Use the unified 'user' access method for all authentication
const token = await db.signin({
    access: 'oauth',
    // ... authentication parameters
});
```

### **Cloudflare Workers**
```javascript
// Worker authentication
const workerToken = jwt.sign(
    { worker: true },
    env.SURREALDB_WORKER_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
);

await db.authenticate(workerToken);
```

## 🔄 Migration from Legacy System

### **What Changed**
- **Consolidated access methods**: Removed redundant `oauth` access method
- **Removed legacy functions**: Cleaned up `fn::signup`, `fn::signin` functions
- **Unified flow**: Single access method handles all authentication types
- **Enhanced error handling**: Better error messages and status validation

### **Breaking Changes**
- **Separate access methods**: Use `username_password` for email/password and `oauth` for OAuth authentication
- **Legacy functions removed**: Use access methods instead of custom functions

### **Migration Steps**
1. Update client code to use `user` access method for all authentication
2. Remove references to `oauth` access method
3. Update OAuth flows to pass provider parameters to `user` access method
4. Test all authentication flows thoroughly

## 🧪 Testing Authentication

### **Test Email/Password Flow**
```bash
# Test signup
curl -X POST "https://your-surrealdb-endpoint/sql" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SIGNUP { access: \"user\", email: \"test@example.com\", password: \"password123\", username: \"testuser\", first_name: \"Test\", last_name: \"User\" }"
  }'
```

### **Test OAuth Flow**
```bash
# Test OAuth signup
curl -X POST "https://your-surrealdb-endpoint/sql" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SIGNUP { access: \"user\", provider: \"google\", provider_id: \"google123\", email: \"test@gmail.com\", name: \"Test User\", first_name: \"Test\", last_name: \"User\" }"
  }'
```

## 🔍 Troubleshooting

### **Common Issues**

#### **"User account is pending_waitlist_approval"**
- **Cause**: New users start with `pending_waitlist_approval` status
- **Solution**: Update user status to `active` after approval

#### **"OAuth account already linked to another user"**
- **Cause**: Trying to link OAuth account that's already associated
- **Solution**: Use existing account or unlink from previous user

#### **"User not found or inactive"**
- **Cause**: User account doesn't exist or is not active
- **Solution**: Check user status and ensure account exists

### **Debug Authentication**
```sql
-- Check user status
SELECT id, email, user_status, oauth_providers FROM user WHERE email = 'user@example.com';

-- Validate JWT token
SELECT fn::validate_user_access($auth.id);
```

## 📚 Related Documentation

- **[Database Schema](./database.md)** - Complete database structure
- **[JWT Secrets Guide](./jwt-secrets-guide.md)** - Security key management
- **[Migration Structure](./migration-structure.md)** - Database migration system
- **[Architecture Overview](./architecture.md)** - System design

## 🎯 Best Practices

### **Security**
- **Use strong JWT secrets**: Generate cryptographically secure keys
- **Validate user status**: Always check account status before granting access
- **Monitor failed attempts**: Track and limit authentication failures
- **Regular key rotation**: Periodically update JWT secrets

### **Development**
- **Test all flows**: Verify both email/password and OAuth authentication
- **Handle errors gracefully**: Provide clear error messages to users
- **Use environment variables**: Never hardcode secrets in code
- **Monitor authentication**: Track signup/signin patterns and failures

### **Production**
- **Use HTTPS**: Ensure all authentication happens over secure connections
- **Set appropriate durations**: Balance security and user experience
- **Monitor performance**: Track authentication response times
- **Backup strategies**: Ensure user data and authentication state are backed up