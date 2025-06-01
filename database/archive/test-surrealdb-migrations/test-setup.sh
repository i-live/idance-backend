#!/bin/bash

# Test surrealdb-migrations with a small example
set -e

echo "🧪 Testing surrealdb-migrations CLI..."

# Check if surrealdb-migrations is installed
if ! command -v surrealdb-migrations &> /dev/null; then
    echo "📦 Installing surrealdb-migrations..."
    cargo install surrealdb-migrations
else
    echo "✅ surrealdb-migrations already installed"
fi

echo ""
echo "🔧 Version check:"
surrealdb-migrations --version

echo ""
echo "📋 Available commands:"
surrealdb-migrations --help

echo ""
echo "🏗️  Scaffolding test project..."
surrealdb-migrations scaffold template empty

echo ""
echo "📁 Created files:"
find . -type f -name "*.surql" -o -name "*.toml" | head -10