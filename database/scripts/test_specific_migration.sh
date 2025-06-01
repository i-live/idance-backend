#!/bin/bash

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DATABASE_DIR"

# Load environment variables
source ../.env

echo "=== Testing Migration System ==="
echo ""

# Test 1: Run migration 0000 (up)
echo "1. Running migration 0000 (up) - Database initialization..."
./scripts/run-migration.sh --migration 0000
echo ""

# Test 2: Check if we can query the health_check table
echo "2. Testing if health_check table was created..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "SELECT * FROM health_check;"
echo ""

# Test 3: Run migration 0001 (up) - Migration tracking
echo "3. Running migration 0001 (up) - Migration tracking..."
./scripts/run-migration.sh --migration 0001
echo ""

# Test 4: Check migration tracking table
echo "4. Testing migration tracking table..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "SELECT * FROM migration_history;"
echo ""

# Test 5: Run migration 0001 down (rollback)
echo "5. Testing rollback - Running migration 0001 (down)..."
./scripts/run-migration.sh --migration 0001 --down
echo ""

# Test 6: Run migration 0001 up again
echo "6. Testing re-application - Running migration 0001 (up) again..."
./scripts/run-migration.sh --migration 0001
echo ""

echo "=== Migration Testing Complete ==="