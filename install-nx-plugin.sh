#!/bin/bash

echo "📦 Installing Nx Plugin dependencies..."
pnpm add -D @nx/plugin @nx/devkit

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🚀 Creating Nx SurrealDB Migrations Plugin..."
nx g @nx/plugin:plugin nx-surrealdb-migrations --directory=packages/nx-surrealdb-migrations