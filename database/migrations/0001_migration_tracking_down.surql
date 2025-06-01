-- migrations/0001_migration_tracking_down.surql
-- Migration Tracking Teardown: Remove migration tracking table
-- WARNING: This will remove all migration history!

-- ########################################################
-- Migration Tracking Teardown
-- ########################################################

-- Remove the migration_history table and all its data
REMOVE TABLE migration_history;