-- migrations/0001_migration_tracking_up.surql
-- Migration Tracking: Create table to track applied migrations
-- This enables proper migration state management per database

-- ########################################################
-- Migration Tracking Table
-- ########################################################

-- Create the migration_history table to track applied migrations
DEFINE TABLE IF NOT EXISTS migration_history SCHEMAFULL;

-- Migration tracking fields
DEFINE FIELD IF NOT EXISTS migration_number ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS migration_name ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS migration_file ON migration_history TYPE string;
DEFINE FIELD IF NOT EXISTS applied_at ON migration_history TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS applied_by ON migration_history TYPE option<string>;
DEFINE FIELD IF NOT EXISTS checksum ON migration_history TYPE option<string>;
DEFINE FIELD IF NOT EXISTS execution_time_ms ON migration_history TYPE option<int>;

-- Create indexes for the migration_history table
DEFINE INDEX IF NOT EXISTS migration_history_number ON migration_history FIELDS migration_number UNIQUE;
DEFINE INDEX IF NOT EXISTS migration_history_applied_at ON migration_history FIELDS applied_at;
DEFINE INDEX IF NOT EXISTS migration_history_name ON migration_history FIELDS migration_name;

-- Check if initial record exists
LET $exists = (SELECT VALUE count() FROM migration_history WHERE migration_number = "0004")[0];
IF $exists == 0 THEN
    CREATE migration_history:0004 SET 
        migration_number = "0004",
        migration_name = "migration_tracking",
        migration_file = "0004_migration_tracking_up.surql",
        applied_at = time::now(),
        applied_by = "migration_script",
        checksum = "initial",
        execution_time_ms = 0;
END;