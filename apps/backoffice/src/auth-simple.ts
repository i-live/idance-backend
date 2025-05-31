import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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

        // For now, let's use a simple hardcoded check for testing
        // Later we'll integrate with SurrealDB
        if (credentials.email === 'admin@idance.com' && credentials.password === 'admin123') {
          return {
            id: '1',
            email: 'admin@idance.com',
            name: 'Admin User',
            role: 'admin',
            user_status: 'active',
          }
        }

        return null
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