#!/bin/bash

# Test the alternative surrealdb-migrate-cli tool
set -e

echo "🧪 Testing alternative: surrealdb-migrate-cli..."

# Install the alternative tool
echo "📦 Installing surrealdb-migrate-cli..."
cargo install surrealdb-migrate-cli

echo ""
echo "🔧 Version check:"
surmig --version

echo ""
echo "📋 Available commands:"
surmig help

echo ""
echo "✅ Alternative tool installed and ready!"