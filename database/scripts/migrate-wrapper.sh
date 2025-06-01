#!/bin/bash

# Simple wrapper script to handle migration arguments
# This allows us to pass arguments through pnpm/nx more easily

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/run-migration.sh"

# Default values
MIGRATION_NUMBER=""
DIRECTION="up"
FORCE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --migration|-m)
            MIGRATION_NUMBER="$2"
            shift 2
            ;;
        --down|-d)
            DIRECTION="down"
            shift
            ;;
        --force|-f)
            FORCE="--force"
            shift
            ;;
        --help|-h)
            echo "Migration Wrapper Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -m, --migration NUMBER   Run specific migration (e.g., 0001, 0005)"
            echo "  -d, --down               Run down migration (rollback)"
            echo "  -f, --force              Force re-run migrations"
            echo "  -h, --help               Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                       # Run all up migrations"
            echo "  $0 -m 0003               # Run migration 0003 up"
            echo "  $0 -m 0003 -d            # Rollback migration 0003"
            echo "  $0 -f                    # Force re-run all migrations"
            echo "  $0 -m 0005 -f            # Force re-run migration 0005"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build command
CMD="$MIGRATION_SCRIPT"

if [[ -n "$MIGRATION_NUMBER" ]]; then
    CMD="$CMD --migration $MIGRATION_NUMBER"
fi

if [[ "$DIRECTION" == "down" ]]; then
    CMD="$CMD --down"
fi

if [[ -n "$FORCE" ]]; then
    CMD="$CMD $FORCE"
fi

# Execute the command
echo "Executing: $CMD"
exec $CMD