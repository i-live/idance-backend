# Documentation Update Plan for iDance.live Backend

This document outlines the plan to update the backend documentation files (`architecture.md`, `database.md`, `marketing.md`) to reflect the revised features and strategy for iDance.live.

## I. Core Feature & Strategy Updates to Incorporate:

The following key aspects of iDance.live need to be integrated into the documentation:

1.  **Comprehensive Dance Profile:**
    *   Basic stats, description, preferences.
    *   Dance styles and proficiency levels for each.
    *   Reels (highlight dances), photos, audios.
    *   Awards and other non-dance interests.
    *   Status indicators: looking for dance partners, looking for dance jobs.
    *   Ability to add/link social media profiles (IG, TikTok, LinkedIn, etc.).
    *   **Referrer Requirement:** A valid referrer is needed to activate a profile.

2.  **Swipe Search Functionality:**
    *   Purpose: Find dance partners, team members, co-dancers.
    *   Search criteria: Age, gender, location, dance styles, etc.
    *   Mechanism: Two-way link (mutual swipe) required to connect and enable chat.
    *   Privacy: Contact information hidden until a mutual swipe match.

3.  **Dance Journal & Timeline:**
    *   Users can upload new dances, lifestyle vlogs, etc.
    *   Content gets added to their profile.
    *   Content also appears in a global "Timeline" feed.

4.  **Direct Chat:**
    *   In-app/site messaging between connected dancers.

5.  **Discovery Mechanisms:**
    *   "Timeline" and "Swipe Search" are the primary ways to discover and connect.

6.  **Profile as Personal Dancer Website:**
    *   Profiles can function as a personal website.
    *   Backoffice for customization options.

7.  **Automatic Referral System:**
    *   **Activation:** Inviting another dancer (via referral link or username at signup) links them as referrer.
    *   **Requirement:** Referrer usually required for signup.
    *   **Commissions:**
        *   Lifetime commission from referred person's "Pro" membership fees.
        *   Tiered commission rates (e.g., 10% for 5 referrals, up to 60% for 1000+).
        *   Secondary commissions (up to 10%).
        *   Level 3 commissions (up to 5%).
    *   **Dashboard:** Referral details and tracking available in user's dashboard.

8.  **Pre-Launch Strategy:**
    *   Strong PR and marketing campaigns.
    *   Outreach to dancers for prelaunch participation (briefed by "outgoing AI").
    *   Incentive: Share on social media to start earning lifetime commissions.
    *   **No `Systeme.io` CRM:** Users sign up directly to the main `profiles` table with a 'waitlist' status/flag.

9.  **Pre-Launch Perks for Early Signups:**
    *   Free "Pro" membership for 1 year (value $240).
    *   Personal dance website (customizable profile).
    *   Connection to relevant professional opportunities.

10. **Pricing Tiers:**
    *   **Basic (Free):** Host dance website/profile, limited swipe search, dance reels on timeline.
    *   **Pro ($19.99/year or $24.95/month):** More profile customization, more swipe matches, eligibility for referral commissions.
    *   **VIP (Unlocked, not paid):** Achieved by meeting specific criteria (e.g., video views).

## II. Specific File Update Plan:

### A. `architecture.md`

*   **Section 1: Overview:**
    *   Update the description of iDance to include the dance journal, comprehensive profile features, and the referral system as core components.
*   **Section 2: High-Level Architecture Diagram (Mermaid):**
    *   Remove the "PreLaunch System" subgraph depicting `Systeme.io`.
    *   Modify the user signup flow to show direct interaction with Supabase, potentially with a 'waitlist' state managed within the main system.
    *   Add components or flows representing the "Timeline Service" (if distinct) and the "Referral System" logic (likely Edge Functions).
    *   Illustrate how the "Dance Journal" feeds into profiles and the timeline.
    *   ```mermaid
      graph TD
          UserDevice[Mobile App/Web] -->|HTTPS/WSS| Supabase[Supabase]
          Supabase -->|Auth| AuthN[Authentication]
          Supabase -->|Data| DB[(PostgreSQL)]
          Supabase -->|Logic| EdgeFuncs[Edge Functions]
          Supabase -->|Realtime| RT[Realtime]
          Supabase -->|Storage| Store[Storage]

          UserDevice -->|API| EdgeFuncs
          EdgeFuncs -->|CRUD| DB
          EdgeFuncs -->|Verify| AuthN
          EdgeFuncs -->|Referral Logic| DB
          EdgeFuncs -->|Timeline Logic| DB
          UserDevice -->|Chat| RT
          UserDevice -->|Media (Profile, Journal)| Store

          Admin[Admin] -->|Interface| Dashboard[Supabase Dashboard/Custom Admin Panel]
          Admin -->|Web UI| Panel[Admin Panel]
          Panel -->|API| AdminFunc[Admin Functions]
          AdminFunc -->|Data| DB
          AdminFunc -->|Manage Waitlist| DB
          AdminFunc -->|Manage Referrals| DB

          subgraph UserProfileSystem[User Profile & Customization]
              direction LR
              UserDevice -->|View/Edit Profile| EdgeFuncs
              EdgeFuncs -->|Profile Data| DB
              UserDevice -->|Customize Site| EdgeFuncs
          end

          subgraph PreLaunchSignup[Pre-Launch Signup Flow]
              direction LR
              NewUser[Prospective User] -->|Visit Landing Page| WebFrontend[Web Frontend]
              WebFrontend -->|Signup Form (with Referrer)| EdgeFuncs
              EdgeFuncs -->|Create User (status: waitlist)| AuthN
              EdgeFuncs -->|Create Profile (status: waitlist)| DB
          end

          UserDevice -->|View Timeline| EdgeFuncs
          UserDevice -->|Post to Journal| EdgeFuncs
      ```
