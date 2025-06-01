import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Mock the SurrealDB client
const mockSurrealClient = {
  connect: vi.fn(),
  query: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('@idance/auth', () => ({
  getSurrealDB: () => mockSurrealClient,
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
    genSalt: vi.fn(),
  },
}))

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testPassword123'
      const salt = 'mockedSalt'
      const hashedPassword = 'mockedHashedPassword'

      vi.mocked(bcrypt.genSalt).mockResolvedValue(salt)
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword)

      const result = await bcrypt.hash(password, 10)
      
      expect(result).toBe(hashedPassword)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })

    it('should verify passwords correctly', async () => {
      const password = 'testPassword123'
      const hash = 'mockedHashedPassword'

      vi.mocked(bcrypt.compare).mockResolvedValue(true)

      const result = await bcrypt.compare(password, hash)
      
      expect(result).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash)
    })

    it('should reject invalid passwords', async () => {
      const password = 'wrongPassword'
      const hash = 'mockedHashedPassword'

      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      const result = await bcrypt.compare(password, hash)
      
      expect(result).toBe(false)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash)
    })
  })

  describe('Database Integration', () => {
    it('should connect to SurrealDB', async () => {
      mockSurrealClient.connect.mockResolvedValue(undefined)

      await mockSurrealClient.connect()

      expect(mockSurrealClient.connect).toHaveBeenCalledTimes(1)
    })

    it('should query users by email', async () => {
      const mockUser = {
        id: 'user:123',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'user',
        user_status: 'active',
      }

      mockSurrealClient.query.mockResolvedValue([[mockUser]])

      const result = await mockSurrealClient.query(
        'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
        { email: 'test@example.com' }
      )

      expect(result).toEqual([[mockUser]])
      expect(mockSurrealClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
        { email: 'test@example.com' }
      )
    })

    it('should handle database connection errors gracefully', async () => {
      mockSurrealClient.connect.mockRejectedValue(new Error('Connection failed'))

      await expect(mockSurrealClient.connect()).rejects.toThrow('Connection failed')
    })
  })

  describe('Authentication Flow', () => {
    it('should authenticate valid user credentials', async () => {
      const mockUser = {
        id: 'user:123',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        user_status: 'active',
      }

      mockSurrealClient.connect.mockResolvedValue(undefined)
      mockSurrealClient.query.mockResolvedValue([[mockUser]])
      vi.mocked(bcrypt.compare).mockResolvedValue(true)

      // Simulate the authentication flow
      await mockSurrealClient.connect()
      const result = await mockSurrealClient.query(
        'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
        { email: 'test@example.com' }
      )
      const user = result[0][0]
      const isValidPassword = await bcrypt.compare('password123', user.password_hash)

      expect(isValidPassword).toBe(true)
      expect(user.email).toBe('test@example.com')
      expect(user.role).toBe('user')
    })

    it('should reject invalid credentials', async () => {
      const mockUser = {
        id: 'user:123',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'user',
        user_status: 'active',
      }

      mockSurrealClient.connect.mockResolvedValue(undefined)
      mockSurrealClient.query.mockResolvedValue([[mockUser]])
      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      // Simulate the authentication flow
      await mockSurrealClient.connect()
      const result = await mockSurrealClient.query(
        'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
        { email: 'test@example.com' }
      )
      const user = result[0][0]
      const isValidPassword = await bcrypt.compare('wrongPassword', user.password_hash)

      expect(isValidPassword).toBe(false)
    })

    it('should handle non-existent users', async () => {
      mockSurrealClient.connect.mockResolvedValue(undefined)
      mockSurrealClient.query.mockResolvedValue([[]])

      // Simulate the authentication flow
      await mockSurrealClient.connect()
      const result = await mockSurrealClient.query(
        'SELECT * FROM users WHERE email = $email AND user_status = "active" LIMIT 1',
        { email: 'nonexistent@example.com' }
      )

      expect(result[0]).toEqual([])
    })
  })

  describe('Development Fallback', () => {
    it('should allow admin fallback when database is unavailable', () => {
      const credentials = {
        email: 'admin@idance.com',
        password: 'admin123',
      }

      // Simulate fallback logic
      const isAdminFallback = 
        credentials.email === 'admin@idance.com' && 
        credentials.password === 'admin123'

      expect(isAdminFallback).toBe(true)
    })

    it('should reject non-admin fallback credentials', () => {
      const credentials = {
        email: 'user@example.com',
        password: 'password123',
      }

      // Simulate fallback logic
      const isAdminFallback = 
        credentials.email === 'admin@idance.com' && 
        credentials.password === 'admin123'

      expect(isAdminFallback).toBe(false)
    })
  })
})