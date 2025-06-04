-- migrations/0004_migration_tracking_down.surql
-- Migration Tracking: Remove the migration_history table

-- Remove indexes
REMOVE INDEX IF EXISTS migration_history_applied_at ON migration_history;
REMOVE INDEX IF NOT EXISTS migration_history_name ON migration_history;

-- Remove the migration_history table
REMOVE TABLE IF EXISTS migration_history;