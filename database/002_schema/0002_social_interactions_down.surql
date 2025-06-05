-- migrations/0005_social_interactions_down.surql
-- Social Interactions Teardown: Remove all social interaction tables and indexes

-- Remove match indexes
REMOVE INDEX IF EXISTS match_active ON TABLE match;
REMOVE INDEX IF EXISTS match_user2 ON TABLE match;
REMOVE INDEX IF EXISTS match_user1 ON TABLE match;
REMOVE INDEX IF EXISTS match_users ON TABLE match;

-- Remove swipe indexes
REMOVE INDEX IF EXISTS swipe_swiped ON TABLE swipe;
REMOVE INDEX IF EXISTS swipe_swiper ON TABLE swipe;
REMOVE INDEX IF EXISTS swipe_swiper_swiped ON TABLE swipe;

-- Remove referred indexes
REMOVE INDEX IF EXISTS referred_code ON TABLE referred;
REMOVE INDEX IF EXISTS referred_user ON TABLE referred;
REMOVE INDEX IF EXISTS referred_referrer ON TABLE referred;

-- Remove follow indexes
REMOVE INDEX IF EXISTS follow_following ON TABLE follow;
REMOVE INDEX IF EXISTS follow_follower ON TABLE follow;
REMOVE INDEX IF EXISTS follow_follower_following ON TABLE follow;

-- Remove user interest indexes
REMOVE INDEX IF EXISTS user_interest_user ON TABLE user_interest;
REMOVE INDEX IF EXISTS user_interest_user_interest ON TABLE user_interest;

-- Remove user dance style indexes
REMOVE INDEX IF EXISTS user_dance_style_user ON TABLE user_dance_style;
REMOVE INDEX IF EXISTS user_dance_style_user_style ON TABLE user_dance_style;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS match;
REMOVE TABLE IF EXISTS swipe;
REMOVE TABLE IF EXISTS referred;
REMOVE TABLE IF EXISTS follow;
REMOVE TABLE IF EXISTS user_interest;
REMOVE TABLE IF EXISTS user_dance_style;