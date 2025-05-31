// Export main auth functionality
export { createNextAuth, createAuthConfig, createDefaultAuthConfig } from './nextauth/config'
export { SurrealDBClient, getSurrealDB, createSurrealDBConfig } from './surrealdb/client'
export { SessionProvider } from './components/session-provider'
export type {
  SurrealDBUser,
  UsernamePasswordCredentials,
  OAuthCredentials,
  SignInCredentials,
  SignUpCredentials
} from './types'