import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      user_status: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    user_status: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    user_status: string
    user_id: string
  }
}

// SurrealDB User types
export interface SurrealDBUser {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  user_status: string
  oauth_providers?: Array<{
    provider: string
    id: string
    email: string
    name?: string
    picture?: string
  }>
  created_at: string
  updated_at: string
  last_active_at?: string
}

// Authentication credentials types
export interface UsernamePasswordCredentials {
  access: 'username_password'
  email: string
  password: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface OAuthCredentials {
  access: 'oauth'
  provider: string
  provider_id: string
  email: string
  name?: string
  picture?: string
  first_name?: string
  last_name?: string
  username?: string
}

export interface SignInCredentials {
  access: 'username_password' | 'oauth'
  email?: string
  password?: string
  provider?: string
  provider_id?: string
}

export type SignUpCredentials = UsernamePasswordCredentials | OAuthCredentials