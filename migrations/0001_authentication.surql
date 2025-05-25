-- migrations/0001_authentication.surql
-- Authentication: Access Methods and Security Functions
-- This migration sets up SurrealDB v2.0 authentication with JWT tokens
-- Requires: 0000_namespace_database.surql

-- ########################################################
-- Authentication Access Methods
-- ########################################################

-- Username/Password Authentication Access (SurrealDB v2.0 RECORD-based with JWT support)
-- Handles traditional email/password authentication with NextAuth.js integration
DEFINE ACCESS username_password ON DATABASE TYPE RECORD
    SIGNUP (
        -- Check if user with same email already exists
        LET $existing = SELECT * FROM user WHERE email = $email;
        IF $existing {
            -- Add password to existing user (likely OAuth-only user adding email/password)
            UPDATE user SET
                password = $password AND crypto::argon2::generate($password),
                username = $username OR username,
                first_name = $first_name OR first_name,
                last_name = $last_name OR last_name,
                updated_at = time::now()
            WHERE email = $email;
            RETURN $existing[0];
        } ELSE {
            -- Create new user with email/password
            CREATE user SET
                email = $email,
                password = $password AND crypto::argon2::generate($password),
                oauth_providers = [],
                username = $username OR string::split($email, '@')[0],
                first_name = $first_name OR '',
                last_name = $last_name OR '',
                user_status = 'pending_waitlist_approval',
                user_tier = 'basic',
                created_at = time::now(),
                updated_at = time::now()
        };
    )
    SIGNIN (
        SELECT * FROM user WHERE
            email = $email AND password != NONE AND crypto::argon2::compare(password, $password)
    )
    WITH JWT ALGORITHM HS256 KEY '${SURREALDB_JWT_SECRET}'
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
    DURATION FOR TOKEN 1h, FOR SESSION 12h
;

-- OAuth Authentication Access (separate access method for OAuth flows)
DEFINE ACCESS oauth ON DATABASE TYPE RECORD
    SIGNUP (
        -- First check if OAuth provider account already exists
        LET $existing_oauth = SELECT * FROM user WHERE oauth_providers[?provider = $provider].id = $provider_id;
        IF $existing_oauth {
            RETURN $existing_oauth[0];
        } ELSE {
            -- Check if user with same email already exists (prevent duplicates)
            LET $existing_email = SELECT * FROM user WHERE email = $email;
            IF $existing_email {
                -- Link OAuth provider to existing user
                UPDATE user SET oauth_providers += [{
                    provider: $provider,
                    id: $provider_id,
                    email: $email,
                    name: $name,
                    picture: $picture,
                    linked_at: time::now()
                }] WHERE email = $email;
                RETURN $existing_email[0];
            } ELSE {
                -- Create new user with OAuth data
                CREATE user SET
                    email = $email,
                    oauth_providers = [{
                        provider: $provider,
                        id: $provider_id,
                        email: $email,
                        name: $name,
                        picture: $picture
                    }],
                    username = $username OR string::split($email, '@')[0],
                    first_name = $first_name OR string::split($name OR '', ' ')[0] OR '',
                    last_name = $last_name OR string::split($name OR '', ' ')[1] OR '',
                    user_status = 'pending_waitlist_approval',
                    user_tier = 'basic',
                    created_at = time::now(),
                    updated_at = time::now()
            };
        };
    )
    SIGNIN (
        SELECT * FROM user WHERE oauth_providers[?provider = $provider].id = $provider_id
    )
    WITH JWT ALGORITHM HS256 KEY '${SURREALDB_JWT_SECRET}'
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

-- Backend Worker Authentication Access (for Cloudflare Workers - system level)
-- This one correctly uses TYPE JWT since workers need system-level access
DEFINE ACCESS backend_worker ON DATABASE TYPE JWT
    ALGORITHM HS256 KEY '${SURREALDB_WORKER_JWT_SECRET}'
    DURATION FOR TOKEN 24h
;

-- ########################################################
-- Authentication Utility Functions
-- ########################################################

-- Utility function to validate user access and status
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

-- Utility function to link OAuth provider to existing user
DEFINE FUNCTION fn::link_oauth_provider($user_id: record<user>, $provider: string, $provider_id: string, $email: string, $name: string, $picture: string) {
    -- Check if provider is already linked
    LET $user = SELECT * FROM user WHERE id = $user_id;
    IF !$user {
        THROW "User not found";
    };
    
    -- Check if this OAuth account is already linked to another user
    LET $existing = SELECT * FROM user WHERE oauth_providers[?provider = $provider].id = $provider_id AND id != $user_id;
    IF $existing {
        THROW "OAuth account already linked to another user";
    };
    
    -- Add OAuth provider to user's oauth_providers array
    UPDATE user SET oauth_providers += [{
        provider: $provider,
        id: $provider_id,
        email: $email,
        name: $name,
        picture: $picture,
        linked_at: time::now()
    }] WHERE id = $user_id;
    
    RETURN true;
};

-- Utility function to unlink OAuth provider from user
DEFINE FUNCTION fn::unlink_oauth_provider($user_id: record<user>, $provider: string) {
    LET $user = SELECT * FROM user WHERE id = $user_id;
    IF !$user {
        THROW "User not found";
    };
    
    -- Remove the OAuth provider from the array
    UPDATE user SET oauth_providers = array::filter(oauth_providers, |$p| $p.provider != $provider) WHERE id = $user_id;
    
    RETURN true;
};