#!/bin/bash

# Enhanced SurrealDB Migration Runner v3.0
# Features:
# - Migration tracking with database table
# - Dynamic migration discovery
# - Real-time feedback
# - Flexible .env file location
# - Up/Down migration support
# - Environment variable substitution

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SurrealDB Migration Runner v3.0${NC}"
echo "========================================="

# Parse command line arguments
SPECIFIC_MIGRATION=""
SKIP_VALIDATION=false
MIGRATION_DIRECTION="up"
ENV_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --migration)
            SPECIFIC_MIGRATION="$2"
            shift 2
            ;;
        --down)
            MIGRATION_DIRECTION="down"
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --migration XXXX    Run specific migration (e.g., 0001, 0005)"
            echo "  --down              Run down migrations (rollback)"
            echo "  --skip-validation   Skip environment variable validation"
            echo "  --env-file PATH     Specify custom .env file location"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run all up migrations"
            echo "  $0 --migration 0003          # Run specific up migration"
            echo "  $0 --migration 0003 --down   # Rollback specific migration"
            echo "  $0 --down                    # Rollback last migration"
            echo "  $0 --env-file ../.env        # Use custom .env file"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Find .env file
find_env_file() {
    if [ -n "$ENV_FILE" ]; then
        if [ -f "$ENV_FILE" ]; then
            echo "$ENV_FILE"
            return 0
        else
            echo -e "${RED}❌ Error: Specified .env file not found: $ENV_FILE${NC}"
            exit 1
        fi
    fi
    
    # Check current directory
    if [ -f ".env" ]; then
        echo ".env"
        return 0
    fi
    
    # Check parent directory
    if [ -f "../.env" ]; then
        echo "../.env"
        return 0
    fi
    
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Searched in:"
    echo "  - Current directory: $(pwd)/.env"
    echo "  - Parent directory: $(pwd)/../.env"
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
}

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"

# If we're not in the database directory, change to it
if [ "$(basename "$(pwd)")" != "database" ]; then
    cd "$DATABASE_DIR"
fi

ENV_FILE_PATH=$(find_env_file)
echo -e "${YELLOW}📋 Loading environment variables from: $ENV_FILE_PATH${NC}"
source "$ENV_FILE_PATH"

