import { createNextAuth } from '@idance/auth'

// Create NextAuth instance with default configuration
// This will use credentials provider and Google OAuth if configured
export const { handlers, signIn, signOut, auth } = createNextAuth({
  providers: {
    credentials: true,
    // Google OAuth will be automatically enabled if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  }
})