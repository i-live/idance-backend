-- migrations/0001_authentication.surql
-- Authentication: Access Methods and Security Functions
-- This migration sets up SurrealDB v2.0 authentication with JWT tokens
-- Requires: 0000_namespace_database.surql

-- ########################################################
-- Authentication Access Methods
-- ########################################################

-- User Authentication Access (SurrealDB v2.0 RECORD-based with JWT support)
-- Supports both traditional email/password and OAuth authentication with NextAuth.js integration
DEFINE ACCESS user ON DATABASE TYPE RECORD
    SIGNUP (
        CREATE user SET
            email = $email,
            password = $password AND crypto::argon2::generate($password),
            oauth_providers = $oauth_providers OR [],
            username = $username,
            first_name = $first_name,
            last_name = $last_name,
            user_status = 'pending_waitlist_approval',
            user_tier = 'basic',
            created_at = time::now(),
            updated_at = time::now()
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
                username = $username OR $email,
                first_name = $first_name,
                last_name = $last_name,
                user_status = 'pending_waitlist_approval',
                user_tier = 'basic',
                created_at = time::now(),
                updated_at = time::now()
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

-- Worker Authentication Access (for Cloudflare Workers - system level)
-- This one correctly uses TYPE JWT since workers need system-level access
DEFINE ACCESS worker ON DATABASE TYPE JWT
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