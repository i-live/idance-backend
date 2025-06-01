#!/bin/bash

# Test the SQL parser
set -e

# Load environment variables
source ../.env

# Source the parser
source scripts/sql-parser.sh

echo "=== Testing SQL Parser ==="

# Test with our simple file
echo "1. Testing simple file..."
parse_and_execute_sql "test-simple.surql"

echo ""
echo "2. Testing minimal auth file..."
parse_and_execute_sql "test-auth-minimal.surql"

echo ""
echo "3. Check database state..."
echo "SELECT 1 as test" | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome

echo ""
echo "=== Parser Test Complete ==="