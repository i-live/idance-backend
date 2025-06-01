#!/bin/bash

# Simple debug script to test SurrealDB execution
set -e

# Load environment variables
source ../.env

echo "=== Testing SurrealDB Execution ==="
echo "URL: $SURREALDB_URL"
echo "Namespace: $SURREALDB_NAMESPACE"
echo "Database: $SURREALDB_DATABASE"
echo ""

echo "1. Testing connection..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "SELECT 1 as test;"
echo ""

echo "2. Testing simple file execution..."
echo "File content:"
cat test-simple.surql
echo ""
echo "Executing file:"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome < test-simple.surql
echo ""

echo "3. Testing without transaction wrapper..."
cat > test-no-transaction.surql << 'EOF'
-- Simple test without transaction
DEFINE TABLE test_table2 SCHEMAFULL;
DEFINE FIELD name ON TABLE test_table2 TYPE string;
CREATE test_table2 SET name = "test2";
EOF

echo "File content (no transaction):"
cat test-no-transaction.surql
echo ""
echo "Executing file (no transaction):"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome < test-no-transaction.surql
echo ""

echo "4. Testing individual statements..."
echo "Statement 1: DEFINE TABLE"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "DEFINE TABLE test_table3 SCHEMAFULL;"

echo "Statement 2: DEFINE FIELD"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "DEFINE FIELD name ON TABLE test_table3 TYPE string;"

echo "Statement 3: CREATE RECORD"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "CREATE test_table3 SET name = 'test3';"

echo ""
echo "5. Check what was created..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "INFO FOR DB;"

echo ""
echo "6. Testing minimal auth function..."
echo "File content (minimal auth):"
cat test-auth-minimal.surql
echo ""
echo "Executing minimal auth file:"
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome < test-auth-minimal.surql

echo ""
echo "=== Debug Complete ==="