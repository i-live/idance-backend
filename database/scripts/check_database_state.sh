#!/bin/bash

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DATABASE_DIR"

# Load environment variables
source ../.env

echo "=== Current Database State ==="
echo "URL: $SURREALDB_URL"
echo "Namespace: $SURREALDB_NAMESPACE"
echo "Database: $SURREALDB_DATABASE"
echo ""

echo "1. Checking available tables..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "INFO FOR DB;"
echo ""

echo "2. Checking health_check table (if exists)..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "SELECT * FROM health_check LIMIT 5;" 2>/dev/null || echo "health_check table doesn't exist yet"
echo ""

echo "3. Checking migration_history table (if exists)..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "SELECT * FROM migration_history;" 2>/dev/null || echo "migration_history table doesn't exist yet"
echo ""

echo "=== End Database State ==="