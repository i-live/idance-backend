-- migrations/0001_migration_tracking_down.surql
-- Migration Tracking Teardown: Remove migration tracking table
-- WARNING: This will remove all migration history!

-- ########################################################
-- Migration Tracking Teardown
-- ########################################################

-- Remove all data and table
REMOVE TABLE migration_history;