import { Surreal } from 'surrealdb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🧪 SurrealDB Migration Plugin Test Suite\n');

const db = new Surreal();

async function runTests() {
  try {
    // Connect
    await db.connect(process.env.SURREALDB_URL);
    await db.signin({
      username: process.env.SURREALDB_ROOT_USER,
      password: process.env.SURREALDB_ROOT_PASS
    });
    await db.use({ 
      namespace: process.env.SURREALDB_NAMESPACE, 
      database: process.env.SURREALDB_DATABASE 
    });
    
    console.log('✅ Connected to SurrealDB Cloud v2.3.3\n');

    // Clean up any existing test data first
    console.log('🧹 Cleaning up any existing test data...');
    try {
      await db.query(`
        REMOVE TABLE IF EXISTS test_users;
        REMOVE TABLE IF EXISTS test_posts;
        REMOVE TABLE IF EXISTS test_migration_table;
        REMOVE FUNCTION IF EXISTS fn::test_migration;
        REMOVE FUNCTION IF EXISTS fn::calculate_age;
        REMOVE ACCESS IF EXISTS test_jwt ON DATABASE;
        DELETE _migrations WHERE id CONTAINS 'test_';
      `);
    } catch (e) {
      // Ignore cleanup errors
    }
    console.log('✅ Cleanup complete\n');

    // Test suite
    const tests = [
      {
        name: 'Create Migration Table (IF NOT EXISTS)',
        query: `
          -- This should work even if table exists
          DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
          DEFINE FIELD IF NOT EXISTS name ON _migrations TYPE string;
          DEFINE FIELD IF NOT EXISTS executed_at ON _migrations TYPE datetime DEFAULT time::now();
          DEFINE FIELD IF NOT EXISTS checksum ON _migrations TYPE string;
          DEFINE INDEX IF NOT EXISTS idx_migrations_name ON _migrations COLUMNS name UNIQUE;
        `
      },
      {
        name: 'Complex Table with Constraints',
        query: `
          DEFINE TABLE test_users SCHEMAFULL;
          DEFINE FIELD email ON test_users TYPE string ASSERT string::is::email($value);
          DEFINE FIELD age ON test_users TYPE number ASSERT $value >= 18;
          DEFINE FIELD created_at ON test_users TYPE datetime DEFAULT time::now();
          DEFINE INDEX idx_test_users_email ON test_users COLUMNS email UNIQUE;
        `
      },
      {
        name: 'Function Definition',
        query: `
          DEFINE FUNCTION fn::test_migration($name: string) {
            RETURN "Hello, " + $name + "!";
          };
        `
      },
      {
        name: 'Complex Function with Date Handling',
        query: `
          DEFINE FUNCTION fn::calculate_age($birth_date: string) {
            LET $birth = type::datetime($birth_date);
            LET $now = time::now();
            LET $age_ms = $now - $birth;
            LET $age_years = $age_ms / 31536000000ms;
            RETURN math::floor($age_years);
          };
        `
      },
      {
        name: 'Access Method (JWT)',
        query: `
          DEFINE ACCESS test_jwt ON DATABASE TYPE JWT
            ALGORITHM HS256 KEY 'test-secret-key'
            DURATION FOR SESSION 24h;
        `
      },
      {
        name: 'Transaction Test',
        query: `
          BEGIN TRANSACTION;
          
          CREATE test_users:u1 SET 
            email = 'user1@example.com',
            age = 25;
          
          CREATE test_users:u2 SET 
            email = 'user2@example.com',
            age = 30;
          
          COMMIT TRANSACTION;
        `
      },
      {
        name: 'Function Execution - RETURN',
        query: `RETURN fn::test_migration('World');`
      },
      {
        name: 'Function Execution - Calculate Age',
        query: `RETURN fn::calculate_age('2000-01-01T00:00:00Z');`
      },
      {
        name: 'Create Migration Record',
        query: `
          CREATE _migrations SET 
            name = 'test_migration_001',
            executed_at = time::now(),
            checksum = 'abc123def456';
        `
      },
      {
        name: 'Complex Query with Relations',
        query: `
          DEFINE TABLE test_posts SCHEMAFULL;
          DEFINE FIELD title ON test_posts TYPE string;
          DEFINE FIELD author ON test_posts TYPE record<test_users>;
          DEFINE FIELD created_at ON test_posts TYPE datetime DEFAULT time::now();
          
          CREATE test_posts:p1 SET
            title = 'First Post',
            author = test_users:u1;
        `
      },
      {
        name: 'Select with Join',
        query: `
          SELECT 
            title,
            author.email AS author_email
          FROM test_posts;
        `
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`📝 ${test.name}`);
        const result = await db.query(test.query);
        console.log('✅ Success');
        
        // Show result for execution tests
        if (test.name.includes('Execution') || test.name.includes('Select')) {
          console.log(`   Result: ${JSON.stringify(result)}`);
        }
        
        passed++;
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        failed++;
      }
      console.log('');
    }

    // Final cleanup
    console.log('🧹 Final cleanup...');
    try {
      await db.query(`
        REMOVE TABLE IF EXISTS test_users;
        REMOVE TABLE IF EXISTS test_posts;
        REMOVE TABLE IF EXISTS test_migration_table;
        REMOVE FUNCTION IF EXISTS fn::test_migration;
        REMOVE FUNCTION IF EXISTS fn::calculate_age;
        REMOVE ACCESS IF EXISTS test_jwt ON DATABASE;
        DELETE _migrations WHERE name = 'test_migration_001';
      `);
      console.log('✅ Cleanup complete\n');
    } catch (e) {
      console.log('✅ Cleanup complete (some items may not have existed)\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('');
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\nThe WebSocket SDK is ready for the Nx plugin implementation.');
    } else {
      console.log('⚠️  Some tests failed. Fixing required.');
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await db.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run tests
if (!process.env.SURREALDB_ROOT_PASS) {
  console.error('❌ Error: SURREALDB_ROOT_PASS environment variable not set');
  process.exit(1);
}

runTests();