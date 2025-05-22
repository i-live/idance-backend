# iDance - System Architecture

This document outlines the system architecture for the "iDance" mobile application and web platform.

## 1. Overview

iDance is a mobile application and web platform designed to connect dancers for various purposes, including finding dance partners, building professional networks, and fostering a vibrant community. It features comprehensive user profiles (showcasing dance styles, proficiency, reels, photos, awards, social links), a swipe-based search for connections, a personal dance journal that feeds into a main timeline, direct chat capabilities, and an integrated referral system. The initial development focuses on establishing these core functionalities alongside robust user authentication.

**Guiding Principles for Architecture:**
*   **Rapid Development:** Prioritize technologies and approaches that enable quick iteration (React Native with Expo, Supabase, potentially a modern web framework like Next.js or Remix).
*   **Scalability:** Choose a backend (Supabase) that can scale with user growth.
*   **Cost-Effectiveness:** Leverage managed services and free/affordable tiers where possible.
*   **Mobile-First & Web Presence:** Design primarily for iOS and Android, with a corresponding web presence for profiles, timeline, and core interactions.

## 2. High-Level Architecture Diagram

```mermaid
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
    AdminFunc -->|Manage Waitlist/Profile Status| DB
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

    UserDevice -.->|Future| Competition[Competition Service]
    UserDevice -.->|Future| Verify[ID Verification]
```

## 3. Frontend: React Native with Expo & Web

*   **Platform:** React Native with Expo (Managed Workflow + EAS Build) for mobile; A modern web framework (e.g., Next.js, Remix, Astro, SvelteKit - TBD) for the web frontend.
*   **Language:** TypeScript.
*   **Core Responsibilities:**
    *   User Interface (UI) and User Experience (UX) across platforms.
    *   Client-side state management.
    *   Communication with Supabase backend (Auth, Database, Edge Functions, Storage, Realtime).
    *   Handling user input and gestures.
    *   Requesting necessary device permissions (location, camera, photo library for mobile).
*   **Key Modules/Screens (across Mobile & Web where applicable):**
    *   **Authentication & Onboarding:**
        *   Signup Screen (Email/Password, Referrer Code/Username input).
        *   Login Screen.
        *   Password Reset Flow.
        *   Profile Creation/Completion Flow (for new users, including initial 'waitlist' or 'pending_approval' status).
    *   **Main App Features:**
        *   Timeline Feed Screen: Displaying dance journal posts from the community.
        *   Swipe Screen (primarily mobile, potential web adaptation): Discovering and connecting with other dancers based on preferences.
        *   Profile Screen (Publicly viewable via web, editable by owner):
            *   View/Edit Own Profile: Comprehensive details - basic stats, description, preferences, dance styles (with proficiency levels), reels (videos), photos, audios, awards, other interests, social media links, looking for partners/jobs status, referrer information.
            *   View Other Users' Profiles.
            *   Personal Dance Journal: Upload/manage posts (videos, vlogs, text).
        *   "Likes You" Screen: Grid of users who liked the current user.
        *   Matches Screen: List of mutual matches.
        *   Chat List Screen: List of ongoing conversations.
        *   Chat Screen: Individual conversation view.
        *   Settings & Search Configuration Screen: User preferences for discovery (age, distance, dance styles, skill level, gender etc.).
        *   Referral Dashboard Screen: Track referrals, commission status, and referral links/codes.
        *   Subscription Management Screen: View current tier (Basic, Pro, VIP), manage Pro subscription.
        *   Backoffice for Profile Site Customization.
*   **Navigation:** React Navigation (Mobile), appropriate web routing solution (e.g., Next.js router).
*   **State Management:** Zustand, Redux Toolkit, React Context, or framework-specific solutions (e.g., Svelte stores).
*   **API Client:** Supabase JavaScript Client Library (`supabase-js`).
*   **Deployment:**
    *   Mobile: Expo Application Services (EAS) Build for app stores.
    *   Web: Vercel, Netlify, Cloudflare Pages, or similar PaaS.

## 4. Backend: Supabase

Supabase provides the BaaS (Backend as a Service) platform.

*   **Authentication (Supabase Auth):**
    *   Email/Password signup and login (including referrer capture during signup).
    *   Secure JWT (JSON Web Token) handling.
    *   Row Level Security (RLS) policies on database tables to enforce data access rules.
    *   Auth Hooks (e.g., to trigger an Edge Function on new user signup to create a profile with 'waitlist' status and process referrer).
*   **Database (Supabase Postgres):**
    *   PostgreSQL database.
    *   Schema detailed in `database.md`.
    *   **PostGIS Extension:** Enabled for geospatial queries (location-based matching).
    *   RLS heavily utilized for data security.
