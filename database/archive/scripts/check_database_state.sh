#!/bin/bash

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DATABASE_DIR"

# Load environment variables
source ../.env

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Status ===${NC}"
echo -e "${BLUE}URL:${NC} $SURREALDB_URL"
echo -e "${BLUE}Namespace:${NC} $SURREALDB_NAMESPACE"
echo -e "${BLUE}Database:${NC} $SURREALDB_DATABASE"
echo ""

# Test connection first
echo -e "${YELLOW}🔌 Testing Connection:${NC}"
connection_test=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "SELECT 1 as test;" 2>&1)

if echo "$connection_test" | grep -q "test"; then
    echo -e "${GREEN}  ✅ Connection successful${NC}"
else
    echo -e "${RED}  ❌ Connection failed${NC}"
    echo "  Error: $connection_test"
    echo ""
    echo -e "${RED}=== Connection Failed - Exiting ===${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Available Tables:${NC}"
# Get table info and format it nicely
tables_result=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "INFO FOR DB;" 2>/dev/null)

if [[ -n "$tables_result" && "$tables_result" != "null" ]]; then
    # Show raw result for debugging
    echo -e "${BLUE}  Raw database info:${NC}"
    echo "$tables_result" | head -5
    echo ""
    
    # Try to extract table names
    if echo "$tables_result" | grep -q "tables"; then
        echo -e "${GREEN}  Tables found in database${NC}"
        # Extract table names from JSON
        echo "$tables_result" | jq -r '.[] | select(.tables) | .tables | keys[]' 2>/dev/null | while read table; do
            echo "    • $table"
        done
    else
        echo "  No tables found or unable to parse table info"
    fi
else
    echo "  No database info returned"
fi
echo ""

echo -e "${YELLOW}🔧 Functions:${NC}"
functions_result=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "INFO FOR DB;" 2>/dev/null)
if echo "$functions_result" | jq -r '.[] | select(.functions) | .functions | keys[]' 2>/dev/null | head -5; then
    echo "  Functions found"
else
    echo "  No functions found"
fi
echo ""

echo -e "${YELLOW}🔐 Access Methods:${NC}"
access_result=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "INFO FOR DB;" 2>/dev/null)
if echo "$access_result" | jq -r '.[] | select(.accesses) | .accesses | keys[]' 2>/dev/null | head -5; then
    echo "  Access methods found"
else
    echo "  No access methods found"
fi
echo ""

echo -e "${YELLOW}🏥 Health Check Status:${NC}"
health_result=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "SELECT count() as total FROM health_check;" 2>/dev/null)
if [[ "$health_result" == *"total"* ]]; then
    count=$(echo "$health_result" | grep -o '"total": [0-9]*' | grep -o '[0-9]*')
    echo "  • Total health check records: $count"
    
    # Show latest record
    latest=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "SELECT * FROM health_check ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)
    if [[ "$latest" == *"created_at"* ]]; then
        created_at=$(echo "$latest" | grep -o '"created_at": "[^"]*"' | sed 's/"created_at": "//g' | sed 's/"//g')
        echo "  • Latest check: $created_at"
    fi
else
    echo "  • No health check table found"
fi
echo ""

echo -e "${YELLOW}📊 Migration History:${NC}"
migration_result=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "SELECT migration_number, migration_name, applied_at FROM migration_history ORDER BY migration_number;" 2>/dev/null)

if [[ "$migration_result" == *"migration_number"* ]]; then
    echo "  Applied migrations:"
    echo "$migration_result" | grep -o '"migration_number": "[^"]*"' | sed 's/"migration_number": "//g' | sed 's/"//g' | while read migration; do
        echo "    ✅ Migration $migration"
    done
else
    echo "  • No migration history found (migrations not yet applied)"
fi

echo ""
echo -e "${GREEN}=== End Status ===${NC}"