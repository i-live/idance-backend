# iDance - Database Schema (Implemented on Supabase)

This document details the PostgreSQL database schema for the "iDance" application, hosted on Supabase, reflecting the version implemented as of May 23, 2025. Row Level Security (RLS) is enabled on all tables containing user data.

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ user_roles : has
    users ||--o{ profiles : has
    users ||--o{ group_members : belongs_to
    users ||--o{ media_assets : owns
    users ||--o{ sites : "owns/configures"
    
    roles ||--o{ user_roles : assigned_to
    
    groups ||--o{ group_members : contains
    groups ||--o{ sites : "owns/has"
    groups ||--o{ media_assets : owns
    
    sites ||--o{ content_blocks : contains
    sites ||--o{ site_analytics : tracks
    
    users {
        UUID id PK "Auth User ID (from auth.users)"
        TIMESTAMP created_at "From auth.users"
        TIMESTAMP updated_at "From auth.users"
        STRING email "From auth.users"
    }

    profiles {
        UUID user_id PK "FK to auth.users.id"
        TEXT username UK "For username.idance.live, 3-30 chars, slug format"
        TEXT first_name "Not Null"
        TEXT last_name "Not Null"
        DATE date_of_birth "Not Null"
        TEXT gender "Enum type"
        TEXT bio "Max 2000 chars"
        BOOLEAN looking_for_partners "Default false"
        BOOLEAN looking_for_jobs "Default false"
        BOOLEAN looking_for_dancers "Default false"
        UUID referrer_id FK "References auth.users.id"
        TEXT referral_code UK "Unique code"
        TEXT commission_tier "Tier level"
        TEXT profile_status "Status type, default pending_waitlist_approval"
        TEXT profile_picture_url "URL (app-level validation)"
        TEXT user_tier "Account tier, default basic"
        TEXT stripe_customer_id UK "External ID"
        TEXT location_city
        TEXT location_state
        TEXT location_country
        FLOAT8 latitude 
        FLOAT8 longitude 
        TIMESTAMPTZ last_active_at "Default now()"
        TIMESTAMPTZ created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    roles {
        UUID id PK "Default uuid_generate_v4()"
        TEXT name "site_admin|group_admin|pro_user|free_user"
        JSONB permissions "Array of permission strings, default '[]'"
        TIMESTAMP created_at "Default now()"
    }

    user_roles {
        UUID user_id PK,FK "FK to auth.users.id"
        UUID role_id PK,FK "FK to roles.id"
        UUID scope_id FK "Nullable, FK to groups.id for group roles"
        TIMESTAMP granted_at "Default now()"
    }

    groups {
        UUID id PK "Default uuid_generate_v4()"
        TEXT name "Group name, Not Null"
        TEXT type "company|studio|team, Not Null"
        TEXT subdomain UK "For group.idance.live, Not Null"
        TEXT custom_domain UK "Optional custom domain"
        JSONB settings "Group settings, default '{}'"
        TIMESTAMP created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    group_members {
        UUID group_id PK,FK "FK to groups.id"
        UUID user_id PK,FK "FK to auth.users.id"
        TEXT role "owner|admin|member, Not Null"
        TIMESTAMP joined_at "Default now()"
    }

    dance_styles {
        INT id PK "SERIAL"
        TEXT name UK "Style name, Not Null"
        TIMESTAMPTZ created_at "Default now()"
    }

    user_dance_styles {
        UUID user_id PK,FK "FK to profiles.user_id"
        INT style_id PK,FK "FK to dance_styles.id"
        TEXT proficiency_level "Skill level, Not Null"
        TIMESTAMPTZ created_at "Default now()"
    }

    user_awards {
        UUID id PK "Default uuid_generate_v4()"
        UUID user_id FK "FK to profiles.user_id, Not Null"
        TEXT name "Award name, Not Null"
        INT year "Optional"
        TEXT description "Optional"
        TIMESTAMPTZ created_at "Default now()"
    }

    interests {
        INT id PK "SERIAL"
        TEXT name UK "Interest name, Not Null"
        TIMESTAMPTZ created_at "Default now()"
    }

    user_interests {
        UUID user_id PK,FK "FK to profiles.user_id"
        INT interest_id PK,FK "FK to interests.id"
        TIMESTAMPTZ created_at "Default now()"
    }

    social_platforms {
        INT id PK "SERIAL"
        TEXT name UK "Platform name, Not Null"
        TIMESTAMPTZ created_at "Default now()"
    }

    user_social_links {
        UUID id PK "Default uuid_generate_v4()"
        UUID user_id FK "FK to profiles.user_id, Not Null"
        INT platform_id FK "FK to social_platforms.id, Not Null"
        TEXT url "Valid URL (app-level validation), Not Null"
        TIMESTAMPTZ created_at "Default now()"
        CONSTRAINT unique_user_platform_link UNIQUE (user_id, platform_id)
    }

    user_portfolio_items {
        UUID id PK "Default uuid_generate_v4()"
        UUID user_id FK "FK to profiles.user_id, Not Null"
        TEXT item_type "Media type, Not Null"
        TEXT url "Media URL (app-level validation), Not Null"
        TEXT caption "Optional"
        TEXT thumbnail_url "Preview URL (app-level validation)"
        INT display_order "Sorting, default 0"
        TIMESTAMPTZ created_at "Default now()"
    }

    user_search_preferences {
        UUID user_id PK,FK "FK to auth.users.id"
        JSONB discovery_dance_styles "ID array, default '[]'"
        JSONB discovery_skill_levels "Level array, default '[]'"
        INT discovery_min_age "Min 18"
        INT discovery_max_age "Age limit, >= min_age"
        INT discovery_distance_miles "Range, default 50"
        JSONB discovery_gender_preference "Preferences, default '[]'"
        BOOLEAN notifications_enabled "Default true"
        TEXT search_location_city
        TEXT search_location_state
        TEXT search_location_country
        FLOAT8 search_latitude
        FLOAT8 search_longitude
        BOOLEAN use_custom_location "Default false"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    swipes {
        UUID swiper_user_id PK,FK "FK to auth.users.id"
        UUID swiped_user_id PK,FK "FK to auth.users.id"
        TEXT swipe_type "like|dislike|superlike, Not Null"
        TIMESTAMPTZ created_at "Default now()"
        CONSTRAINT check_different_users CHECK (swiper_user_id <> swiped_user_id)
    }

    matches {
        UUID id PK "Default uuid_generate_v4()"
        UUID user1_id FK "FK to auth.users.id, Not Null"
        UUID user2_id FK "FK to auth.users.id, Not Null"
        TIMESTAMPTZ matched_at "Default now()"
        CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id)
        CONSTRAINT check_different_users_match CHECK (user1_id <> user2_id)
        CONSTRAINT check_user_order_match CHECK (user1_id < user2_id)
    }

    chats {
        UUID id PK "Default uuid_generate_v4()"
        UUID match_id UK,FK "FK to matches.id, Not Null"
        UUID last_message_id FK "Nullable, FK to messages.id ON DELETE SET NULL"
        TIMESTAMPTZ last_activity "Default now(), auto-updated by trigger"
    }

    messages {
        UUID id PK "Default uuid_generate_v4()"
        UUID chat_id FK "FK to chats.id, Not Null"
        UUID sender_id FK "FK to auth.users.id, Not Null"
        TEXT content_type "text|image|video|audio, Not Null"
        TEXT content "Body, Not Null"
        TEXT media_url "Optional URL (app-level validation)"
        TIMESTAMPTZ sent_at "Default now()"
    }

    vlogs {
        UUID id PK "Default uuid_generate_v4()"
        UUID user_id FK "FK to auth.users.id, Not Null"
        TEXT post_type "text|image|video|story, Not Null"
        TEXT title "Optional"
        TEXT caption "Optional"
        JSONB media_items "Media array, default '[]'"
        JSONB engagement_counts "Statistics, default '{}'"
        TEXT visibility "public|followers|private, default public, Not Null"
        TIMESTAMPTZ created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    vlog_likes {
        UUID id PK "Default uuid_generate_v4()"
        UUID vlog_id FK "FK to vlogs.id, Not Null"
        UUID user_id FK "FK to auth.users.id, Not Null"
        TIMESTAMPTZ created_at "Default now()"
        CONSTRAINT unique_vlog_user_like UNIQUE (vlog_id, user_id)
    }

    vlog_comments {
        UUID id PK "Default uuid_generate_v4()"
        UUID vlog_id FK "FK to vlogs.id, Not Null"
        UUID user_id FK "FK to auth.users.id, Not Null"
        TEXT content "Comment text, Not Null"
        JSONB metadata "Optional data"
        UUID reply_to_id FK "Nullable, Self-reference to vlog_comments.id"
        TIMESTAMPTZ created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    vlog_shares {
        UUID id PK "Default uuid_generate_v4()"
        UUID vlog_id FK "FK to vlogs.id, Not Null"
        UUID user_id FK "FK to auth.users.id, Not Null"
        TEXT share_type "Platform type, Not Null"
        TIMESTAMPTZ created_at "Default now()"
    }

    referrals {
        UUID id PK "Default uuid_generate_v4()"
        UUID referrer_id FK "FK to auth.users.id ON DELETE SET NULL, Not Null"
        UUID referred_id UK,FK "FK to auth.users.id ON DELETE CASCADE, Not Null"
        TEXT status "Current state, default 'pending', Not Null"
        INT level "Referral depth, default 1, Not Null"
        UUID parent_referral_id FK "Nullable, Self-ref to referrals.id ON DELETE SET NULL"
        TIMESTAMPTZ created_at "Default now()"
        CONSTRAINT check_different_referrer_referred CHECK (referrer_id <> referred_id)
    }

    commissions {
        UUID id PK "Default uuid_generate_v4()"
        UUID referral_id FK "FK to referrals.id, Not Null"
        UUID earner_id FK "FK to auth.users.id, Not Null"
        UUID payer_id FK "FK to auth.users.id, Not Null"
        NUMERIC amount "Positive value, Not Null"
        TEXT currency "Default USD, Not Null"
        TEXT type "Commission type, Not Null"
        TEXT status "Payment status, default 'pending', Not Null"
        TIMESTAMPTZ created_at "Default now()"
        CONSTRAINT check_different_earner_payer CHECK (earner_id <> payer_id)
    }

    sites {
        UUID id PK "Default uuid_generate_v4()"
        UUID owner_id "Not Null"
        TEXT owner_type "user|group, Not Null"
        TEXT theme "Theme identifier"
        JSONB layout "Page layout configuration"
        JSONB settings "Site settings"
        TEXT custom_domain UK "Optional custom domain"
        TEXT site_title "SEO title"
        TEXT site_description "SEO description"
        BOOLEAN use_app_profile "Sync with app, default false"
        BOOLEAN show_contact_form "Enable contact, default false"
        TEXT contact_email "Contact email"
        JSONB social_links "Social links"
        JSONB featured_content "Pinned items"
        JSONB custom_sections "Extra sections"
        TIMESTAMPTZ created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    site_analytics {
        UUID site_id PK,FK "FK to sites.id"
        DATE date PK "Stats date"
        INTEGER visits "Daily visits, default 0"
        INTEGER unique_visitors "Unique visitors, default 0"
        JSONB page_views "Page view counts"
        JSONB traffic_sources "Traffic source data"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    content_blocks {
        UUID id PK "Default uuid_generate_v4()"
        UUID site_id FK "FK to sites.id, Not Null"
        TEXT type "text|gallery|blog|contact|etc, Not Null"
        INTEGER "order" "Display order, default 0, Not Null"
        JSONB content "Block content"
        BOOLEAN published "Published status, default false, Not Null"
        TIMESTAMPTZ created_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    media_assets {
        UUID id PK "Default uuid_generate_v4()"
        UUID owner_id "Not Null"
        TEXT owner_type "user|group, Not Null"
        TEXT type "image|video|document, Not Null"
        TEXT filename "Original filename"
        TEXT storage_path UK "Path in storage, Not Null"
        INTEGER size_bytes "File size"
        TEXT url UK "Valid URL (app-level validation), Not Null"
        JSONB metadata "Media metadata"
        TIMESTAMPTZ uploaded_at "Default now()"
        TIMESTAMPTZ updated_at "Default now(), auto-updated by trigger"
    }

    users ||--o| profiles: has
    users ||--o{ user_search_preferences: configures
    users ||--o{ swipes: initiates
    users ||--o{ matches: participates
    users ||--o{ messages: sends
    users ||--o{ vlogs: creates
    users ||--o{ vlog_likes: creates
    users ||--o{ vlog_comments: writes
    users ||--o{ vlog_shares: shares
    users ||--o{ referrals: refers

    profiles ||--o{ user_dance_styles: has
    profiles ||--o{ user_awards: earns
    profiles ||--o{ user_interests: has
    profiles ||--o{ user_social_links: owns
    profiles ||--o{ user_portfolio_items: has

    dance_styles ||--o{ user_dance_styles: categorizes
    interests ||--o{ user_interests: categorizes
    social_platforms ||--o{ user_social_links: platforms

    matches ||--|| chats: enables
    chats ||--o{ messages: contains
    vlogs ||--o{ vlog_likes: has
    vlogs ||--o{ vlog_comments: has
    vlogs ||--o{ vlog_shares: tracks
    referrals ||--o{ commissions: generates
    referrals ||--o{ referrals: branches
    vlog_comments ||--o{ vlog_comments: "replies to"
```

## 2. Database Extensions, Trigger Functions, and RLS Helper Functions

### Database Extensions
*   **`uuid-ossp`**: Enabled. Used for `uuid_generate_v4()` to generate UUIDs for primary keys.

### Trigger Functions
These functions are used by triggers to automatically update timestamp columns.

*   **`public.handle_updated_at()`**
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ```
    This trigger function is used to automatically set the `updated_at` column to the current timestamp whenever a row is updated in tables like `profiles`, `groups`, `user_search_preferences`, `vlogs`, `vlog_comments`, `sites`, `site_analytics`, `content_blocks`, and `media_assets`.

*   **`public.handle_last_activity_update()`**
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_last_activity_update()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.last_activity = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ```
    This trigger function is used to automatically set the `last_activity` column to the current timestamp whenever a row is updated in the `chats` table.

### RLS (Row Level Security) Helper Functions
These SQL functions are used within RLS policies to determine access permissions. They are defined with `SECURITY DEFINER` to execute with the permissions of the function owner (typically a superuser), allowing them to query tables that the calling user might not have direct access to, but only for the purpose of the RLS check.

*   **`is_match_member(match_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user is one of the two participants in a specified match.
    ```sql
    CREATE OR REPLACE FUNCTION is_match_member(match_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.matches
        WHERE id = match_id_to_check AND (user1_id = user_id_to_check OR user2_id = user_id_to_check)
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`is_chat_member(chat_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user is a member of a specified chat (by checking membership of the underlying match).
    ```sql
    CREATE OR REPLACE FUNCTION is_chat_member(chat_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
      match_id_of_chat UUID;
    BEGIN
      SELECT match_id INTO match_id_of_chat FROM public.chats WHERE id = chat_id_to_check;
      IF match_id_of_chat IS NULL THEN
        RETURN FALSE;
      END IF;
      RETURN is_match_member(match_id_of_chat, user_id_to_check);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`can_view_vlog(vlog_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user can view a specified vlog based on its visibility settings and ownership.
    ```sql
    CREATE OR REPLACE FUNCTION can_view_vlog(vlog_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
      vlog_owner_id UUID;
      vlog_visibility TEXT;
    BEGIN
      SELECT user_id, visibility INTO vlog_owner_id, vlog_visibility FROM public.vlogs WHERE id = vlog_id_to_check;
      IF vlog_owner_id IS NULL THEN RETURN FALSE; END IF; -- Vlog doesn't exist
      IF vlog_visibility = 'public' THEN RETURN TRUE; END IF;
      IF user_id_to_check IS NULL THEN RETURN FALSE; END IF; -- Anonymous user cannot see non-public
      IF vlog_owner_id = user_id_to_check THEN RETURN TRUE; END IF; -- Owner can see their own
      IF vlog_visibility = 'followers' THEN RETURN TRUE; END IF; -- Authenticated users can see 'followers' vlogs (requires app-level logic for actual following)
      RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`is_group_admin_or_owner(group_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user is an 'admin' or 'owner' in a specified group.
    ```sql
    CREATE OR REPLACE FUNCTION is_group_admin_or_owner(group_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = group_id_to_check
          AND user_id = user_id_to_check
          AND (role = 'admin' OR role = 'owner')
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`can_manage_site(site_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user can manage a specified site (either as a direct user owner or as an admin/owner of the group that owns the site).
    ```sql
    CREATE OR REPLACE FUNCTION can_manage_site(site_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
      site_owner_id UUID;
      s_owner_type TEXT;
    BEGIN
      SELECT owner_id, owner_type INTO site_owner_id, s_owner_type FROM public.sites WHERE id = site_id_to_check;
      IF site_owner_id IS NULL THEN RETURN FALSE; END IF;
      IF s_owner_type = 'user' THEN
        RETURN site_owner_id = user_id_to_check;
      ELSIF s_owner_type = 'group' THEN
        RETURN is_group_admin_or_owner(site_owner_id, user_id_to_check); -- site_owner_id is group_id here
      ELSE
        RETURN FALSE;
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`is_group_owner(group_id_to_check UUID, user_id_to_check UUID) RETURNS BOOLEAN`**
    Checks if a given user is an 'owner' in a specified group.
    ```sql
    CREATE OR REPLACE FUNCTION is_group_owner(group_id_to_check UUID, user_id_to_check UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = group_id_to_check
          AND user_id = user_id_to_check
          AND role = 'owner'
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

*   **`is_sole_owner(p_group_id UUID, p_user_id UUID) RETURNS BOOLEAN`**
    Checks if a given user is the *only* owner of a specified group.
    ```sql
    CREATE OR REPLACE FUNCTION is_sole_owner(p_group_id UUID, p_user_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
      v_is_owner BOOLEAN;
      v_owner_count INT;
    BEGIN
      SELECT role = 'owner' INTO v_is_owner
      FROM public.group_members
      WHERE group_id = p_group_id AND user_id = p_user_id;

      IF NOT FOUND OR v_is_owner IS NOT TRUE THEN
        RETURN FALSE; 
      END IF;

      SELECT COUNT(*) INTO v_owner_count
      FROM public.group_members
      WHERE group_id = p_group_id AND role = 'owner';

      RETURN v_owner_count = 1;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

## 3. Table Schemas (Implemented)

This section details the final implemented schemas for each table.
RLS (Row Level Security) is enabled on all user-data tables listed below.

### `users` (Provided by Supabase Auth)
*   This table is managed by Supabase Auth.
*   Key fields: `id` (UUID, PK), `email` (TEXT), `role` (TEXT), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).

### `profiles`
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `username` (TEXT, UNIQUE, NOT NULL, CHECK: `char_length(username) >= 3 AND char_length(username) <= 30 AND username ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`)
*   `first_name` (TEXT, NOT NULL)
*   `last_name` (TEXT, NOT NULL)
*   `date_of_birth` (DATE, NOT NULL)
*   `gender` (TEXT, CHECK: `gender IN ('Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say')`)
*   `bio` (TEXT, NULLABLE, CHECK: `char_length(bio) <= 2000`)
*   `looking_for_partners` (BOOLEAN, NOT NULL, Default: FALSE)
*   `looking_for_jobs` (BOOLEAN, NOT NULL, Default: FALSE)
*   `looking_for_dancers` (BOOLEAN, NOT NULL, Default: FALSE)
*   `referrer_id` (UUID, NULLABLE, FK to `auth.users.id` ON DELETE SET NULL)
*   `referral_code` (TEXT, UNIQUE, NULLABLE)
*   `commission_tier` (TEXT, NULLABLE)
*   `profile_status` (TEXT, NOT NULL, Default: 'pending_waitlist_approval')
*   `profile_picture_url` (TEXT, NULLABLE) -- URL validation at app level
*   `user_tier` (TEXT, NOT NULL, Default: 'basic')
*   `stripe_customer_id` (TEXT, UNIQUE, NULLABLE)
*   `location_city` (TEXT, NULLABLE)
*   `location_state` (TEXT, NULLABLE)
*   `location_country` (TEXT, NULLABLE)
*   `latitude` (FLOAT8, NULLABLE)
*   `longitude` (FLOAT8, NULLABLE)
*   `last_active_at` (TIMESTAMPTZ, Default: `now()`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_profiles_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `roles`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `name` (TEXT, NOT NULL, CHECK: `name IN ('site_admin', 'group_admin', 'pro_user', 'free_user')`)
*   `permissions` (JSONB, NOT NULL, Default: `'[]'::jsonb`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_roles`
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `role_id` (UUID, PK, FK to `roles.id` ON DELETE CASCADE)
*   `scope_id` (UUID, NULLABLE, FK to `groups.id` ON DELETE CASCADE)
*   `granted_at` (TIMESTAMPTZ, Default: `now()`)

### `dance_styles`
*   `id` (SERIAL, PK)
*   `name` (TEXT, UNIQUE, NOT NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_dance_styles`
*   `user_id` (UUID, PK, FK to `profiles.user_id` ON DELETE CASCADE)
*   `style_id` (INTEGER, PK, FK to `dance_styles.id` ON DELETE CASCADE)
*   `proficiency_level` (TEXT, NOT NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_awards`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user_id` (UUID, NOT NULL, FK to `profiles.user_id` ON DELETE CASCADE)
*   `name` (TEXT, NOT NULL)
*   `year` (INTEGER, NULLABLE)
*   `description` (TEXT, NULLABLE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `interests`
*   `id` (SERIAL, PK)
*   `name` (TEXT, UNIQUE, NOT NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_interests`
*   `user_id` (UUID, PK, FK to `profiles.user_id` ON DELETE CASCADE)
*   `interest_id` (INTEGER, PK, FK to `interests.id` ON DELETE CASCADE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `social_platforms`
*   `id` (SERIAL, PK)
*   `name` (TEXT, UNIQUE, NOT NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_social_links`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user_id` (UUID, NOT NULL, FK to `profiles.user_id` ON DELETE CASCADE)
*   `platform_id` (INTEGER, NOT NULL, FK to `social_platforms.id` ON DELETE CASCADE)
*   `url` (TEXT, NOT NULL) -- Basic check, app-level validation for URL format
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `unique_user_platform_link` UNIQUE (`user_id`, `platform_id`)

### `user_portfolio_items`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user_id` (UUID, NOT NULL, FK to `profiles.user_id` ON DELETE CASCADE)
*   `item_type` (TEXT, NOT NULL)
*   `url` (TEXT, NOT NULL) -- URL to the portfolio item. App-level validation for format.
*   `caption` (TEXT, NULLABLE)
*   `thumbnail_url` (TEXT, NULLABLE) -- URL to a thumbnail image. App-level validation.
*   `display_order` (INTEGER, NOT NULL, Default: 0)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `user_search_preferences`
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `discovery_dance_styles` (JSONB, Default: `'[]'::jsonb`)
*   `discovery_skill_levels` (JSONB, Default: `'[]'::jsonb`)
*   `discovery_min_age` (INTEGER, CHECK: `discovery_min_age >= 18`)
*   `discovery_max_age` (INTEGER, NULLABLE)
*   `discovery_distance_miles` (INTEGER, NOT NULL, Default: 50)
*   `discovery_gender_preference` (JSONB, Default: `'[]'::jsonb`)
*   `notifications_enabled` (BOOLEAN, NOT NULL, Default: TRUE)
*   `search_location_city` (TEXT, NULLABLE)
*   `search_location_state` (TEXT, NULLABLE)
*   `search_location_country` (TEXT, NULLABLE)
*   `search_latitude` (FLOAT8, NULLABLE)
*   `search_longitude` (FLOAT8, NULLABLE)
*   `use_custom_location` (BOOLEAN, NOT NULL, Default: FALSE)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   CONSTRAINT `check_max_age` CHECK (`discovery_max_age` IS NULL OR `discovery_min_age` IS NULL OR `discovery_max_age >= discovery_min_age`)
*   **Trigger**: `on_user_search_preferences_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `groups`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `name` (TEXT, NOT NULL)
*   `type` (TEXT, NOT NULL, CHECK: `type IN ('company', 'studio', 'team')`)
*   `subdomain` (TEXT, UNIQUE, NOT NULL)
*   `custom_domain` (TEXT, UNIQUE, NULLABLE)
*   `settings` (JSONB, NOT NULL, Default: `'{}'::jsonb`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_groups_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `group_members`
*   `group_id` (UUID, PK, FK to `groups.id` ON DELETE CASCADE)
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `role` (TEXT, NOT NULL, CHECK: `role IN ('owner', 'admin', 'member')`)
*   `joined_at` (TIMESTAMPTZ, Default: `now()`)

### `swipes`
*   `swiper_user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `swiped_user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `swipe_type` (TEXT, NOT NULL, CHECK: `swipe_type IN ('like', 'dislike', 'superlike')`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `check_different_users` CHECK (`swiper_user_id <> swiped_user_id`)

### `matches`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user1_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `user2_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `matched_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `unique_match_pair` UNIQUE (`user1_id`, `user2_id`)
*   CONSTRAINT `check_different_users_match` CHECK (`user1_id <> user2_id`)
*   CONSTRAINT `check_user_order_match` CHECK (`user1_id < user2_id`)

### `chats`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `match_id` (UUID, UNIQUE, NOT NULL, FK to `matches.id` ON DELETE CASCADE)
*   `last_message_id` (UUID, NULLABLE, FK to `messages.id` ON DELETE SET NULL)
*   `last_activity` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_last_activity_update` trigger.
*   **Trigger**: `on_chats_last_activity_updated` (BEFORE UPDATE, EXECUTE `public.handle_last_activity_update()`)

### `messages`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `chat_id` (UUID, NOT NULL, FK to `chats.id` ON DELETE CASCADE)
*   `sender_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `content_type` (TEXT, NOT NULL, CHECK: `content_type IN ('text', 'image', 'video', 'audio')`)
*   `content` (TEXT, NOT NULL)
*   `media_url` (TEXT, NULLABLE) -- App-level validation for URL format
*   `sent_at` (TIMESTAMPTZ, Default: `now()`)

### `vlogs`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `post_type` (TEXT, NOT NULL, CHECK: `post_type IN ('text', 'image', 'video', 'story')`)
*   `title` (TEXT, NULLABLE)
*   `caption` (TEXT, NULLABLE)
*   `media_items` (JSONB, Default: `'[]'::jsonb`)
*   `engagement_counts` (JSONB, Default: `'{}'::jsonb`)
*   `visibility` (TEXT, NOT NULL, Default: `'public'`, CHECK: `visibility IN ('public', 'followers', 'private')`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_vlogs_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `vlog_likes`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `vlog_id` (UUID, NOT NULL, FK to `vlogs.id` ON DELETE CASCADE)
*   `user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `unique_vlog_user_like` UNIQUE (`vlog_id`, `user_id`)

### `vlog_comments`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `vlog_id` (UUID, NOT NULL, FK to `vlogs.id` ON DELETE CASCADE)
*   `user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `content` (TEXT, NOT NULL)
*   `metadata` (JSONB, NULLABLE)
*   `reply_to_id` (UUID, NULLABLE, FK to `vlog_comments.id` ON DELETE CASCADE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_vlog_comments_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `vlog_shares`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `vlog_id` (UUID, NOT NULL, FK to `vlogs.id` ON DELETE CASCADE)
*   `user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `share_type` (TEXT, NOT NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `referrals`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `referrer_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE SET NULL)
*   `referred_id` (UUID, UNIQUE, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `status` (TEXT, NOT NULL, Default: `'pending'`)
*   `level` (INTEGER, NOT NULL, Default: 1)
*   `parent_referral_id` (UUID, NULLABLE, FK to `referrals.id` ON DELETE SET NULL)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `check_different_referrer_referred` CHECK (`referrer_id <> referred_id`)

### `commissions`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `referral_id` (UUID, NOT NULL, FK to `referrals.id` ON DELETE CASCADE)
*   `earner_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `payer_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `amount` (NUMERIC, NOT NULL, CHECK: `amount > 0`)
*   `currency` (TEXT, NOT NULL, Default: `'USD'`)
*   `type` (TEXT, NOT NULL)
*   `status` (TEXT, NOT NULL, Default: `'pending'`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `check_different_earner_payer` CHECK (`earner_id <> payer_id`)

### `sites`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `owner_id` (UUID, NOT NULL)
*   `owner_type` (TEXT, NOT NULL, CHECK: `owner_type IN ('user', 'group')`)
*   `theme` (TEXT, NULLABLE)
*   `layout` (JSONB, NULLABLE)
*   `settings` (JSONB, NULLABLE)
*   `custom_domain` (TEXT, UNIQUE, NULLABLE)
*   `site_title` (TEXT, NULLABLE)
*   `site_description` (TEXT, NULLABLE)
*   `use_app_profile` (BOOLEAN, Default: FALSE)
*   `show_contact_form` (BOOLEAN, Default: FALSE)
*   `contact_email` (TEXT, NULLABLE)
*   `social_links` (JSONB, NULLABLE)
*   `featured_content` (JSONB, NULLABLE)
*   `custom_sections` (JSONB, NULLABLE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_sites_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `site_analytics`
*   `site_id` (UUID, PK, FK to `sites.id` ON DELETE CASCADE)
*   `date` (DATE, PK)
*   `visits` (INTEGER, Default: 0)
*   `unique_visitors` (INTEGER, Default: 0)
*   `page_views` (JSONB, NULLABLE)
*   `traffic_sources` (JSONB, NULLABLE)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_site_analytics_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `content_blocks`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `site_id` (UUID, NOT NULL, FK to `sites.id` ON DELETE CASCADE)
*   `type` (TEXT, NOT NULL)
*   `"order"` (INTEGER, NOT NULL, Default: 0) -- Quoted as "order"
*   `content` (JSONB, NULLABLE)
*   `published` (BOOLEAN, NOT NULL, Default: FALSE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_content_blocks_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

### `media_assets`
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `owner_id` (UUID, NOT NULL)
*   `owner_type` (TEXT, NOT NULL, CHECK: `owner_type IN ('user', 'group')`)
*   `type` (TEXT, NOT NULL, CHECK: `type IN ('image', 'video', 'document')`)
*   `filename` (TEXT, NULLABLE)
*   `storage_path` (TEXT, NOT NULL, UNIQUE)
*   `size_bytes` (INTEGER, NULLABLE)
*   `url` (TEXT, NOT NULL, UNIQUE)
*   `metadata` (JSONB, NULLABLE)
*   `uploaded_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`) -- Auto-updated by `handle_updated_at` trigger.
*   **Trigger**: `on_media_assets_updated` (BEFORE UPDATE, EXECUTE `public.handle_updated_at()`)

## 4. Row Level Security (RLS) Policies (Implemented)

All tables listed below have `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;` applied.

### `profiles`
```sql
CREATE POLICY "Allow public read access to active profiles"
ON public.profiles FOR SELECT
USING (profile_status = 'active');

CREATE POLICY "Allow user to read their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create their profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);
```

### `user_search_preferences`
```sql
CREATE POLICY "Allow user to read their own search preferences"
ON public.user_search_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow user to create their own search preferences"
ON public.user_search_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own search preferences"
ON public.user_search_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own search preferences"
ON public.user_search_preferences FOR DELETE
USING (auth.uid() = user_id);
```

### `dance_styles`
```sql
CREATE POLICY "Allow authenticated read access to dance styles"
ON public.dance_styles FOR SELECT
TO authenticated
USING (true);
```

### `user_dance_styles`
```sql
CREATE POLICY "Allow users to read any user dance styles"
ON public.user_dance_styles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow user to create their own dance style links"
ON public.user_dance_styles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own dance style links"
ON public.user_dance_styles FOR DELETE
USING (auth.uid() = user_id);
```

### `interests`
```sql
CREATE POLICY "Allow authenticated read access to interests"
ON public.interests FOR SELECT
TO authenticated
USING (true);
```

### `user_interests`
```sql
CREATE POLICY "Allow users to read any user interests"
ON public.user_interests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow user to create their own interest links"
ON public.user_interests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own interest links"
ON public.user_interests FOR DELETE
USING (auth.uid() = user_id);
```

### `social_platforms`
```sql
CREATE POLICY "Allow authenticated read access to social platforms"
ON public.social_platforms FOR SELECT
TO authenticated
USING (true);
```

### `user_social_links`
```sql
CREATE POLICY "Allow users to read any user social links"
ON public.user_social_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow user to create their own social links"
ON public.user_social_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own social links"
ON public.user_social_links FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own social links"
ON public.user_social_links FOR DELETE
USING (auth.uid() = user_id);
```

### `user_awards`
```sql
CREATE POLICY "Allow users to read any user awards"
ON public.user_awards FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow user to create their own awards"
ON public.user_awards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own awards"
ON public.user_awards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own awards"
ON public.user_awards FOR DELETE
USING (auth.uid() = user_id);
```

### `user_portfolio_items`
```sql
CREATE POLICY "Allow users to read any user portfolio items"
ON public.user_portfolio_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow user to create their own portfolio items"
ON public.user_portfolio_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own portfolio items"
ON public.user_portfolio_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own portfolio items"
ON public.user_portfolio_items FOR DELETE
USING (auth.uid() = user_id);
```

### `swipes`
```sql
CREATE POLICY "Allow user to create their own swipes"
ON public.swipes FOR INSERT
WITH CHECK (auth.uid() = swiper_user_id);

CREATE POLICY "Allow user to read their own initiated or received swipes"
ON public.swipes FOR SELECT
USING (auth.uid() = swiper_user_id OR auth.uid() = swiped_user_id);
```

### `matches`
```sql
CREATE POLICY "Allow involved users to read their matches"
ON public.matches FOR SELECT
USING (is_match_member(id, auth.uid()));
```

### `chats`
```sql
CREATE POLICY "Allow chat members to read their chats"
ON public.chats FOR SELECT
USING (is_chat_member(id, auth.uid()));
```

### `messages`
```sql
CREATE POLICY "Allow chat members to read messages in their chats"
ON public.messages FOR SELECT
USING (is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Allow chat member to insert messages into their chats"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Allow sender to update their own messages if chat member"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id AND is_chat_member(chat_id, auth.uid()))
WITH CHECK (auth.uid() = sender_id AND is_chat_member(chat_id, auth.uid()));

CREATE POLICY "Allow sender to delete their own messages if chat member"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id AND is_chat_member(chat_id, auth.uid()));
```

### `vlogs`
```sql
CREATE POLICY "Allow users to read accessible vlogs"
ON public.vlogs FOR SELECT
USING (can_view_vlog(id, auth.uid()));

CREATE POLICY "Allow user to create their own vlogs"
ON public.vlogs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to update their own vlogs"
ON public.vlogs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own vlogs"
ON public.vlogs FOR DELETE
USING (auth.uid() = user_id);
```

### `vlog_likes`
```sql
CREATE POLICY "Allow users to read likes on accessible vlogs"
ON public.vlog_likes FOR SELECT
USING (can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to create likes on accessible vlogs"
ON public.vlog_likes FOR INSERT
WITH CHECK (auth.uid() = user_id AND can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to delete their own likes"
ON public.vlog_likes FOR DELETE
USING (auth.uid() = user_id);
```

### `vlog_comments`
```sql
CREATE POLICY "Allow users to read comments on accessible vlogs"
ON public.vlog_comments FOR SELECT
USING (can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to create comments on accessible vlogs"
ON public.vlog_comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to update their own comments"
ON public.vlog_comments FOR UPDATE
USING (auth.uid() = user_id AND can_view_vlog(vlog_id, auth.uid()))
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own comments"
ON public.vlog_comments FOR DELETE
USING (auth.uid() = user_id);
```

### `vlog_shares`
```sql
CREATE POLICY "Allow users to read shares of accessible vlogs"
ON public.vlog_shares FOR SELECT
USING (can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to create shares on accessible vlogs"
ON public.vlog_shares FOR INSERT
WITH CHECK (auth.uid() = user_id AND can_view_vlog(vlog_id, auth.uid()));

CREATE POLICY "Allow user to delete their own shares"
ON public.vlog_shares FOR DELETE
USING (auth.uid() = user_id);
```

### `referrals`
```sql
CREATE POLICY "Allow user to read their own referral records"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Allow user to create referrals for others"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id AND auth.uid() <> referred_id);
```

### `commissions`
```sql
CREATE POLICY "Allow earner to read their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = earner_id);
```

### `sites`
```sql
CREATE POLICY "Allow public read access to sites"
ON public.sites FOR SELECT USING (true);

CREATE POLICY "Allow site managers to update their sites"
ON public.sites FOR UPDATE
USING (can_manage_site(id, auth.uid()))
WITH CHECK (can_manage_site(id, auth.uid()));

CREATE POLICY "Allow site managers to delete their sites"
ON public.sites FOR DELETE
USING (can_manage_site(id, auth.uid()));

CREATE POLICY "Allow users or group admins to create sites"
ON public.sites FOR INSERT
WITH CHECK (
  (owner_type = 'user' AND owner_id = auth.uid()) OR
  (owner_type = 'group' AND is_group_admin_or_owner(owner_id, auth.uid()))
);
```

### `site_analytics`
```sql
CREATE POLICY "Allow site managers to read their site analytics"
ON public.site_analytics FOR SELECT
USING (can_manage_site(site_id, auth.uid()));
```

### `content_blocks`
```sql
CREATE POLICY "Allow public read access to published content blocks"
ON public.content_blocks FOR SELECT
USING (published = true);

CREATE POLICY "Allow site managers to manage their content blocks"
ON public.content_blocks FOR ALL
USING (can_manage_site(site_id, auth.uid()))
WITH CHECK (can_manage_site(site_id, auth.uid()));
```

### `media_assets`
```sql
CREATE POLICY "Allow public read access to media assets"
ON public.media_assets FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to upload media"
ON public.media_assets FOR INSERT
WITH CHECK (
  (owner_type = 'user' AND owner_id = auth.uid()) OR
  (owner_type = 'group' AND is_group_admin_or_owner(owner_id, auth.uid()))
);

CREATE POLICY "Allow owners to update their media asset metadata"
ON public.media_assets FOR UPDATE
USING (
  (owner_type = 'user' AND owner_id = auth.uid()) OR
  (owner_type = 'group' AND is_group_admin_or_owner(owner_id, auth.uid()))
)
WITH CHECK (
  (owner_type = 'user' AND owner_id = auth.uid()) OR
  (owner_type = 'group' AND is_group_admin_or_owner(owner_id, auth.uid()))
);

CREATE POLICY "Allow owners to delete their media assets"
ON public.media_assets FOR DELETE
USING (
  (owner_type = 'user' AND owner_id = auth.uid()) OR
  (owner_type = 'group' AND is_group_admin_or_owner(owner_id, auth.uid()))
);
```

### `groups`
```sql
CREATE POLICY "Allow authenticated users to read groups"
ON public.groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create groups"
ON public.groups FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow group admins or owners to update their group"
ON public.groups FOR UPDATE
USING (is_group_admin_or_owner(id, auth.uid()))
WITH CHECK (is_group_admin_or_owner(id, auth.uid()));

CREATE POLICY "Allow group owners to delete their group"
ON public.groups FOR DELETE
USING (is_group_owner(id, auth.uid()));
```

### `group_members`
```sql
CREATE POLICY "Allow authenticated users to read group memberships"
ON public.group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow group admins or owners to add members"
ON public.group_members FOR INSERT
WITH CHECK (is_group_admin_or_owner(group_id, auth.uid()));

CREATE POLICY "Allow group admins or owners to update member roles"
ON public.group_members FOR UPDATE
USING (is_group_admin_or_owner(group_id, auth.uid())) -- group_id refers to OLD.group_id
WITH CHECK (true); -- SIMPLIFIED: "Last owner" demotion check deferred to trigger or app-layer. USING clause gates permission.

CREATE POLICY "Allow group admins/owners to remove members (not last owner)"
ON public.group_members FOR DELETE
USING (
  is_group_admin_or_owner(group_id, auth.uid()) AND
  user_id <> auth.uid() AND
  NOT is_sole_owner(group_id, user_id)
);

CREATE POLICY "Allow members to leave a group (not last owner)"
ON public.group_members FOR DELETE
USING (
  user_id = auth.uid() AND
  NOT is_sole_owner(group_id, user_id)
);
```

### `roles`
```sql
CREATE POLICY "Allow authenticated users to read roles"
ON public.roles FOR SELECT TO authenticated USING (true);
```

### `user_roles`
```sql
CREATE POLICY "Allow users to read their own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow group admins/owners to manage user roles in their group"
ON public.user_roles FOR ALL
USING (scope_id IS NOT NULL AND is_group_admin_or_owner(scope_id, auth.uid()))
WITH CHECK (scope_id IS NOT NULL AND is_group_admin_or_owner(scope_id, auth.uid()));