-- migrations/0004_social_interactions.surql
-- Social Interactions: User Relationships, Follows, Swipes, and Matches
-- This migration creates tables for social features and user interactions
-- Requires: 0003_core_users.surql, 0004_lookup_tables.surql

-- ########################################################
-- User Association Tables
-- ########################################################

-- User Dance Style Association
-- Links users to dance styles with proficiency
DEFINE TABLE user_dance_style SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id OR $access = 'backend_worker'
        FOR create, update, delete WHERE user = $auth.id OR $access = 'backend_worker';

DEFINE FIELD user ON user_dance_style TYPE record<user>;
DEFINE FIELD dance_style ON user_dance_style TYPE record<dance_style>;
DEFINE FIELD proficiency ON user_dance_style TYPE string DEFAULT 'beginner' ASSERT $value IN ['beginner', 'intermediate', 'advanced', 'professional'];
DEFINE FIELD years_experience ON user_dance_style TYPE option<int>;
DEFINE FIELD created_at ON user_dance_style TYPE datetime DEFAULT time::now();

DEFINE INDEX user_dance_style_user_style ON user_dance_style FIELDS user, dance_style UNIQUE;
DEFINE INDEX user_dance_style_user ON user_dance_style FIELDS user;

-- User Interest Association
-- Links users to interests
DEFINE TABLE user_interest SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user = $auth.id OR $access = 'backend_worker'
        FOR create, update, delete WHERE user = $auth.id OR $access = 'backend_worker';

DEFINE FIELD user ON user_interest TYPE record<user>;
DEFINE FIELD interest ON user_interest TYPE record<interest>;
DEFINE FIELD intensity ON user_interest TYPE string DEFAULT 'casual' ASSERT $value IN ['casual', 'moderate', 'passionate'];
DEFINE FIELD created_at ON user_interest TYPE datetime DEFAULT time::now();

DEFINE INDEX user_interest_user_interest ON user_interest FIELDS user, interest UNIQUE;
DEFINE INDEX user_interest_user ON user_interest FIELDS user;

-- ########################################################
-- Social Relationship Tables
-- ########################################################

-- Follow Relationships
-- Represents user follow relationships
DEFINE TABLE follow SCHEMAFULL
    PERMISSIONS
        FOR select WHERE follower = $auth.id OR following = $auth.id OR $access = 'backend_worker'
        FOR create, delete WHERE follower = $auth.id OR $access = 'backend_worker'
        FOR update WHERE $access = 'backend_worker';

DEFINE FIELD follower ON follow TYPE record<user>;
DEFINE FIELD following ON follow TYPE record<user>;
DEFINE FIELD created_at ON follow TYPE datetime DEFAULT time::now();

DEFINE INDEX follow_follower_following ON follow FIELDS follower, following UNIQUE;
DEFINE INDEX follow_follower ON follow FIELDS follower;
DEFINE INDEX follow_following ON follow FIELDS following;

-- User Referrals
-- Tracks user referrals
DEFINE TABLE referred SCHEMAFULL
    PERMISSIONS
        FOR select WHERE referrer = $auth.id OR referred_user = $auth.id OR $access = 'backend_worker'
        FOR create WHERE $access IN ['username_password', 'oauth', 'backend_worker']
        FOR update, delete WHERE $access = 'backend_worker';

DEFINE FIELD referrer ON referred TYPE record<user>;
DEFINE FIELD referred_user ON referred TYPE record<user>;
DEFINE FIELD referral_code ON referred TYPE option<string>;
DEFINE FIELD reward_claimed ON referred TYPE bool DEFAULT false;
DEFINE FIELD created_at ON referred TYPE datetime DEFAULT time::now();

DEFINE INDEX referred_referrer ON referred FIELDS referrer;
DEFINE INDEX referred_user ON referred FIELDS referred_user;
DEFINE INDEX referred_code ON referred FIELDS referral_code;

-- ########################################################
-- Dating/Matching Tables
-- ########################################################

-- User Swipes
-- Records user swipes (like, dislike, superlike)
DEFINE TABLE swipe SCHEMAFULL
    PERMISSIONS
        FOR select WHERE swiper = $auth.id OR $access = 'backend_worker'
        FOR create WHERE swiper = $auth.id OR $access = 'backend_worker'
        FOR update, delete WHERE $access = 'backend_worker';

DEFINE FIELD swiper ON swipe TYPE record<user>;
DEFINE FIELD swiped ON swipe TYPE record<user>;
DEFINE FIELD swipe_type ON swipe TYPE string ASSERT $value IN ['like', 'dislike', 'superlike'];
DEFINE FIELD created_at ON swipe TYPE datetime DEFAULT time::now();

DEFINE INDEX swipe_swiper_swiped ON swipe FIELDS swiper, swiped UNIQUE;
DEFINE INDEX swipe_swiper ON swipe FIELDS swiper;
DEFINE INDEX swipe_swiped ON swipe FIELDS swiped;

-- Matches
-- Represents mutual likes
DEFINE TABLE match SCHEMAFULL
    PERMISSIONS
        FOR select WHERE user1 = $auth.id OR user2 = $auth.id OR $access = 'backend_worker'
        FOR create WHERE $access = 'backend_worker'
        FOR update, delete WHERE $access = 'backend_worker';

DEFINE FIELD user1 ON match TYPE record<user>;
DEFINE FIELD user2 ON match TYPE record<user>;
DEFINE FIELD matched_at ON match TYPE datetime DEFAULT time::now();
DEFINE FIELD is_active ON match TYPE bool DEFAULT true;

DEFINE INDEX match_users ON match FIELDS user1, user2 UNIQUE;
DEFINE INDEX match_user1 ON match FIELDS user1;
DEFINE INDEX match_user2 ON match FIELDS user2;
DEFINE INDEX match_active ON match FIELDS is_active, matched_at;