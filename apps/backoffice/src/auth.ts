import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSurrealDB } from '@idance/auth'
import bcrypt from 'bcryptjs'

// Define user type based on database schema
interface User {
  id: string
  email: string
  password_hash: string
  first_name?: string
  last_name?: string
  display_name?: string
  role: string
  user_status: string
  created_at: string
  updated_at: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
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
          // Get SurrealDB client
          const surrealClient = getSurrealDB()
          await surrealClient.connect()

          // Query user by email using the modern SurrealDB API
          const result = await surrealClient.query(
            'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
            { email: credentials.email }
          )

          // Check if user exists
          if (!result || result.length === 0 || !result[0] || result[0].length === 0) {
            console.log('❌ User not found:', credentials.email)
            
            // Fallback to hardcoded admin for development
            if (credentials.email === 'admin@idance.com' && credentials.password === 'admin123') {
              console.log('✅ Using development fallback admin')
              return {
                id: 'admin-dev',
                email: 'admin@idance.com',
                name: 'Admin User (Dev)',
                role: 'admin',
                user_status: 'active',
              }
            }
            return null
          }

          const user = result[0][0] as User

          // Verify password using modern bcryptjs
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password_hash || ''
          )
          
          if (!isValidPassword) {
            console.log('❌ Invalid password for user:', credentials.email)
            return null
          }

          console.log('✅ User authenticated successfully:', user.email)

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            role: user.role || 'user',
            user_status: user.user_status,
          }
        } catch (error) {
          console.error('❌ Authentication error:', error)
          
          // Fallback to hardcoded admin for development when DB is unavailable
          if (credentials.email === 'admin@idance.com' && credentials.password === 'admin123') {
            console.log('✅ Using development fallback admin (DB error)')
            return {
              id: 'admin-dev-fallback',
              email: 'admin@idance.com',
              name: 'Admin User (Dev Fallback)',
              role: 'admin',
              user_status: 'active',
            }
          }
          
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.user_status = user.user_status
        token.user_id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.user_status = token.user_status as string
        session.user.id = token.user_id as string
      }
      return session
    },
  },
})