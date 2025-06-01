-- migrations/0009_events_triggers_down.surql
-- Events & Triggers Teardown: Remove event tables and triggers

-- Remove events tables
REMOVE TABLE event_participant;
REMOVE TABLE event;

-- TODO: Remove any triggers that were created in the up migration
-- Example:
-- REMOVE EVENT trigger_name ON TABLE table_name;