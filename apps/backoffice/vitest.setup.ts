import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'

// For unit tests, we'll mock SurrealDB calls
// For integration tests, we can use real SurrealDB Cloud test database
const isIntegrationTest = process.env.TEST_MODE === 'integration'

if (!isIntegrationTest) {
  // Mock SurrealDB for unit tests
  process.env.SURREALDB_URL = 'mocked://test'
  process.env.SURREALDB_NAMESPACE = 'test'
  process.env.SURREALDB_DATABASE = 'test'
  process.env.SURREALDB_ROOT_USER = 'test'
  process.env.SURREALDB_ROOT_PASS = 'test'
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock NextAuth for unit tests
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  error: console.error, // Keep errors visible
  warn: console.warn,   // Keep warnings visible
}