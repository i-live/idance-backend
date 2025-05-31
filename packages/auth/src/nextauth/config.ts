import NextAuth, { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSurrealDB } from '../surrealdb/client'

export interface AuthConfig {
  providers: {
    google?: {
      clientId: string
      clientSecret: string
    }
    credentials?: boolean
  }
  pages?: {
    signIn?: string
    signUp?: string
    error?: string
  }
  callbacks?: {
    authorized?: (params: { auth: any; request: any }) => boolean
  }
}

export function createAuthConfig(config: AuthConfig): NextAuthConfig {
  const providers = []

  // Google OAuth Provider
  if (config.providers.google) {
    providers.push(
      GoogleProvider({
        clientId: config.providers.google.clientId,
        clientSecret: config.providers.google.clientSecret,
      })
    )
  }

  // Credentials Provider for email/password
  if (config.providers.credentials) {
    providers.push(
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          try {
            const db = getSurrealDB()
            const result = await db.signIn({
              access: 'username_password',
              email: credentials.email as string,
              password: credentials.password as string,
            })

            if (result && result.id) {
              return {
                id: result.id,
                email: result.email,
                name: `${result.first_name} ${result.last_name}`.trim(),
                role: result.role,
                user_status: result.user_status,
              }
            }
            return null
          } catch (error) {
            console.error('Authentication error:', error)
            return null
          }
        },
      })
    )
  }

  return {
    providers,
    pages: config.pages,
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === 'google') {
          try {
            const db = getSurrealDB()
            
            // Try to sign up/sign in with OAuth
            const result = await db.signUp({
              access: 'oauth',
              provider: 'google',
              provider_id: account.providerAccountId,
              email: user.email!,
              name: user.name || '',
              picture: user.image || '',
              first_name: profile?.given_name || user.name?.split(' ')[0] || '',
              last_name: profile?.family_name || user.name?.split(' ').slice(1).join(' ') || '',
              username: user.email!,
            })

            if (result && result.id) {
              // Update user object with SurrealDB data
              user.id = result.id
              user.role = result.role
              user.user_status = result.user_status
              return true
            }
            return false
          } catch (error) {
            console.error('OAuth sign-in error:', error)
            return false
          }
        }
        return true
      },

      async jwt({ token, user, account }) {
        // Add user info to JWT token
        if (user) {
          token.role = user.role
          token.user_status = user.user_status
          token.user_id = user.id || ''
        }
        return token
      },

      async session({ session, token }) {
        // Add user info to session
        if (token) {
          session.user.role = token.role as string
          session.user.user_status = token.user_status as string
          session.user.id = token.user_id as string
        }
        return session
      },

      authorized: config.callbacks?.authorized || (({ auth }) => !!auth),
    },
    session: {
      strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
}

// Default configuration factory
export function createDefaultAuthConfig(): NextAuthConfig {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET

  const config: AuthConfig = {
    providers: {
      credentials: true,
    },
  }

  // Add Google if credentials are available
  if (googleClientId && googleClientSecret) {
    config.providers.google = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }
  }

  return createAuthConfig(config)
}

// Export configured NextAuth instance
export function createNextAuth(config?: AuthConfig) {
  const authConfig = config ? createAuthConfig(config) : createDefaultAuthConfig()
  return NextAuth(authConfig)
}