#!/bin/bash

echo "🧪 Running SurrealDB Migration Test"
echo "==================================="
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Run the test
node test-surrealdb-migration.mjs