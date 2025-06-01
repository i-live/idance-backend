#!/bin/bash

# Test statement-by-statement execution
set -e

# Load environment variables
source ../.env

echo "=== Testing Statement-by-Statement Execution ==="

# Function to execute a single statement
execute_statement() {
    local statement="$1"
    echo "Executing: $statement"
    echo "$statement" | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome
    echo ""
}

# Test 1: Simple SELECT
execute_statement "SELECT 1 as test"

# Test 2: Define table
execute_statement "DEFINE TABLE test_stmt SCHEMAFULL"

# Test 3: Define field
execute_statement "DEFINE FIELD name ON TABLE test_stmt TYPE string"

# Test 4: Simple function (single line)
execute_statement "DEFINE FUNCTION fn::simple_test(\$name: string) { RETURN 'Hello ' + \$name; }"

# Test 5: Multi-line function (as single statement)
cat << 'EOF' | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome
DEFINE FUNCTION fn::multi_line_test($email: string) {
    LET $existing = SELECT * FROM user WHERE email = $email;
    IF array::len($existing) > 0 {
        THROW "User already exists";
    };
    RETURN "User can be created";
}
EOF

echo ""
echo "=== Results ==="
execute_statement "INFO FOR DB"