-- migrations/0002_authentication_down.surql
-- Authentication System Teardown: Remove authentication tables, functions, and access methods

-- ########################################################
-- Authentication System Teardown
-- ########################################################

-- Remove access methods first
REMOVE ACCESS IF EXISTS username_password ON DATABASE;
REMOVE ACCESS IF EXISTS oauth ON DATABASE;
REMOVE ACCESS IF EXISTS backend_worker on DATABASE;

-- Remove functions
REMOVE FUNCTION IF EXISTS fn::validate_username;
REMOVE FUNCTION IF EXISTS fn::validate_email;
REMOVE FUNCTION IF EXISTS fn::validate_password;
REMOVE FUNCTION IF EXISTS fn::generate_verification_code;
REMOVE FUNCTION IF EXISTS fn::generate_random_string;
REMOVE FUNCTION IF EXISTS fn::verify_password;
REMOVE FUNCTION IF EXISTS fn::hash_password;
REMOVE FUNCTION IF EXISTS fn::signup_username_password;
REMOVE FUNCTION IF EXISTS fn::signup_oauth;
REMOVE FUNCTION IF EXISTS fn::validate_user_access;
REMOVE FUNCTION IF EXISTS fn::link_oauth_provider;
REMOVE FUNCTION IF EXISTS fn::unlink_oauth_provider;
REMOVE FUNCTION IF EXISTS fn::soft_delete_user;

-- Remove user_oauth_account indexes
REMOVE INDEX IF EXISTS oauth_provider_id ON TABLE user_oauth_account;
REMOVE INDEX IF EXISTS oauth_user ON TABLE user_oauth_account;

-- Remove user_session indexes
REMOVE INDEX IF EXISTS session_expires ON TABLE user_session;
REMOVE INDEX IF EXISTS session_user ON TABLE user_session;
REMOVE INDEX IF EXISTS session_token ON TABLE user_session;

-- Remove user_verification indexes
REMOVE INDEX IF EXISTS verification_expires ON TABLE user_verification;
REMOVE INDEX IF EXISTS verification_user ON TABLE user_verification;
REMOVE INDEX IF EXISTS verification_code ON TABLE user_verification;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS user_oauth_account;
REMOVE TABLE IF EXISTS user_session;
REMOVE TABLE IF EXISTS user_verification;