#!/bin/bash

# Install surrealdb-migrations CLI
# This script ensures the surrealdb-migrations CLI is available

set -e

echo "🔧 Installing surrealdb-migrations CLI..."

# Check if surrealdb-migrations is already installed
if command -v surrealdb-migrations &> /dev/null; then
    echo "✅ surrealdb-migrations is already installed!"
    surrealdb-migrations --version
    exit 0
fi

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo (Rust) is required but not installed."
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Install surrealdb-migrations
echo "📦 Installing surrealdb-migrations via cargo..."
cargo install surrealdb-migrations

echo "✅ surrealdb-migrations installed successfully!"
echo "🚀 You can now run: pnpm db:migrate"