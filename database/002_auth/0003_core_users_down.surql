-- migrations/0003_core_users_down.surql
-- Core Users Teardown: Remove user, profile, and device tables
-- WARNING: This will remove all user data!

-- ########################################################
-- Core Users Teardown
-- ########################################################

-- Remove device indexes
REMOVE INDEX IF EXISTS device_active ON TABLE device;
REMOVE INDEX IF EXISTS device_token ON TABLE device;
REMOVE INDEX IF EXISTS device_user ON TABLE device;

-- Remove profile indexes
REMOVE INDEX IF EXISTS profile_deleted_at ON TABLE profile;
REMOVE INDEX IF EXISTS profile_updated_at ON TABLE profile;
REMOVE INDEX IF EXISTS profile_created_at ON TABLE profile;
REMOVE INDEX IF EXISTS profile_vlog_embedding ON TABLE profile;
REMOVE INDEX IF EXISTS profile_age ON TABLE profile;
REMOVE INDEX IF EXISTS profile_location ON TABLE profile;
REMOVE INDEX IF EXISTS profile_user ON TABLE profile;

-- Remove user indexes
REMOVE INDEX IF EXISTS user_deleted_at ON TABLE user;
REMOVE INDEX IF EXISTS user_updated_at ON TABLE user;
REMOVE INDEX IF EXISTS user_created_at ON TABLE user;
REMOVE INDEX IF EXISTS user_active ON TABLE user;
REMOVE INDEX IF EXISTS user_tier ON TABLE user;
REMOVE INDEX IF EXISTS user_status ON TABLE user;
REMOVE INDEX IF EXISTS user_username ON TABLE user;
REMOVE INDEX IF EXISTS user_email ON TABLE user;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS device;
REMOVE TABLE IF EXISTS profile;
REMOVE TABLE IF EXISTS user;