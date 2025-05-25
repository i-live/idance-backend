-- migrations/0001_authentication.surql
-- Authentication: Access Methods and Security Functions
-- This migration sets up SurrealDB v2.0 authentication with JWT tokens
-- Requires: 0000_namespace_database.surql

-- ########################################################
-- Authentication Access Methods
-- ########################################################

-- User Authentication Access (SurrealDB v2.0 RECORD-based with enhanced features)
-- Supports both traditional email/password and OAuth authentication
DEFINE ACCESS user ON DATABASE TYPE RECORD
    WITH JWT ALGORITHM HS256 KEY '${SURREALDB_JWT_SECRET}'
    
    -- Signup logic for new users (email/password)
    SIGNUP (
        CREATE user SET
            email = $email,
            password = IF $password != NONE THEN crypto::argon2::generate($password) ELSE NONE END,
            oauth_providers = IF $oauth_providers != NONE THEN $oauth_providers ELSE [] END,
            username = $username,
            first_name = $first_name,
            last_name = $last_name,
            user_status = 'pending_waitlist_approval',
            user_tier = 'basic',
            created_at = time::now(),
            updated_at = time::now()
    )
    
    -- Signin logic for existing users (email/password)
    SIGNIN (
        SELECT * FROM user WHERE
            email = $email AND password != NONE AND crypto::argon2::compare(password, $password)
    )
    
    -- Enhanced authentication with user status validation
    AUTHENTICATE {
        IF $auth.id {
            -- Verify user is still active and update last_active_at
            LET $user = SELECT * FROM user WHERE id = $auth.id;
            IF $user AND $user[0].user_status = 'active' {
                UPDATE user SET last_active_at = time::now() WHERE id = $auth.id;
                RETURN $auth.id;
            } ELSE IF $user AND $user[0].user_status != 'active' {
                THROW "User account is " + $user[0].user_status;
            } ELSE {
                THROW "User not found";
            };
        } ELSE IF $token.email {
            -- For JWT tokens with email claims (NextAuth.js integration)
            LET $user = SELECT * FROM user WHERE email = $token.email AND user_status = 'active';
            IF $user {
                UPDATE user SET last_active_at = time::now() WHERE email = $token.email;
                RETURN $user[0];
            } ELSE {
                THROW "User not found or inactive";
            };
        };
    }
    
    -- Set token and session durations
    DURATION FOR TOKEN 1h, FOR SESSION 12h
;

-- OAuth Authentication Access (separate access method for OAuth flows)
DEFINE ACCESS oauth ON DATABASE TYPE RECORD
    WITH JWT ALGORITHM HS256 KEY '${SURREALDB_JWT_SECRET}'
    
    -- OAuth signup - creates user if doesn't exist, links if exists
    SIGNUP (
        LET $existing = SELECT * FROM user WHERE oauth_providers[?provider = $provider].id = $provider_id;
        IF $existing {
            RETURN $existing[0];
        } ELSE {
            CREATE user SET
                email = $email,
                oauth_providers = [{
                    provider: $provider,
                    id: $provider_id,
                    email: $email,
                    name: $name,
                    picture: $picture
                }],
                username = $email,
                first_name = $first_name,
                last_name = $last_name,
                user_status = 'pending_waitlist_approval',
                user_tier = 'basic',
                created_at = time::now(),
                updated_at = time::now()
        };
    )
    
    -- OAuth signin
    SIGNIN (
        SELECT * FROM user WHERE oauth_providers[?provider = $provider].id = $provider_id
    )
    
    AUTHENTICATE {
        IF $auth.id {
            LET $user = SELECT * FROM user WHERE id = $auth.id;
            IF $user AND $user[0].user_status = 'active' {
                UPDATE user SET last_active_at = time::now() WHERE id = $auth.id;
                RETURN $auth.id;
            } ELSE {
                THROW "OAuth user account is not active";
            };
        };
    }
    
    DURATION FOR TOKEN 1h, FOR SESSION 12h
;

-- Worker Authentication Access
-- For Cloudflare Workers to access the database
DEFINE ACCESS worker ON DATABASE TYPE JWT
    WITH ALGORITHM HS256 KEY '${SURREALDB_WORKER_JWT_SECRET}'
    DURATION FOR TOKEN 24h
;

-- ########################################################
-- Authentication Utility Functions
-- ########################################################

-- Legacy functions for backward compatibility (can be removed after migration)
DEFINE FUNCTION fn::signup($email: string, $password: string, $oauth_providers: array, $username: string, $first_name: string, $last_name: string) {
    CREATE user SET
        email = $email,
        password = IF $password != NONE THEN crypto::argon2::generate($password) ELSE NONE END,
        oauth_providers = $oauth_providers,
        username = $username,
        first_name = $first_name,
        last_name = $last_name,
        user_status = 'pending_waitlist_approval',
        user_tier = 'basic',
        created_at = time::now(),
        updated_at = time::now()
};

DEFINE FUNCTION fn::signin($email: string, $password: string, $provider: string, $provider_id: string) {
    SELECT * FROM user WHERE
        (email = $email AND password != NONE AND crypto::argon2::compare(password, $password)) OR
        (oauth_providers[?provider = $provider].id = $provider_id)
};

-- Enhanced utility functions
DEFINE FUNCTION fn::validate_user_access($user_id: record<user>) {
    LET $user = SELECT * FROM user WHERE id = $user_id;
    IF !$user {
        THROW "User not found";
    };
    IF $user[0].user_status != 'active' {
        THROW "User account is " + $user[0].user_status;
    };
    RETURN $user[0];
};

DEFINE FUNCTION fn::cleanup_expired_sessions() {
    DELETE user_session WHERE expires_at < time::now() OR is_active = false;
};