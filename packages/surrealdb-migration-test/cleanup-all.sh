#!/bin/bash

echo "🧹 Cleaning up test directory..."

# Remove all unnecessary files
rm -f test-runner.mjs
rm -f TEST_RESULTS.md
rm -f install-and-test.js
rm -f run-test.js
rm -f install.sh
rm -f check-install.mjs
rm -f setup-and-test.js
rm -f direct-test.mjs
rm -f README.md
rm -f SOLUTION.md
rm -f project.json
rm -f tsconfig.json
rm -rf src/

echo "✅ Cleanup complete!"
echo ""
echo "Keeping only essential files:"
echo "  - package.json (dependencies)"
echo "  - test-surrealdb-migration.mjs (main test)"
echo "  - run-test.sh (test runner)"
echo "  - IMPLEMENTATION_PLAN.md (implementation guide)"
echo "  - FINAL_SOLUTION.md (final solution)"
echo ""
ls -la