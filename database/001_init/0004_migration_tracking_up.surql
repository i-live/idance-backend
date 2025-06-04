-- migrations/0004_migration_tracking_up.surql
-- Migration Tracking: Create table to track applied migrations
-- This enables proper migration state management per database

-- ########################################################
-- Migration Tracking Table
-- ########################################################

-- Create the migration_history table to track applied migrations
DEFINE TABLE IF NOT EXISTS migration_history SCHEMAFULL;

-- Migration tracking fields (remove IF NOT EXISTS to ensure fields are defined)
DEFINE FIELD migration_number ON migration_history TYPE string;
DEFINE FIELD migration_name ON migration_history TYPE string;
DEFINE FIELD migration_file ON migration_history TYPE string;
DEFINE FIELD migration_path ON migration_history TYPE string;
DEFINE FIELD namespace ON migration_history TYPE string;
DEFINE FIELD database ON migration_history TYPE string;
DEFINE FIELD direction ON migration_history TYPE string ASSERT $value IN ['up', 'down'];
DEFINE FIELD applied_at ON migration_history TYPE datetime DEFAULT time::now();
DEFINE FIELD applied_by ON migration_history TYPE string;
DEFINE FIELD checksum ON migration_history TYPE option<string>;
DEFINE FIELD execution_time_ms ON migration_history TYPE option<int>;
DEFINE FIELD content ON migration_history TYPE string;

-- Create indexes for the migration_history table
DEFINE INDEX IF NOT EXISTS migration_history_applied_at ON migration_history FIELDS applied_at;
DEFINE INDEX IF NOT EXISTS migration_history_name ON migration_history FIELDS migration_name;