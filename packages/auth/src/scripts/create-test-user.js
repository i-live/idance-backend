#!/usr/bin/env node

/**
 * Script to create a test user in SurrealDB Cloud for authentication testing
 * 
 * Usage:
 *   node packages/auth/src/scripts/create-test-user.js [env-file-path]
 * 
 * Examples:
 *   node packages/auth/src/scripts/create-test-user.js apps/backoffice/.env.local
 *   node packages/auth/src/scripts/create-test-user.js .env
 * 
 * This will create a test user with:
 *   - Email: admin@idance.com
 *   - Password: admin123 (hashed with bcrypt)
 *   - Role: admin
 *   - Status: active
 */

import { Surreal } from 'surrealdb'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get env file path from command line argument or default
const envFilePath = process.argv[2] || join(__dirname, '../../../../.env.local')

// Load environment variables
if (existsSync(envFilePath)) {
  console.log(`📄 Loading environment from: ${envFilePath}`)
  dotenv.config({ path: envFilePath })
} else {
  console.error(`❌ Environment file not found: ${envFilePath}`)
  console.error('\n💡 Usage:')
  console.error('   node packages/auth/src/scripts/create-test-user.js [env-file-path]')
  console.error('\n📝 Examples:')
  console.error('   node packages/auth/src/scripts/create-test-user.js apps/backoffice/.env.local')
  console.error('   node packages/auth/src/scripts/create-test-user.js .env')
  process.exit(1)
}

async function createTestUser() {
  const db = new Surreal()
  
  try {
    console.log('🔌 Connecting to SurrealDB Cloud...')
    
    // Validate required environment variables
    const requiredVars = [
      'SURREALDB_URL',
      'SURREALDB_NAMESPACE', 
      'SURREALDB_DATABASE',
      'SURREALDB_ROOT_USER',
      'SURREALDB_ROOT_PASS'
    ]
    
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:')
      missingVars.forEach(varName => console.error(`   - ${varName}`))
      console.error('\n💡 Please check your environment file contains all required variables.')
      process.exit(1)
    }
    
    // Connect to SurrealDB Cloud
    await db.connect(process.env.SURREALDB_URL)
    
    // Sign in as root user
    await db.signin({
      username: process.env.SURREALDB_ROOT_USER,
      password: process.env.SURREALDB_ROOT_PASS,
    })
    
    // Use the specified namespace and database
    await db.use({
      namespace: process.env.SURREALDB_NAMESPACE,
      database: process.env.SURREALDB_DATABASE,
    })
    
    console.log('✅ Connected to SurrealDB Cloud')
    console.log(`📍 Using: ${process.env.SURREALDB_NAMESPACE}/${process.env.SURREALDB_DATABASE}`)
    
    // Hash the password
    console.log('🔐 Hashing password...')
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash('admin123', saltRounds)
    
    // Create test user
    console.log('👤 Creating test user...')
    
    const testUser = {
      email: 'admin@idance.live',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      display_name: 'Admin User',
      username: 'admin',
      role: 'admin',
      user_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: null,
      oauth_providers: [],
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $email LIMIT 1',
      { email: testUser.email }
    )
    
    if (existingUser[0]?.length > 0) {
      console.log('⚠️  User already exists, updating...')
      
      // Update existing user
      const result = await db.query(
        `UPDATE users SET 
          password_hash = $password_hash,
          first_name = $first_name,
          last_name = $last_name,
          display_name = $display_name,
          username = $username,
          role = $role,
          user_status = $user_status,
          updated_at = $updated_at
         WHERE email = $email`,
        testUser
      )
      
      console.log('✅ Test user updated successfully!')
      
    } else {
      console.log('➕ Creating new user...')
      
      // Create new user
      const result = await db.query(
        'CREATE users CONTENT $user',
        { user: testUser }
      )
      
      console.log('✅ Test user created successfully!')
    }
    
    // Display credentials
    console.log('\n🎯 Test Credentials:')
    console.log('📧 Email:', testUser.email)
    console.log('🔑 Password: admin123')
    console.log('👑 Role:', testUser.role)
    console.log('📊 Status:', testUser.user_status)
    
    // Verify the user was created/updated
    console.log('\n🔍 Verifying user in database...')
    const verification = await db.query(
      'SELECT id, email, first_name, last_name, role, user_status, created_at FROM users WHERE email = $email',
      { email: testUser.email }
    )
    
    if (verification[0]?.length > 0) {
      console.log('✅ User verification successful:')
      console.log(JSON.stringify(verification[0][0], null, 2))
    } else {
      console.log('❌ User verification failed - user not found')
    }
    
    console.log('\n🎉 Setup complete!')
    console.log('\n🌐 Next steps:')
    console.log('1. Start your development server: pnpm dev')
    console.log('2. Visit: http://localhost:3002')
    console.log('3. Sign in with the credentials above')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check your environment file has correct SurrealDB Cloud credentials')
    console.error('2. Verify your SurrealDB Cloud instance is running')
    console.error('3. Ensure you have the correct namespace and database names')
    console.error('4. Check your network connection')
    
    if (error.message.includes('connection')) {
      console.error('\n💡 Connection issue detected. Please verify:')
      console.error('   - SURREALDB_URL is correct (should start with wss://)')
      console.error('   - Your SurrealDB Cloud instance is active')
      console.error('   - Network/firewall allows WebSocket connections')
    }
    
    if (error.message.includes('authentication') || error.message.includes('signin')) {
      console.error('\n💡 Authentication issue detected. Please verify:')
      console.error('   - SURREALDB_ROOT_USER is correct')
      console.error('   - SURREALDB_ROOT_PASS is correct')
      console.error('   - User has admin privileges on the database')
    }
    
    process.exit(1)
  } finally {
    await db.close()
    console.log('\n🔌 Disconnected from SurrealDB')
  }
}

// Run the script
createTestUser()