*   **Section 3: Frontend:**
    *   Add "Dance Journal Screen" and "Timeline Feed Screen."
    *   Expand "Profile Screen" to include new fields (awards, social links, detailed dance styles/proficiency, referrer info).
    *   Mention "Referral Dashboard Screen."
*   **Section 4: Backend (Supabase):**
    *   **Edge Functions:**
        *   Add functions for: `process_referral_signup`, `calculate_commissions`, `get_timeline_feed`, `create_journal_post`, `manage_waitlist_status`.
        *   Remove/modify functions related to `Systeme.io` integration.
*   **Section 5: Waitlist & Pre-Launch Strategy:**
    *   Completely rewrite this section.
    *   Describe the new flow: direct signup to the app, 'waitlist' flag in the `profiles` table.
    *   Mention the "outgoing AI" briefing and social media sharing for prelaunch participants.
    *   Detail the prelaunch perks.
*   **Section 6: Pro User Features & Domain Handling:**
    *   Update to reflect the new Pro and VIP tiers and their benefits, including referral commissions for Pro.
*   **Section 9: Future Epics & Enhancements Roadmap:**
    *   Ensure "Timeline Feature" and "Referral System" are marked as core if not already, or adjust their priority.
*   **Section 10: Technology Choices Summary:**
    *   Remove `Systeme.io`.

### B. `database.md`

