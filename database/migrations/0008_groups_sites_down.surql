-- migrations/0008_groups_sites_down.surql
-- Groups & Sites Teardown: Remove group and site tables

-- Remove groups and sites tables
REMOVE TABLE site_member;
REMOVE TABLE site;
REMOVE TABLE group_member;
REMOVE TABLE group;