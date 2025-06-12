-- migrations/0008_groups_sites_down.surql
-- Groups & Sites Teardown: Remove group and site tables

-- Remove indexes first
REMOVE INDEX IF EXISTS content_block_site ON TABLE content_block;
REMOVE INDEX IF EXISTS site_domain ON TABLE site;
REMOVE INDEX IF EXISTS site_slug ON TABLE site;
REMOVE INDEX IF EXISTS site_owner_group ON TABLE site;
REMOVE INDEX IF EXISTS site_owner ON TABLE site;
REMOVE INDEX IF EXISTS group_member_user ON TABLE group_member;
REMOVE INDEX IF EXISTS group_member_group ON TABLE group_member;
REMOVE INDEX IF EXISTS group_member_user_group ON TABLE group_member;
REMOVE INDEX IF EXISTS group_public ON TABLE group;
REMOVE INDEX IF EXISTS group_location ON TABLE group;
REMOVE INDEX IF EXISTS group_type ON TABLE group;
REMOVE INDEX IF EXISTS group_name ON TABLE group;

-- Remove tables in correct dependency order
REMOVE TABLE IF EXISTS content_block;
REMOVE TABLE IF EXISTS site;
REMOVE TABLE IF EXISTS group_member;
REMOVE TABLE IF EXISTS group;