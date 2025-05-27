#!/bin/bash

# SurrealDB Migration Runner with Environment Variable Substitution
# This script safely runs migrations by substituting environment variables
# without committing secrets to version control.
# Now supports multiple migration files in sequence (0001-0009)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SurrealDB Migration Runner v2.0${NC}"
echo "========================================="

# Parse command line arguments
SPECIFIC_MIGRATION=""
SKIP_VALIDATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --migration)
            SPECIFIC_MIGRATION="$2"
            shift 2
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --migration XXXX    Run specific migration (e.g., 0001, 0005)"
            echo "  --skip-validation   Skip environment variable validation"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all migrations in sequence"
            echo "  $0 --migration 0003   # Run only migration 0003"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

# Environment validation (unless skipped)
if [ "$SKIP_VALIDATION" = false ]; then
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
fi

# Check if surreal CLI is available
if ! command -v surreal &> /dev/null; then
    echo -e "${RED}❌ Error: SurrealDB CLI not found${NC}"
    echo "Please install SurrealDB CLI: https://surrealdb.com/docs/installation"
    exit 1
fi

# Define migration files in order
MIGRATION_FILES=(
    "0000_namespace_database.surql"
    "0001_authentication.surql"
    "0002_core_users.surql"
    "0003_lookup_tables.surql"
    "0004_social_interactions.surql"
    "0005_messaging.surql"
    "0006_content_vlogs.surql"
    "0007_groups_sites.surql"
    "0008_events_triggers.surql"
)

# Function to run a single migration
run_migration() {
    local migration_file=$1
    local migration_number=$(echo "$migration_file" | cut -d'_' -f1)
    
    echo -e "${BLUE}📄 Processing migration $migration_number: $migration_file${NC}"
    
    # Check if migration file exists
    if [ ! -f "migrations/$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration file migrations/$migration_file not found${NC}"
        return 1
    fi
    
    # Create temporary directory for processed migration
    local temp_dir=$(mktemp -d)
    local temp_migration="$temp_dir/migration_with_secrets.surql"
    
    # Substitute environment variables in migration file
    envsubst < "migrations/$migration_file" > "$temp_migration"
    
    # Verify substitution worked (check that no placeholders remain)
    if grep -q '\${' "$temp_migration"; then
        echo -e "${RED}❌ Error: Some environment variables were not substituted in $migration_file${NC}"
        echo "Remaining placeholders:"
        grep '\${' "$temp_migration" || true
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Run the migration
    echo -e "${YELLOW}⚡ Running migration $migration_number...${NC}"
    if surreal import --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "$temp_migration"; then
        echo -e "${GREEN}✅ Migration $migration_number completed successfully!${NC}"
    else
        echo -e "${RED}❌ Migration $migration_number failed${NC}"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Clean up temporary files
    rm -rf "$temp_dir"
    return 0
}

echo -e "${YELLOW}🗄️  Connecting to SurrealDB...${NC}"
echo "URL: $SURREALDB_URL"
echo "Namespace: $SURREALDB_NAMESPACE"
echo "Database: $SURREALDB_DATABASE"
echo ""

# Run migrations
if [ -n "$SPECIFIC_MIGRATION" ]; then
    # Run specific migration
    migration_file=""
    for file in "${MIGRATION_FILES[@]}"; do
        if [[ "$file" == "$SPECIFIC_MIGRATION"* ]]; then
            migration_file="$file"
            break
        fi
    done
    
    if [ -z "$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration $SPECIFIC_MIGRATION not found${NC}"
        echo "Available migrations:"
        for file in "${MIGRATION_FILES[@]}"; do
            echo "  - $(echo "$file" | cut -d'_' -f1)"
        done
        exit 1
    fi
    
    run_migration "$migration_file"
else
    # Run all migrations in sequence
    echo -e "${YELLOW}🔄 Running all migrations in sequence...${NC}"
    echo ""
    
    for migration_file in "${MIGRATION_FILES[@]}"; do
        if ! run_migration "$migration_file"; then
            echo -e "${RED}❌ Migration sequence failed at $migration_file${NC}"
            exit 1
        fi
        echo ""
    done
fi

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
echo ""
echo "Your SurrealDB iDance database is now configured with:"
echo "• Foundation: Namespace and database structure"
echo "• Authentication: User, OAuth, and worker access"
echo "• Core Users: User profiles and device management"
echo "• Lookup Tables: Countries, states, cities, dance styles, interests"
echo "• Social Features: Follows, swipes, matches, user associations"
echo "• Messaging: Real-time chat and notifications"
echo "• Content: Vlogs and user-generated content"
echo "• Groups & Sites: Dance groups and custom websites"
echo "• Events & Triggers: Real-time automation and notifications"
echo ""
echo "Next steps:"
echo "1. Test authentication with your application"
echo "2. Configure OAuth providers in your .env file"
echo "3. Populate lookup tables with initial data"
echo "4. Update your application code to use the new schema"