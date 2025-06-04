-- migrations/0000_db_server_init_down.surql
-- Server Teardown: Remove namespace and all databases
-- WARNING: This will destroy ALL data in the namespace!

-- ########################################################
-- Database Server Teardown
-- ########################################################

-- Remove the namespace (this removes everything)
REMOVE NAMESPACE ${SURREALDB_NAMESPACE};