#!/bin/bash

# Install surrealdb-migrations CLI tool
echo "🚀 Installing surrealdb-migrations CLI..."

# Install the CLI tool
cargo install surrealdb-migrations

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Initialize the migration project: surrealdb-migrations scaffold template empty"
echo "2. Configure connection settings"
echo "3. Convert existing migrations to the new format"
echo ""
echo "🔧 Verify installation:"
surrealdb-migrations --help