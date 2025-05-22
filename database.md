# iDance - Database Schema

This document details the PostgreSQL database schema for the "iDance" application, hosted on Supabase. Row Level Security (RLS) will be enabled on all tables containing user data.

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users {
        uuid id PK "Supabase Auth User ID"
        timestamp created_at
        timestamp updated_at
        string email
        string role "e.g., authenticated, admin"
    }

    profiles {
        uuid user_id PK "PK, References users.id"
        text username UK "Unique, for profile URL (username.idance.live)"
        text first_name "Not Null"
        text last_name "Not Null"
        date date_of_birth "Not Null"
        text gender "CHECK: Male, Female, Non-binary, Other, Prefer not to say"
        text bio "Max 2000 chars"
        jsonb dance_styles "Array of {style: text, proficiency: text ('Beginner', 'Intermediate', 'Advanced', 'Professional', 'Social/Fun')}"
        jsonb awards "Array of {name: text, year: int, description: text}"
        jsonb other_interests "Array of text"
        jsonb social_links "Object {instagram: text, tiktok: text, linkedin: text, youtube: text, website: text}"
        boolean looking_for_partners "Default: false"
        boolean looking_for_jobs "Default: false"
        uuid referrer_id FK "References users.id, Nullable (for first users or direct signups)"
        text referral_code UK "Unique code generated for user, Nullable"
        text commission_tier "Nullable (e.g., 'Bronze', 'Silver', 'Gold')"
        text profile_status "Not Null, Default: 'pending_waitlist_approval', CHECK: ('pending_waitlist_approval', 'active', 'incomplete', 'suspended', 'vip')"
        text profile_picture_url "Nullable, valid URL"
        jsonb portfolio_items "Array of {type: text ('image', 'video', 'audio'), url: text, caption: text, thumbnail_url: text}"
        text user_tier "Not Null, Default: 'basic', CHECK: ('basic', 'pro', 'vip')"
        text stripe_customer_id "Nullable, UK"
        text stripe_subscription_id "Nullable, UK"
        text pro_subscription_status "Nullable (e.g., 'active', 'canceled', 'past_due')"
        timestamptz pro_subscription_ends_at "Nullable"
        text location_city "Nullable"
        text location_state "Nullable"
        text location_country "Nullable"
        float8 latitude "Nullable, for PostGIS"
        float8 longitude "Nullable, for PostGIS"
        timestamptz last_active_at "Default: now()"
        timestamptz created_at "Default: now()"
        timestamptz updated_at "Default: now()"
    }

    user_preferences {
        uuid user_id PK "PK, References users.id"
        jsonb discovery_dance_styles "Array of text"
        jsonb discovery_skill_levels "Array of text"
        integer discovery_min_age "CHECK >= 18"
        integer discovery_max_age "CHECK >= discovery_min_age"
        integer discovery_distance_miles "Default: 50, CHECK > 0"
        jsonb discovery_gender_preference "Array of text (Male, Female, Non-binary, Other)"
        boolean notifications_new_match "Default: true"
        boolean notifications_new_message "Default: true"
        boolean notifications_new_like "Default: true"
        boolean notifications_timeline_activity "Default: true"
        boolean notifications_referral_milestone "Default: true"
        timestamptz updated_at "Default: now()"
    }

    swipes {
        uuid swiper_user_id PK "Part of PK, FK to users.id (swiper)"
        uuid swiped_user_id PK "Part of PK, FK to users.id (swiped)"
        text swipe_type "Not Null, CHECK: ('like', 'pass', 'superlike')"
        timestamptz created_at "Default: now()"
    }

    matches {
        uuid id PK "Default: uuid_generate_v4()"
        uuid user1_id FK "References users.id, Not Null"
        uuid user2_id FK "References users.id, Not Null"
        timestamptz created_at "Default: now()"
    }

    chats {
        uuid id PK "Default: uuid_generate_v4()"
        uuid match_id FK UK "References matches.id, Not Null"
        uuid last_message_id FK "References messages.id, Nullable, ON DELETE SET NULL"
        timestamptz user1_last_read_at "Nullable"
        timestamptz user2_last_read_at "Nullable"
        timestamptz created_at "Default: now()"
        timestamptz updated_at "Default: now()"
    }

    messages {
        uuid id PK "Default: uuid_generate_v4()"
        uuid chat_id FK "References chats.id, Not Null"
        uuid sender_id FK "References users.id, Not Null"
        text content_type "Not Null, Default: 'text', CHECK: ('text', 'image', 'video_thumbnail', 'audio_link')"
        text content "Not Null"
        text media_url "Nullable, valid URL"
        timestamptz created_at "Default: now()"
    }

    journal_posts {
        uuid id PK "Default: uuid_generate_v4()"
        uuid user_id FK "References users.id, Not Null"
        text post_type "Not Null, CHECK: ('video', 'vlog', 'photo_album', 'text_story', 'audio_clip')"
        text title "Nullable"
        text caption "Nullable, Max 2200 chars"
        jsonb media_items "Array of {url: text, type: text, thumbnail_url: text}, Nullable"
        integer view_count "Default: 0"
        integer like_count "Default: 0"
        integer comment_count "Default: 0"
        text visibility "Not Null, Default: 'public', CHECK: ('public', 'followers_only', 'private')"
        timestamptz created_at "Default: now()"
        timestamptz updated_at "Default: now()"
    }

    referrals {
        uuid id PK "Default: uuid_generate_v4()"
        uuid referrer_user_id FK "References users.id, Not Null (The one who referred)"
        uuid referred_user_id FK UK "References users.id, Not Null (The one who was referred)"
        text status "Not Null, Default: 'pending_activation', CHECK: ('pending_activation', 'active_basic', 'active_pro', 'lapsed_pro', 'commission_eligible')"
        integer referral_level "Not Null, Default: 1 (1 for direct, 2 for secondary, etc.)"
        uuid originating_referral_id FK "References referrals.id, Nullable (for multi-level tracking)"
        timestamptz created_at "Default: now()"
        timestamptz updated_at "Default: now()"
    }

    commission_ledgers {
        uuid id PK "Default: uuid_generate_v4()"
        uuid referral_id FK "References referrals.id, Not Null"
        uuid earning_user_id FK "References users.id, Not Null (User who earned the commission)"
        uuid paying_user_id FK "References users.id, Not Null (User whose Pro subscription generated commission)"
        numeric amount "Not Null, CHECK > 0"
        text currency "Not Null, Default: 'USD'"
        text commission_type "Not Null, CHECK: ('direct_pro_signup', 'secondary_pro_signup', 'tertiary_pro_signup', 'pro_renewal')"
        timestamptz transaction_date "Default: now()"
        text status "Not Null, Default: 'pending', CHECK: ('pending', 'paid', 'failed', 'refunded')"
        uuid payment_id "Nullable (e.g., Stripe transaction ID)"
    }

    users ||--o{ profiles : "has one"
    users ||--o{ user_preferences : "configures"
    users ||--o{ swipes : "initiates (swiper)"
    users ||--o{ swipes : "receives (swiped)"
    users ||--o{ matches : "is part of (user1 or user2)"
    users ||--o{ messages : "sends"
    users ||--o{ journal_posts : "creates"
    users ||--o{ referrals : "is referrer_user_id"
    users ||--o{ referrals : "is referred_user_id"
    users ||--o{ commission_ledgers : "earns (earning_user_id)"
    users ||--o{ commission_ledgers : "generates_from (paying_user_id)"

    matches ||--|| chats : "has one"
    chats ||--o{ messages : "contains"
    referrals ||--o{ commission_ledgers : "generates"
    referrals ||--o{ referrals : "can_originate_from (originating_referral_id)"
```

## 2. Table Schemas

### `users` (Provided by Supabase Auth, extended via `profiles`)
*   This table is managed by Supabase Auth. We will create a `profiles` table that has a one-to-one relationship with `auth.users`.
*   Key fields from `auth.users` like `id` (UUID), `email`, `role`, `created_at`, `updated_at` are implicitly available.

### `profiles`
Stores public and private details for a user, including their status and tier.
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `username` (TEXT, UNIQUE, NOT NULL, CHECK: length between 3 and 30, valid characters for URL slug) - For `idance.live/username`
*   `first_name` (TEXT, NOT NULL)
*   `last_name` (TEXT, NOT NULL)
*   `date_of_birth` (DATE, NOT NULL)
*   `gender` (TEXT, CHECK: `gender IN ('Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say')`)
*   `bio` (TEXT, NULLABLE, CHECK: length up to 2000 chars)
*   `dance_styles` (JSONB, NOT NULL, Default: `'[]'::jsonb`) - Array of objects: `{style: TEXT, proficiency: TEXT}` (e.g., proficiency: 'Beginner', 'Intermediate', 'Advanced', 'Professional', 'Social/Fun').
*   `awards` (JSONB, Default: `'[]'::jsonb`) - Array of objects: `{name: TEXT, year: INTEGER, description: TEXT}`.
*   `other_interests` (JSONB, Default: `'[]'::jsonb`) - Array of TEXT.
*   `social_links` (JSONB, Default: `'{}'::jsonb`) - Object: `{instagram: TEXT, tiktok: TEXT, linkedin: TEXT, youtube: TEXT, website: TEXT}`. All values should be valid URLs.
*   `looking_for_partners` (BOOLEAN, NOT NULL, Default: FALSE)
*   `looking_for_jobs` (BOOLEAN, NOT NULL, Default: FALSE)
*   `referrer_id` (UUID, NULLABLE, FK to `auth.users.id` ON DELETE SET NULL) - User who referred this user.
*   `referral_code` (TEXT, UNIQUE, NULLABLE) - This user's unique code to share for referrals. Generated on profile creation.
*   `commission_tier` (TEXT, NULLABLE) - Current commission percentage tier based on successful referrals (e.g., '10%', '20%_tier2').
*   `profile_status` (TEXT, NOT NULL, Default: 'pending_waitlist_approval', CHECK: `profile_status IN ('pending_waitlist_approval', 'active', 'incomplete', 'suspended', 'vip_pending_criteria', 'vip')`) - Manages user state, including waitlist.
*   `profile_picture_url` (TEXT, NULLABLE, CHECK: valid URL)
*   `portfolio_items` (JSONB, Default: `'[]'::jsonb`) - Array of objects: `{type: TEXT, url: TEXT, caption: TEXT, thumbnail_url: TEXT}` (type: 'image', 'video', 'audio').
*   `user_tier` (TEXT, NOT NULL, Default: 'basic', CHECK: `user_tier IN ('basic', 'pro', 'vip')`)
*   `stripe_customer_id` (TEXT, UNIQUE, NULLABLE) - For Stripe integration.
*   `stripe_subscription_id` (TEXT, UNIQUE, NULLABLE) - For current Pro subscription.
*   `pro_subscription_status` (TEXT, NULLABLE, CHECK: `pro_subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')`)
*   `pro_subscription_ends_at` (TIMESTAMPTZ, NULLABLE)
*   `location_city` (TEXT, NULLABLE)
*   `location_state` (TEXT, NULLABLE)
*   `location_country` (TEXT, NULLABLE)
*   `latitude` (FLOAT8, NULLABLE) - For PostGIS.
*   `longitude` (FLOAT8, NULLABLE) - For PostGIS.
*   `last_active_at` (TIMESTAMPTZ, Default: `now()`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`)

### `user_preferences`
Stores user's discovery settings and notification preferences.
*   `user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `discovery_dance_styles` (JSONB, NULLABLE, Default: `'[]'::jsonb`) - Array of TEXT.
*   `discovery_skill_levels` (JSONB, NULLABLE, Default: `'[]'::jsonb`) - Array of TEXT.
*   `discovery_min_age` (INTEGER, NULLABLE, CHECK: `discovery_min_age >= 18`)
*   `discovery_max_age` (INTEGER, NULLABLE, CHECK: `discovery_max_age >= discovery_min_age`)
*   `discovery_distance_miles` (INTEGER, NOT NULL, Default: 50, CHECK: `discovery_distance_miles > 0`)
*   `discovery_gender_preference` (JSONB, NULLABLE, Default: `'[]'::jsonb`) - Array of TEXT (e.g., 'Male', 'Female', 'Non-binary').
*   `notifications_new_match` (BOOLEAN, NOT NULL, Default: TRUE)
*   `notifications_new_message` (BOOLEAN, NOT NULL, Default: TRUE)
*   `notifications_new_like` (BOOLEAN, NOT NULL, Default: TRUE)
*   `notifications_timeline_activity` (BOOLEAN, NOT NULL, Default: TRUE) - e.g., new posts from followed users, significant interactions.
*   `notifications_referral_milestone` (BOOLEAN, NOT NULL, Default: TRUE) - e.g., new referral, commission earned.
*   `updated_at` (TIMESTAMPTZ, Default: `now()`)

### `swipes`
Records swipe actions between users.
*   `swiper_user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE)
*   `swiped_user_id` (UUID, PK, FK to `auth.users.id` ON DELETE CASCADE) - The user being swiped on.
*   `swipe_type` (TEXT, NOT NULL, CHECK: `swipe_type IN ('like', 'pass', 'superlike')`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `different_users_swipe_check` CHECK (`swiper_user_id` != `swiped_user_id`)

### `matches`
Records mutual likes (matches).
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user1_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `user2_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   CONSTRAINT `unique_match_pair_ordered` UNIQUE (`user1_id`, `user2_id`)
*   CONSTRAINT `ordered_match_users_check` CHECK (`user1_id` < `user2_id`) - Ensures consistent ordering for uniqueness.

### `chats`
Represents a conversation thread between two matched users.
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `match_id` (UUID, UNIQUE, NOT NULL, FK to `matches.id` ON DELETE CASCADE)
*   `last_message_id` (UUID, NULLABLE, FK to `messages.id` ON DELETE SET NULL) - For quick preview of last message.
*   `user1_last_read_at` (TIMESTAMPTZ, NULLABLE) - Corresponds to `matches.user1_id`.
*   `user2_last_read_at` (TIMESTAMPTZ, NULLABLE) - Corresponds to `matches.user2_id`.
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`)

### `messages`
Individual messages within a chat.
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `chat_id` (UUID, NOT NULL, FK to `chats.id` ON DELETE CASCADE)
*   `sender_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `content_type` (TEXT, NOT NULL, Default: 'text', CHECK: `content_type IN ('text', 'image', 'video_thumbnail', 'audio_link', 'system_message')`)
*   `content` (TEXT, NOT NULL) - The actual message text or system message content.
*   `media_url` (TEXT, NULLABLE, CHECK: valid URL if `content_type` involves media)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)

### `journal_posts`
Stores user-created content for their profile journal and the main timeline.
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE)
*   `post_type` (TEXT, NOT NULL, CHECK: `post_type IN ('video', 'vlog', 'photo_album', 'text_story', 'audio_clip')`)
*   `title` (TEXT, NULLABLE)
*   `caption` (TEXT, NULLABLE, CHECK: length up to 2200 chars)
*   `media_items` (JSONB, NULLABLE, Default: `'[]'::jsonb`) - Array of objects: `{url: TEXT, type: TEXT ('image', 'video', 'audio'), thumbnail_url: TEXT}`.
*   `view_count` (INTEGER, NOT NULL, Default: 0)
*   `like_count` (INTEGER, NOT NULL, Default: 0)
*   `comment_count` (INTEGER, NOT NULL, Default: 0)
*   `visibility` (TEXT, NOT NULL, Default: 'public', CHECK: `visibility IN ('public', 'followers_only', 'private')`)
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`)

### `referrals`
Tracks referral relationships between users for the multi-level commission system.
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `referrer_user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE) - The user who made the referral.
*   `referred_user_id` (UUID, UNIQUE, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE) - The user who was referred.
*   `status` (TEXT, NOT NULL, Default: 'pending_activation', CHECK: `status IN ('pending_activation', 'active_basic', 'active_pro', 'lapsed_pro', 'commission_eligible')`) - Tracks the referred user's status relevant to commission.
*   `referral_level` (INTEGER, NOT NULL, Default: 1) - 1 for direct, 2 for secondary, etc.
*   `originating_referral_id` (UUID, NULLABLE, FK to `referrals.id` ON DELETE SET NULL) - For multi-level tracking, links to the referral that generated this one (e.g., if user A refers B, and B refers C, C's entry here points to A->B referral).
*   `created_at` (TIMESTAMPTZ, Default: `now()`)
*   `updated_at` (TIMESTAMPTZ, Default: `now()`)

### `commission_ledgers`
Logs earned commissions for referrers.
*   `id` (UUID, PK, Default: `uuid_generate_v4()`)
*   `referral_id` (UUID, NOT NULL, FK to `referrals.id` ON DELETE CASCADE) - The specific referral link that generated this commission.
*   `earning_user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE) - The user who earned the commission.
*   `paying_user_id` (UUID, NOT NULL, FK to `auth.users.id` ON DELETE CASCADE) - The Pro user whose subscription payment triggered this commission.
*   `amount` (NUMERIC(10, 2), NOT NULL, CHECK: `amount > 0`) - Commission amount.
*   `currency` (TEXT, NOT NULL, Default: 'USD', CHECK: length = 3)
*   `commission_type` (TEXT, NOT NULL, CHECK: `commission_type IN ('direct_pro_signup', 'secondary_pro_signup', 'tertiary_pro_signup', 'direct_pro_renewal', 'secondary_pro_renewal', 'tertiary_pro_renewal')`)
*   `transaction_date` (TIMESTAMPTZ, Default: `now()`)
*   `status` (TEXT, NOT NULL, Default: 'pending_payout', CHECK: `status IN ('pending_payout', 'paid_out', 'failed', 'refunded', 'on_hold')`)
*   `payment_id` (TEXT, NULLABLE) - e.g., Stripe transfer ID or internal payment batch ID.
*   `notes` (TEXT, NULLABLE) - For admin notes regarding this commission.

## 3. Database Extensions

*   **`uuid-ossp`**: For `uuid_generate_v4()`. Supabase usually enables this by default.
*   **`postgis`**: Essential for geospatial queries (matching users by location and distance). Needs to be explicitly enabled in Supabase project settings.

## 4. Key Indexes

The following indexes are crucial for performance. Primary Keys (PK) are automatically indexed. Foreign Keys (FK) should generally be indexed.

*   **`profiles` table:**
    *   `CREATE INDEX idx_profiles_username ON profiles (username);`
    *   `CREATE INDEX idx_profiles_location ON profiles USING GIST (ST_MakePoint(longitude, latitude)::geography);` (Requires PostGIS)
    *   `CREATE INDEX idx_profiles_last_active_at ON profiles (last_active_at DESC);`
    *   `CREATE INDEX idx_profiles_dance_styles ON profiles USING GIN (dance_styles);`
    *   `CREATE INDEX idx_profiles_profile_status ON profiles (profile_status);`
    *   `CREATE INDEX idx_profiles_user_tier ON profiles (user_tier);`
    *   `CREATE INDEX idx_profiles_referrer_id ON profiles (referrer_id) WHERE referrer_id IS NOT NULL;`
    *   `CREATE INDEX idx_profiles_referral_code ON profiles (referral_code) WHERE referral_code IS NOT NULL;`
*   **`user_preferences` table:**
    *   (PK `user_id` is sufficient for most lookups)
*   **`swipes` table:**
    *   `CREATE INDEX idx_swipes_swiped_user_id_type ON swipes (swiped_user_id, swipe_type);`
*   **`matches` table:**
    *   (Unique constraint on `(user1_id, user2_id)` creates an index)
    *   `CREATE INDEX idx_matches_user1_id ON matches (user1_id);`
    *   `CREATE INDEX idx_matches_user2_id ON matches (user2_id);`
*   **`chats` table:**
    *   `CREATE INDEX idx_chats_updated_at ON chats (updated_at DESC);`
*   **`messages` table:**
    *   `CREATE INDEX idx_messages_chat_id_created_at ON messages (chat_id, created_at DESC);`
*   **`journal_posts` table:**
    *   `CREATE INDEX idx_journal_posts_user_id_created_at ON journal_posts (user_id, created_at DESC);`
    *   `CREATE INDEX idx_journal_posts_visibility_created_at ON journal_posts (visibility, created_at DESC);`
    *   `CREATE INDEX idx_journal_posts_like_count ON journal_posts (like_count DESC);`
*   **`referrals` table:**
    *   `CREATE INDEX idx_referrals_referrer_user_id ON referrals (referrer_user_id);`
    *   `CREATE INDEX idx_referrals_referred_user_id ON referrals (referred_user_id);`
    *   `CREATE INDEX idx_referrals_status ON referrals (status);`
    *   `CREATE INDEX idx_referrals_originating_referral_id ON referrals (originating_referral_id) WHERE originating_referral_id IS NOT NULL;`
*   **`commission_ledgers` table:**
    *   `CREATE INDEX idx_commission_ledgers_earning_user_id_status ON commission_ledgers (earning_user_id, status);`
    *   `CREATE INDEX idx_commission_ledgers_referral_id ON commission_ledgers (referral_id);`
    *   `CREATE INDEX idx_commission_ledgers_transaction_date ON commission_ledgers (transaction_date DESC);`

**Note:** Further indexing strategies should be evaluated based on actual query patterns and performance monitoring post-launch.

## 5. Row Level Security (RLS) Policies

RLS will be implemented extensively:
*   Users can only read/write their own `profiles` (except for publicly viewable fields by others), `user_preferences`.
*   Profile status (`pending_waitlist_approval`, `incomplete`) may restrict visibility or editability.
*   Users can only create `swipes` for themselves.
*   Users can only read `matches`, `chats`, `messages` they are part of.
*   Users can only create/edit/delete their own `journal_posts`. Visibility of others' posts depends on the post's `visibility` setting.
*   Users can view their own `referrals` (where they are `referrer_user_id` or `referred_user_id`) and their own `commission_ledgers` (where they are `earning_user_id`).
*   Admin roles will have broader access for management purposes.
*   Edge Functions will often operate with elevated privileges (e.g., using the `service_role` key) but will have their own internal logic to enforce permissions based on the authenticated user and business rules (e.g., processing referrals, calculating commissions).

This schema provides a comprehensive foundation for iDance features. It is designed to be evolvable as new requirements emerge.