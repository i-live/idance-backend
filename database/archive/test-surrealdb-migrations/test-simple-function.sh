#!/bin/bash

# Test a simple function migration similar to our authentication issues
set -e

echo "🧪 Testing simple function migration..."

# Load environment variables from parent directory
source ../../.env

# Create a simple migration with a function (similar to our auth function)
echo "📝 Creating test migration..."
surrealdb-migrations create TestSimpleFunction

# Find the created migration file
MIGRATION_FILE=$(find migrations -name "*TestSimpleFunction.surql" | head -1)

if [ -z "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not created"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"

# Add our test content (similar to the problematic auth function)
cat > "$MIGRATION_FILE" << 'EOF'
-- Test migration with function (similar to our auth issues)

-- Create a simple table
DEFINE TABLE test_user SCHEMAFULL;
DEFINE FIELD email ON test_user TYPE string;
DEFINE FIELD password ON test_user TYPE string;

-- Create a function with parameters (this was causing our parsing issues)
DEFINE FUNCTION fn::test_signup($email: string, $password: string) {
    LET $existing = SELECT * FROM test_user WHERE email = $email;
    
    IF array::len($existing) > 0 {
        THROW "User already exists";
    };
    
    CREATE test_user SET 
        email = $email,
        password = crypto::argon2::generate($password),
        created_at = time::now();
    
    RETURN "User created successfully";
};

-- Test the function works
CREATE test_user SET email = "test@example.com", password = "hashed_password", created_at = time::now();
EOF

echo ""
echo "📋 Migration content:"
cat "$MIGRATION_FILE"

echo ""
echo "🔧 Configuring database connection..."

# Create .surrealdb config file
cat > .surrealdb << EOF
[core]
path = "./"
schema = "./schemas"

[db]
address = "$SURREALDB_URL"
username = "$SURREALDB_ROOT_USER"
password = "$SURREALDB_ROOT_PASS"
namespace = "$SURREALDB_NAMESPACE"
database = "test_migrations"
EOF

echo "✅ Configuration created"

echo ""
echo "🚀 Applying migration..."
surrealdb-migrations apply

echo ""
echo "📊 Checking migration status..."
surrealdb-migrations list

echo ""
echo "🔍 Testing if function was created..."
# Test if we can call the function
echo "SELECT fn::test_signup('new@example.com', 'password123') as result;" | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "test_migrations" --hide-welcome

echo ""
echo "✅ Test completed!"