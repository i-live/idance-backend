-- migrations/0006_messaging_down.surql
-- Messaging System Teardown: Remove messaging tables

-- Remove messaging tables
REMOVE TABLE conversation_participant;
REMOVE TABLE message;
REMOVE TABLE conversation;