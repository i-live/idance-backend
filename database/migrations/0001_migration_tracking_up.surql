-- migrations/0001_migration_tracking_up.surql
-- Migration Tracking: Create table to track applied migrations
-- This enables proper migration state management per database

-- ########################################################
-- Migration Tracking Table
-- ########################################################

-- Create the migration_history table to track applied migrations
DEFINE TABLE migration_history SCHEMAFULL
    PERMISSIONS
        FOR select, create, update, delete WHERE $access = 'backend_worker' OR $auth.role = 'admin';

-- Migration tracking fields
DEFINE FIELD migration_number ON migration_history TYPE string;
DEFINE FIELD migration_name ON migration_history TYPE string;
DEFINE FIELD migration_file ON migration_history TYPE string;
DEFINE FIELD applied_at ON migration_history TYPE datetime DEFAULT time::now();
DEFINE FIELD applied_by ON migration_history TYPE option<string>;
DEFINE FIELD checksum ON migration_history TYPE option<string>;
DEFINE FIELD execution_time_ms ON migration_history TYPE option<int>;

-- Create indexes for the migration_history table
DEFINE INDEX migration_history_number ON migration_history FIELDS migration_number UNIQUE;
DEFINE INDEX migration_history_applied_at ON migration_history FIELDS applied_at;
DEFINE INDEX migration_history_name ON migration_history FIELDS migration_name;

-- Record this migration as applied
CREATE migration_history:0001 SET
    migration_number = "0001",
    migration_name = "migration_tracking",
    migration_file = "0001_migration_tracking_up.surql",
    applied_at = time::now(),
    applied_by = "migration_script",
    checksum = "initial";