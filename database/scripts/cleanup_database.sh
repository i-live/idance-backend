#!/bin/bash

# Change to database directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DATABASE_DIR"

# Load environment variables
source ../.env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  WARNING: This will remove ALL data from the database!${NC}"
echo -e "${YELLOW}   Database: $SURREALDB_NAMESPACE.$SURREALDB_DATABASE${NC}"
echo -e "${YELLOW}   URL: $SURREALDB_URL${NC}"
echo ""

# Interactive menu with arrow keys
show_confirmation_menu() {
    local selected=1  # 1 = No (default), 0 = Yes
    local options=("Yes, delete everything" "No, cancel cleanup")
    
    while true; do
        echo -e "\033[2J\033[H"  # Clear screen and move cursor to top
        echo -e "${YELLOW}⚠️  WARNING: This will remove ALL data from the database!${NC}"
        echo -e "${YELLOW}   Database: $SURREALDB_NAMESPACE.$SURREALDB_DATABASE${NC}"
        echo -e "${YELLOW}   URL: $SURREALDB_URL${NC}"
        echo ""
        echo "Are you sure you want to continue?"
        echo ""
        
        for i in "${!options[@]}"; do
            if [ $i -eq $selected ]; then
                echo -e "${GREEN}▶ ${options[$i]}${NC}"
            else
                echo "  ${options[$i]}"
            fi
        done
        
        echo ""
        echo "Use ↑/↓ arrow keys to navigate, Enter to select, Ctrl+C to cancel"
        
        # Read a single character
        read -rsn1 key
        
        case $key in
            $'\x1b')  # ESC sequence
                read -rsn2 key
                case $key in
                    '[A')  # Up arrow
                        selected=$(( (selected - 1 + ${#options[@]}) % ${#options[@]} ))
                        ;;
                    '[B')  # Down arrow
                        selected=$(( (selected + 1) % ${#options[@]} ))
                        ;;
                esac
                ;;
            '')  # Enter key
                if [ $selected -eq 0 ]; then
                    echo -e "\n${GREEN}✅ Proceeding with cleanup...${NC}"
                    return 0
                else
                    echo -e "\n${BLUE}❌ Cleanup cancelled.${NC}"
                    exit 0
                fi
                ;;
            $'\x03')  # Ctrl+C
                echo -e "\n${BLUE}❌ Cleanup cancelled.${NC}"
                exit 0
                ;;
        esac
    done
}

show_confirmation_menu

if [[ $? -eq 0 ]]; then
    echo -e "${BLUE}Cleaning up database in reverse order...${NC}"
    
    # Get list of all tables first
    echo "1. Getting list of all tables..."
    tables_info=$(surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome --json <<< "INFO FOR DB;" 2>/dev/null)
    
    # Extract table names and remove them in reverse order
    # Common tables to remove (in reverse dependency order)
    tables_to_remove=(
        "user_dance_style"
        "vlog" 
        "chat"
        "user"
        "group"
        "country"
        "migration_history"
        "health_check"
    )
    
    for table in "${tables_to_remove[@]}"; do
        echo "Removing $table table..."
        surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome <<< "REMOVE TABLE $table;" 2>/dev/null || echo "   $table table didn't exist"
    done
    
    echo -e "${GREEN}Database cleanup complete!${NC}"
fi