*   **Edge Functions (Supabase Functions - Deno/TypeScript):**
    *   Serverless functions for custom backend logic. Examples:
        *   `on_user_signup`: Triggered by Auth to create an initial user profile (with 'pending_waitlist_approval' status and handling referrer details).
        *   `get_swipe_candidates`: Fetches profiles for the swipe screen based on user preferences and location.
        *   `process_swipe`: Handles like/pass/superlike logic, checks for new matches, creates match records.
        *   `update_user_profile`: Handles comprehensive profile updates (dance styles, proficiency, awards, social links, etc.).
        *   `get_user_profile`: Fetches a specific user's profile (public and private views).
        *   `get_likes_received`: Fetches users who liked the current user.
        *   `get_matches`: Fetches mutual matches.
        *   `handle_subscription_webhook`: Listens for Stripe webhooks to update Pro subscription status.
        *   `process_referral_signup`: Validates referrer, links users, initializes referral status.
        *   `calculate_commissions`: Calculates and potentially logs commissions for Pro referrals (multi-level).
        *   `get_timeline_feed`: Aggregates and serves content for the main timeline from dance journals.
        *   `create_journal_post`: Handles creation of new dance journal entries (videos, vlogs, text).
        *   `manage_profile_status`: Admin function to approve/manage users (e.g., from 'pending_waitlist_approval' to 'active').
        *   `get_referral_dashboard_data`: Fetches data for the user's referral dashboard.
        *   Functions for profile site customization.
*   **Realtime (Supabase Realtime):**
    *   Used for live chat functionality.
    *   Potentially for real-time notifications (new match, new message, new like, timeline updates).
*   **Storage (Supabase Storage):**
    *   Storing user-uploaded media: profile pictures, portfolio items (reels, photos, audios), dance journal content.
    *   Access control integrated with RLS policies.

## 5. Pre-Launch Strategy & Waitlist Management

The pre-launch strategy focuses on generating early interest, onboarding initial users directly into the platform with a 'waitlist' or 'pending approval' status, and incentivizing viral growth through the integrated referral system.

*   **Phase 1: Initial Interest & Direct Signup (`idance.live`)**
    *   **Landing Page:** A compelling landing page on `idance.live` showcasing the vision, core features (comprehensive profiles, swipe search, dance journal, timeline, referral system), and pre-launch benefits.
    *   **Direct Signup:** Users sign up directly through the platform (web or early app version).
        *   Signup includes email, password, and an optional referrer code/username.
        *   Upon signup, user accounts are created in Supabase Auth.
        *   Corresponding entries in the `profiles` table are created with a `profile_status` of 'pending_waitlist_approval' (or similar).
    *   **"Outgoing AI" Briefing Narrative:** Marketing communications may include the concept of an "outgoing AI" that briefs potential prelaunch participants on the platform and its benefits, encouraging early adoption and social sharing.

*   **Phase 2: Profile Completion & Engagement**
    *   Users are encouraged to start filling out their profiles even while on the waitlist to expedite activation and enhance their future visibility.
    *   Automated emails (e.g., via Supabase custom SMTP or integrated email services like Resend/Postmark) can guide users, provide updates, and build anticipation.

*   **Phase 3: Admin Review & Activation**
    *   Administrators review profiles with 'pending_waitlist_approval' status via a custom admin panel or the Supabase dashboard.
    *   Approved users have their `profile_status` changed to 'active'.
    *   Activated users receive notification and gain full access to the platform's features.

*   **Pre-Launch Perks for Early Signups:**
    *   **Free Pro Membership:** One year of "Pro" membership (valued at $240).
    *   **Personal Dance Website:** Full access to profile customization features, allowing them to use their iDance profile as their primary online dance presence.
    *   **Professional Opportunities:** Early access to features designed to connect dancers with relevant professional opportunities.
    *   **Early Commission Earning:** Participants who share their referral link/code on social media can start accumulating referrals. Commissions become active once they and their referrals meet Pro membership criteria and payments are processed.

This streamlined approach integrates users directly into the iDance ecosystem from day one, leveraging the platform's own capabilities for waitlist management and eliminating dependency on external CRM for this core function.

## 6. User Tiers, Features & Domain Handling

iDance will offer distinct user tiers with varying levels of access and features:

*   **Basic Tier (Free):**
    *   Host a personal dance website/profile with standard customization.
    *   Limited swipe search functionality (e.g., daily swipe cap).
    *   Ability to post to dance journal and have reels/posts appear on the timeline (with potential limits).
    *   Access to basic community features and chat.

*   **Pro Tier (Paid Subscription):**
    *   **Pricing:** $19.99/year or $24.95/month.
    *   All Basic Tier features.
    *   Enhanced profile customization options for their personal dance website.
    *   Increased swipe match limits and potentially advanced search filters.
    *   **Eligibility for Referral Commissions:** Pro members can earn commissions from their referred users' Pro subscriptions as per the multi-level referral system (e.g., direct, secondary, tertiary).
    *   Potential future access to AI-powered profile optimization tools and other premium features.
    *   Stripe integration will manage subscriptions, with Edge Functions handling webhook events for status updates.

