#!/bin/bash

echo "🔍 Debugging surrealdb-migrations structure..."

echo ""
echo "📁 Current directory structure:"
find . -type f | sort

echo ""
echo "📋 Configuration file:"
cat .surrealdb

echo ""
echo "🔧 Trying to understand what surrealdb-migrations expects..."
surrealdb-migrations --help

echo ""
echo "📖 Let's try to see what templates are available:"
surrealdb-migrations scaffold --help

echo ""
echo "🧪 Let's try a fresh scaffold in a new directory:"
mkdir -p fresh-test
cd fresh-test
surrealdb-migrations scaffold template empty
echo "Fresh scaffold structure:"
find . -type f | sort