# Environment validation (unless skipped)
if [ "$SKIP_VALIDATION" = false ]; then
    required_vars=("SURREALDB_URL" "SURREALDB_NAMESPACE" "SURREALDB_DATABASE" "SURREALDB_ROOT_USER" "SURREALDB_ROOT_PASS" "SURREALDB_JWT_SECRET" "SURREALDB_WORKER_JWT_SECRET")

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Error: Required environment variable $var is not set${NC}"
            echo "Please check your .env file and ensure all required variables are configured."
            exit 1
        fi
    done

    # Validate JWT secrets
    if [ ${#SURREALDB_JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ Error: SURREALDB_JWT_SECRET is too short (minimum 32 characters)${NC}"
        exit 1
    fi

    if [ ${#SURREALDB_WORKER_JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ Error: SURREALDB_WORKER_JWT_SECRET is too short (minimum 32 characters)${NC}"
        exit 1
    fi
fi

# Check if surreal CLI is available
if ! command -v surreal &> /dev/null; then
    echo -e "${RED}❌ Error: SurrealDB CLI not found${NC}"
    echo "Please install SurrealDB CLI: https://surrealdb.com/docs/installation"
    exit 1
fi

# Discover migration files dynamically
discover_migrations() {
    local direction=$1
    local migrations=()
    
    for file in migrations/*_${direction}.surql; do
        if [ -f "$file" ]; then
            migrations+=($(basename "$file"))
        fi
    done
    
    # Sort migrations by number
    IFS=$'\n' sorted=($(sort <<<"${migrations[*]}"))
    unset IFS
    
    echo "${sorted[@]}"
}

# Check if migration has been applied
is_migration_applied() {
    local migration_number=$1
    
    # Skip tracking check for bootstrap migration (0000)
    if [ "$migration_number" = "0000" ]; then
        return 1  # Always run bootstrap
    fi
    
    # Check if migration_history table exists and migration is recorded
    local result=$(surreal sql --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "SELECT * FROM migration_history WHERE migration_number = '$migration_number';" 2>/dev/null || echo "")
    
    if [[ "$result" == *"$migration_number"* ]]; then
        return 0  # Migration applied
    else
        return 1  # Migration not applied
    fi
}

# Record migration in tracking table
record_migration() {
    local migration_number=$1
    local migration_name=$2
    local migration_file=$3
    local start_time=$4
    local end_time=$5
    
    # Skip recording for bootstrap migration (0000)
    if [ "$migration_number" = "0000" ]; then
        return 0
    fi
    
    local execution_time=$((end_time - start_time))
    
    surreal sql --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "
    CREATE migration_history SET
        migration_number = '$migration_number',
        migration_name = '$migration_name',
        migration_file = '$migration_file',
        applied_at = time::now(),
        applied_by = 'migration_script',
        execution_time_ms = $execution_time;
    " >/dev/null 2>&1
}

# Remove migration from tracking table
remove_migration_record() {
    local migration_number=$1
    
    # Skip for bootstrap migration (0000)
    if [ "$migration_number" = "0000" ]; then
        return 0
    fi
    
    surreal sql --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "
    DELETE FROM migration_history WHERE migration_number = '$migration_number';
    " >/dev/null 2>&1
}

# Run a single migration
run_migration() {
    local migration_file=$1
    local direction=$2
    
    # Extract migration info from filename
    local migration_number=$(echo "$migration_file" | cut -d'_' -f1)
    local migration_name=$(echo "$migration_file" | sed "s/^${migration_number}_//; s/_${direction}\.surql$//")
    
    echo -e "${BLUE}📄 Processing migration $migration_number ($direction): $migration_name${NC}"
    
    # Check if migration file exists
    if [ ! -f "migrations/$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration file migrations/$migration_file not found${NC}"
        return 1
    fi
    
    # For up migrations, check if already applied (except bootstrap)
    if [ "$direction" = "up" ] && [ "$migration_number" != "0000" ]; then
        if is_migration_applied "$migration_number"; then
            echo -e "${YELLOW}⏭️  Migration $migration_number already applied, skipping${NC}"
            return 0
        fi
    fi
    
    # For down migrations, check if migration tracking exists
    if [ "$direction" = "down" ] && [ "$migration_number" != "0000" ]; then
        if ! is_migration_applied "$migration_number"; then
            echo -e "${YELLOW}⏭️  Migration $migration_number not applied, skipping rollback${NC}"
            return 0
        fi
    fi
    
    # Create temporary directory for processed migration
    local temp_dir=$(mktemp -d)
    local temp_migration="$temp_dir/migration_with_secrets.surql"
    
    # Substitute environment variables in migration file
    envsubst < "migrations/$migration_file" > "$temp_migration"
    
    # Verify substitution worked
    if grep -q '\${' "$temp_migration"; then
        echo -e "${RED}❌ Error: Some environment variables were not substituted in $migration_file${NC}"
        echo "Remaining placeholders:"
        grep '\${' "$temp_migration" || true
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Run the migration with timing
    echo -e "${YELLOW}⚡ Running migration $migration_number ($direction)...${NC}"
    local start_time=$(date +%s%3N)
    
    if surreal import --conn "$SURREALDB_URL" --user "$SURREALDB_ROOT_USER" --pass "$SURREALDB_ROOT_PASS" --ns "$SURREALDB_NAMESPACE" --db "$SURREALDB_DATABASE" "$temp_migration"; then
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        echo -e "${GREEN}✅ Migration $migration_number ($direction) completed successfully! (${execution_time}ms)${NC}"
        
        # Update tracking table
        if [ "$direction" = "up" ]; then
            record_migration "$migration_number" "$migration_name" "$migration_file" "$start_time" "$end_time"
        else
            remove_migration_record "$migration_number"
        fi
    else
        echo -e "${RED}❌ Migration $migration_number ($direction) failed${NC}"
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
echo "Direction: $MIGRATION_DIRECTION"
echo ""

# Discover available migrations
available_migrations=($(discover_migrations "$MIGRATION_DIRECTION"))

if [ ${#available_migrations[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No $MIGRATION_DIRECTION migrations found${NC}"
    exit 0
fi

# Run migrations
if [ -n "$SPECIFIC_MIGRATION" ]; then
    # Run specific migration
    migration_file=""
    for file in "${available_migrations[@]}"; do
        if [[ "$file" == "$SPECIFIC_MIGRATION"* ]]; then
            migration_file="$file"
            break
        fi
    done
    
    if [ -z "$migration_file" ]; then
        echo -e "${RED}❌ Error: Migration $SPECIFIC_MIGRATION ($MIGRATION_DIRECTION) not found${NC}"
        echo "Available migrations:"
        for file in "${available_migrations[@]}"; do
            echo "  - $(echo "$file" | cut -d'_' -f1)"
        done
        exit 1
    fi
    
    run_migration "$migration_file" "$MIGRATION_DIRECTION"
else
    # Run all migrations
    if [ "$MIGRATION_DIRECTION" = "down" ]; then
        # Reverse order for down migrations
        for ((i=${#available_migrations[@]}-1; i>=0; i--)); do
            migration_file="${available_migrations[i]}"
            if ! run_migration "$migration_file" "$MIGRATION_DIRECTION"; then
                echo -e "${RED}❌ Migration sequence failed at $migration_file${NC}"
                exit 1
            fi
            echo ""
        done
    else
        # Normal order for up migrations
        for migration_file in "${available_migrations[@]}"; do
            if ! run_migration "$migration_file" "$MIGRATION_DIRECTION"; then
                echo -e "${RED}❌ Migration sequence failed at $migration_file${NC}"
                exit 1
            fi
            echo ""
        done
    fi
fi

echo -e "${GREEN}🎉 All $MIGRATION_DIRECTION migrations completed successfully!${NC}"
echo ""
echo -e "${PURPLE}📊 Migration Summary:${NC}"
echo "• Direction: $MIGRATION_DIRECTION"
echo "• Database: $SURREALDB_NAMESPACE.$SURREALDB_DATABASE"
echo "• Migrations processed: ${#available_migrations[@]}"
echo ""
if [ "$MIGRATION_DIRECTION" = "up" ]; then
    echo "Your SurrealDB database is now up to date!"
else
    echo "Rollback completed successfully!"
fi