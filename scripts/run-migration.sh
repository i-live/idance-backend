#!/bin/bash

# SurrealDB Migration Runner with Environment Variable Substitution
# This script safely runs migrations by substituting environment variables
# without committing secrets to version control.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SurrealDB Migration Runner${NC}"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please copy .env.example to .env and configure your environment variables."
    echo "Run: cp .env.example .env"
    exit 1
fi

# Load environment variables
echo -e "${YELLOW}📋 Loading environment variables...${NC}"
source .env

# Check required environment variables
required_vars=("SURREALDB_URL" "SURREALDB_NAMESPACE" "SURREALDB_DATABASE" "SURREALDB_ROOT_USER" "SURREALDB_ROOT_PASS" "SURREALDB_JWT_SECRET" "SURREALDB_WORKER_JWT_SECRET")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: Required environment variable $var is not set${NC}"
        echo "Please check your .env file and ensure all required variables are configured."
        exit 1
    fi
done

# Validate JWT secrets (should be at least 32 characters for security)
if [ ${#SURREALDB_JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ Error: SURREALDB_JWT_SECRET is too short (minimum 32 characters)${NC}"
    echo "Generate a secure secret with: openssl rand -base64 64"
    exit 1
fi

if [ ${#SURREALDB_WORKER_JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ Error: SURREALDB_WORKER_JWT_SECRET is too short (minimum 32 characters)${NC}"
    echo "Generate a secure secret with: openssl rand -base64 64"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="migrations/0000_initial_schema.surql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file $MIGRATION_FILE not found${NC}"
    exit 1
fi

# Create temporary directory for processed migration
TEMP_DIR=$(mktemp -d)
TEMP_MIGRATION="$TEMP_DIR/migration_with_secrets.surql"

echo -e "${YELLOW}🔄 Processing migration file...${NC}"

# Substitute environment variables in migration file
envsubst < "$MIGRATION_FILE" > "$TEMP_MIGRATION"

# Verify substitution worked (check that no placeholders remain)
if grep -q '\${' "$TEMP_MIGRATION"; then
    echo -e "${RED}❌ Error: Some environment variables were not substituted${NC}"
    echo "Remaining placeholders:"
    grep '\${' "$TEMP_MIGRATION" || true
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${YELLOW}🗄️  Connecting to SurrealDB...${NC}"
echo "URL: $SURREALDB_URL"
echo "Namespace: $SURREALDB_NAMESPACE"
echo "Database: $SURREALDB_DATABASE"

# Check if surreal CLI is available
if ! command -v surreal &> /dev/null; then
    echo -e "${RED}❌ Error: SurrealDB CLI not found${NC}"
    echo "Please install SurrealDB CLI: https://surrealdb.com/docs/installation"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Run the migration
echo -e "${YELLOW}⚡ Running migration...${NC}"
if surreal import --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "$TEMP_MIGRATION"; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Clean up temporary files
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 All done!${NC}"
echo ""
echo "Your SurrealDB authentication system is now configured with:"
echo "• User authentication access (email/password)"
echo "• OAuth authentication access"
echo "• Worker authentication access"
echo "• Enhanced security features"
echo ""
echo "Next steps:"
echo "1. Test authentication with your application"
echo "2. Configure OAuth providers in your .env file"
echo "3. Update your application code to use the new access methods"