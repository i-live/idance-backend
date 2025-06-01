-- migrations/0005_social_interactions_down.surql
-- Social Interactions Teardown: Remove social relationship tables

-- Remove social interaction tables
REMOVE TABLE block;
REMOVE TABLE follow;
REMOVE TABLE friendship;