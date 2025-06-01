-- migrations/0003_core_users_down.surql
-- Core Users Teardown: Remove user, profile, and device tables
-- WARNING: This will remove all user data!

-- ########################################################
-- Core Users Teardown
-- ########################################################

-- Remove user-related tables
REMOVE TABLE device;
REMOVE TABLE profile;
REMOVE TABLE user;