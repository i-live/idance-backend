-- migrations/0001_migration_tracking_up.surql
-- Migration Tracking: Create table to track applied migrations
-- This enables proper migration state management per database

-- ########################################################
-- Migration Tracking Table
-- ########################################################

-- Create the migration_history table to track applied migrations
DEFINE TABLE IF NOT EXISTS migration_history SCHEMAFULL;

-- Migration tracking fields
DEFINE FIELD IF NOT EXISTS number ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS name ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS direction ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS filename ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS path ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS content ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS checksum ON migration_history TYPE option<string>;

DEFINE FIELD IF NOT EXISTS namespace ON migration_history TYPE string DEFAULT session::ns();
DEFINE FIELD IF NOT EXISTS database ON migration_history TYPE string DEFAULT session::db();

DEFINE FIELD IF NOT EXISTS applied_at ON migration_history TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS applied_by ON migration_history TYPE option<string>;
DEFINE FIELD IF NOT EXISTS execution_time_ms ON migration_history TYPE option<int>;

-- Create indexes for the migration_history table
DEFINE INDEX IF NOT EXISTS migration_history_applied_at ON migration_history FIELDS applied_at;
DEFINE INDEX IF NOT EXISTS migration_history_name ON migration_history FIELDS name;
