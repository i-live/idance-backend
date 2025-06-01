#!/bin/bash
echo "Checking SurrealDB CLI version..."
surreal version

echo ""
echo "Checking available sql command options..."
surreal sql --help