*   **Section 1: Entity Relationship Diagram (ERD) (Mermaid):**
    *   Remove the `waitlist_entries` table.
    *   Add a `status` field (e.g., `active`, `waitlist_pending_approval`, `suspended`) to the `profiles` table.
    *   Add new fields to `profiles` table:
        *   `awards` (JSONB array of objects: `{name: string, year: int, description: string}`)
        *   `other_interests` (JSONB array of strings)
        *   `social_links` (JSONB object: `{instagram: string, tiktok: string, linkedin: string, etc.}`)
        *   `looking_for_partners` (BOOLEAN)
        *   `looking_for_jobs` (BOOLEAN)
        *   `referrer_id` (UUID, FK to `users.id`, NULLABLE)
        *   `referral_code` (TEXT, UNIQUE, NULLABLE)
        *   `commission_tier` (TEXT, NULLABLE)
        *   `profile_status` (TEXT, NOT NULL, Default: 'pending_waitlist_approval', CHECK: `profile_status IN ('pending_waitlist_approval', 'active', 'incomplete', 'suspended', 'vip')`)
        *   Update `dance_styles` to be more structured if needed (e.g., JSONB array of objects: `{style: string, proficiency: string}`).
    *   Add new table: `journal_posts`
        *   `id` (UUID, PK)
        *   `user_id` (UUID, FK to `users.id`)
        *   `type` (TEXT, e.g., 'video', 'vlog', 'text')
        *   `content_url` (TEXT, if media)
        *   `caption` (TEXT)
        *   `created_at`, `updated_at`
    *   Add new table: `referrals`
        *   `id` (UUID, PK)
        *   `referrer_user_id` (UUID, FK to `users.id`)
        *   `referred_user_id` (UUID, FK to `users.id`, UNIQUE)
        *   `status` (TEXT, e.g., 'pending', 'active_pro', 'lapsed')
        *   `commission_earned` (NUMERIC, Default: 0)
        *   `created_at`, `updated_at`
    *   Add new table: `commissions_log` (optional, for detailed tracking)
        *   `id` (UUID, PK)
        *   `referral_id` (UUID, FK to `referrals.id`)
        *   `amount` (NUMERIC)
        *   `transaction_date` (TIMESTAMPTZ)
        *   `level` (INTEGER, 1 for direct, 2 for secondary, etc.)
    *   Update relationships.
    *   ```mermaid
      erDiagram
          users ||--o{ profiles : has
          users ||--o{ user_preferences : "configures"
          users ||--o{ swipes : "initiates"
          users ||--o{ matches : "forms"
          users ||--o{ messages : "sends"
          users ||--o{ journal_posts : "creates"
          users ||--o{ referrals : "is_referrer_for (referred_user_id)"
          users ||--o{ referrals : "is_referred_by (referrer_user_id)"

          profiles {
              uuid user_id PK FK
              string username UK
              string first_name
              string last_name
              date date_of_birth
              string gender
              text bio
              jsonb dance_styles "{style: string, proficiency: string}"
              jsonb awards "{name: string, year: int, description: string}"
              jsonb other_interests "string[]"
              jsonb social_links "{platform: url}"
              boolean looking_for_partners
              boolean looking_for_jobs
              uuid referrer_id FK "nullable"
              string referral_code UK "nullable"
              string commission_tier "nullable"
              string profile_status "default: 'pending_waitlist_approval'"
              string profile_picture_url
              jsonb portfolio_items
              boolean is_pro_user "default: false"
              timestamp pro_subscription_ends_at "nullable"
              timestamp last_active_at
              timestamp created_at
              timestamp updated_at
          }

          user_preferences {
              uuid user_id PK FK
              jsonb discovery_dance_styles
              jsonb discovery_skill_levels
              int min_age
              int max_age
              int distance_miles
              jsonb discovery_gender_preference
              boolean notify_match
              boolean notify_message
              boolean notify_like
              timestamp updated_at
          }

          swipes {
              uuid swiper_user_id PK FK
              uuid swiped_user_id PK FK
              string swipe_type
              timestamp created_at
          }

          matches {
              uuid id PK
              uuid user1_id FK
              uuid user2_id FK
              timestamp created_at
          }

          chats ||--o{ messages : contains
          matches ||--|| chats : has

          chats {
              uuid id PK
              uuid match_id FK UK
              uuid last_message_id FK "nullable"
              timestamp user1_last_read_at "nullable"
              timestamp user2_last_read_at "nullable"
              timestamp created_at
              timestamp updated_at
          }

          messages {
              uuid id PK
              uuid chat_id FK
              uuid sender_id FK
              string content_type
              text content
              string media_url "nullable"
              timestamp created_at
          }

          journal_posts {
              uuid id PK
              uuid user_id FK
              string type "'video', 'vlog', 'text'"
              string content_url "nullable"
              text caption "nullable"
              timestamp created_at
              timestamp updated_at
          }

          referrals {
              uuid id PK
              uuid referrer_user_id FK
              uuid referred_user_id FK UK
              string status "'pending', 'active_pro', 'lapsed'"
              numeric commission_earned "default: 0"
              timestamp created_at
              timestamp updated_at
          }
      ```
*   **Section 2: Table Schemas:**
    *   Remove `waitlist_entries` table schema.
    *   Update `profiles` schema with all new fields mentioned above, including data types, constraints, and defaults. Specify the `profile_status` field to handle waitlist logic.
    *   Add schemas for `journal_posts`, `referrals`, and `commissions_log` (if decided).
*   **Section 4: Key Indexes:**
    *   Add indexes for new tables and fields, e.g., `profiles(referrer_id)`, `profiles(referral_code)`, `profiles(profile_status)`, `journal_posts(user_id)`, `referrals(referrer_user_id)`, `referrals(referred_user_id)`.
*   **Section 5: Row Level Security (RLS) Policies:**
    *   Update policies to account for new tables and profile status (e.g., waitlisted users might have restricted read/write access).

### C. `marketing.md`

*   **Section 2: Pre-Launch Strategy:**
    *   Rewrite "Phase 1", "Phase 2", and "Phase 3" to remove all mentions of `Systeme.io`.
    *   Describe the new direct signup flow: users create accounts directly on iDance.live, their profiles are flagged as 'waitlist' or 'pending_approval'.
    *   Incorporate the "outgoing AI briefing" and the incentive for early users to share on social media for lifetime commissions.
    *   Detail the prelaunch perks (1-year free Pro, personal website, professional opportunities).
*   **Section 5: Affiliate Marketing / Referral Program:**
    *   Completely rewrite this section.
    *   Detail the new automatic referral system: how it works (signup via link/username), commission structure (tiers, lifetime, secondary, tertiary), and the referral dashboard.
    *   Remove investigation of `Systeme.io` for this purpose.
*   **Add a new section for Pricing Tiers:**
    *   Clearly define Basic (Free), Pro (Paid), and VIP (Unlocked) tiers with their respective features and costs as provided.

## III. General Considerations:

*   **Consistency:** Ensure terminology is consistent across all three documents.
*   **Clarity:** Diagrams and descriptions should be clear and easy to understand.
*   **Accuracy:** All technical details must accurately reflect the new system design.

This plan will guide the update process. Each document will be addressed systematically to ensure all new information is correctly integrated.