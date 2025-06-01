#!/bin/bash

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DATABASE_DIR"

# Load environment variables
source ../.env

echo "Testing simple SurrealDB migration..."
echo "URL: $SURREALDB_URL"
echo "Namespace: $SURREALDB_NAMESPACE"  
echo "Database: $SURREALDB_DATABASE"

# Create a simple SQL file with substituted variables
cat > temp_migration.surql << EOF
USE NAMESPACE $SURREALDB_NAMESPACE;
USE DATABASE $SURREALDB_DATABASE;

-- Basic health check - create a simple table to verify connection
DEFINE TABLE health_check SCHEMAFULL;
DEFINE FIELD created_at ON TABLE health_check TYPE datetime DEFAULT time::now();

-- Insert a test record to verify everything is working
CREATE health_check SET created_at = time::now();
EOF

echo "Generated migration content:"
cat temp_migration.surql

echo ""
echo "Running migration..."

# Execute each SQL statement separately
echo "1. Setting namespace and database..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "USE NAMESPACE $SURREALDB_NAMESPACE; USE DATABASE $SURREALDB_DATABASE;"

echo "2. Creating health_check table..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "DEFINE TABLE health_check SCHEMAFULL;"

echo "3. Defining created_at field..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "DEFINE FIELD created_at ON TABLE health_check TYPE datetime DEFAULT time::now();"

echo "4. Creating test record..."
surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "CREATE health_check SET created_at = time::now();"

# Clean up
rm temp_migration.surql