*   **VIP Tier (Unlocked, Not Paid):**
    *   Achieved by meeting specific criteria (e.g., high engagement, significant number of views on dance journal content, community contributions, number of successful Pro referrals).
    *   All Pro Tier benefits.
    *   Exclusive perks, early access to new features, increased visibility, or special badges (details TBD).

*   **User Profile URLs (`idance.live/username`):**
    *   The primary URL structure for user profiles will be path-based (e.g., `idance.live/theirusername`) for better platform SEO and shareability. The `idance.live` domain will be managed via a DNS provider (e.g., Cloudflare). Application routing will handle serving the correct profile.

*   **Custom Domains for Pro/VIP Users (Future Enhancement):**
    *   Pro/VIP users may, in the future, be able to map their own custom domains (e.g., `www.dancerjane.com`) to their iDance profile. This would involve users pointing a CNAME record from their custom domain to an iDance endpoint, with a verification process.

## 7. Admin Panel

*   **MVP Requirement:** Functionality for reviewing and activating user profiles from the waitlist (those with 'pending_waitlist_approval' or similar status). Management of referral system parameters (e.g., commission rates) and basic oversight. This will be achieved via a custom admin panel or directly through the Supabase dashboard with appropriate helper functions/scripts.
*   **Post-MVP:** A dedicated web application (`dashboard/` or `admin/` repo) for:
    *   User management (view, suspend, delete, manage roles/tiers, edit profiles).
    *   Content moderation (timeline posts, profiles, journal entries).
    *   Viewing platform analytics and user activity.
    *   Managing reported content.
    *   Overseeing the referral program, commission payouts, and resolving disputes.

## 8. Deployment Strategy

*   **Frontend (Mobile - `app/`):**
    *   EAS Build for creating and submitting builds to Apple App Store and Google Play Store.
    *   EAS Update for over-the-air updates of JS bundle (for non-native changes).
*   **Frontend (Web - `web/` or similar):**
    *   Deployed to a static/SSR hosting provider (Vercel, Netlify, Cloudflare Pages).
*   **Backend (Supabase):**
    *   Database migrations managed via Supabase CLI or SQL scripts (version controlled).
    *   Edge Functions deployed via Supabase CLI.
*   **Landing Page (`idance.live` initially, then main web app):**
    *   Deployed to a static hosting provider or as part of the main web application.
*   **Admin Panel (`dashboard/` - Post-MVP):**
    *   Deployed as a web application (e.g., to Vercel, Netlify).

## 9. Future Epics & Enhancements Roadmap (High-Level)

*   **Epic 1: MVP Launch (Core Functionality)**
    *   Auth, Comprehensive Profiles (including dance styles/proficiency, awards, social links, reels, photos, audios), Swiping, Matching, Chat, Direct Waitlist System, Core Referral System (signup, tracking, multi-level structure), Dance Journal & Timeline, Basic/Pro/VIP Tier Foundation (Pro Subscription payments can be activated post-initial user seeding, but structure in place).
    *   *Early Enhancement:* Simple auto-message prompt post-match, basic profile customization backoffice.
*   **Epic 2: Full Pro Features & Monetization**
    *   Full Stripe integration for Pro subscriptions and commission payouts.
    *   Automated commission calculation and detailed dashboard for Referral System.
    *   Enhanced Pro profile customization options.
*   **Epic 3: Community & Engagement Features**
    *   Advanced Timeline features (comments, advanced ranking/filtering, discovery algorithms).
    *   Content moderation tools (AI-assisted + manual).
    *   Competition Feature (User/Admin created, voting mechanisms, sponsor branding placeholders).
*   **Post-MVP Enhancements (Potential Order TBD):**
    *   **ID Verification System:** For enhanced trust and safety.
    *   **Advanced AI Matchmaking:** Beyond basic filters, incorporating compatibility scores.
    *   **AI Profile Optimization & SEO for Pro/VIP User Pages.**
    *   **AI Smart Replies/Icebreakers in Chat.**
    *   **Advanced Referral System Features:** (e.g., detailed analytics dashboard for referrers, gamification).
    *   **Group Features/Events/Local Communities.**
    *   **Advanced Admin Dashboard with comprehensive analytics and user management tools.**
    *   **Vector Search for Content Discovery (profiles, journal posts).**

## 10. Technology Choices Summary

*   **Mobile App:** React Native with Expo (TypeScript)
*   **Web App:** Modern Web Framework (e.g., Next.js, Remix, Astro, SvelteKit - TypeScript, TBD)
*   **Backend:** Supabase (Postgres, Auth, Edge Functions, Realtime, Storage)
*   **Payment Processing:** Stripe
*   **DNS/CDN (for `idance.live`):** Cloudflare (recommended)
*   **Package Management (Monorepo if adopted):** pnpm or similar (e.g., Turborepo, Nx)

This architecture aims to provide a solid foundation for iDance, balancing speed of development with scalability and future growth potential.