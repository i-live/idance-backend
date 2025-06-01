-- migrations/0002_authentication_down.surql
-- Authentication System Teardown: Remove authentication tables and access methods
-- WARNING: This will remove all authentication data!

-- ########################################################
-- Authentication System Teardown
-- ########################################################

-- Remove access methods
REMOVE ACCESS METHOD username_password ON NAMESPACE;
REMOVE ACCESS METHOD oauth ON NAMESPACE;

-- Remove authentication tables (if they exist)
-- Note: The actual tables are defined in the up migration
-- This is a placeholder - specific teardown logic should be added based on what was created

-- TODO: Add specific REMOVE statements for tables/fields created in 0002_authentication_up.surql
-- Example:
-- REMOVE TABLE user_session;
-- REMOVE TABLE user_verification;
-- REMOVE TABLE user_oauth_account;