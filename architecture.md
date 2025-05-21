# iDance - System Architecture (MVP)

This document outlines the proposed system architecture for the "iDance" mobile application's Minimum Viable Product (MVP).

## 1. Overview

iDance is a mobile application designed to connect dancers for various purposes, including finding dance partners, showcasing talent, and building a community. The MVP focuses on core features like user authentication, profiles, swiping-based matching, and chat.

**Guiding Principles for MVP Architecture:**
*   **Rapid Development:** Prioritize technologies and approaches that enable quick iteration (React Native with Expo, Supabase).
*   **Scalability:** Choose a backend (Supabase) that can scale with user growth.
*   **Cost-Effectiveness:** Leverage managed services and free/affordable tiers where possible.
*   **Mobile-First:** Design primarily for iOS and Android.

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    UserDevice[Mobile_App] -->|HTTPS/WSS| Supabase[Supabase]
    Supabase -->|Auth| AuthN[Authentication]
    Supabase -->|Data| DB[(PostgreSQL)]
    Supabase -->|Logic| EdgeFuncs[Edge_Functions]
    Supabase -->|Realtime| RT[Realtime]
    Supabase -->|Storage| Store[Storage]

    UserDevice -->|API| EdgeFuncs
    EdgeFuncs -->|CRUD| DB
    EdgeFuncs -->|Verify| AuthN
    UserDevice -->|Chat| RT
    UserDevice -->|Media| Store

    AdminUser[Admin User] -->|Web Interface/Direct| SupabaseDashboard[Supabase Dashboard]
    AdminUser -->|Web Interface| AdminPanel[Minimal Admin Panel (Web App)]
    AdminPanel -->|API Calls| AdminEdgeFuncs{Admin-Specific Edge Functions}
    AdminEdgeFuncs --> DB

    subgraph Pre-Launch & Waitlist System
        direction LR
        ProspectiveUser[Prospective User] -->|Browser| PrelaunchSite[prelaunch.idance.live (Static Site)]
        PrelaunchSite -->|Email Form Submit| SystemeIOForms[Systeme.io Forms/Landing Page]
        SystemeIOForms -->|Webhook/API (Future)| SupabaseWaitlistCapture[Edge Function: Capture to Waitlist Table]
        SystemeIOForms -->|User Data| SystemeIOCRM[Systeme.io CRM (Email Sequences, Management)]
        AdminUser -->|Manual Review| SystemeIOCRM
        AdminUser -->|Approve/Import| WaitlistImportProcess[Process to Import to Main DB]
    end

    subgraph Pro User Domain Handling (Post-MVP Refinement)
        direction LR
        UserCustomDNS[User's Custom Domain DNS] -- CNAME --> Cloudflare[Cloudflare for idance.live]
        Cloudflare -->|Forward/Proxy| ProfileServerLogic[Profile Serving Logic (e.g., Edge Function / Web App)]
        ProfileServerLogic --> DB
    end

    UserDevice -.->|Future: Epic 2| TimelineService[Timeline Feature Service]
    UserDevice -.->|Future: Epic 3| CompetitionService[Competition Feature Service]
    UserDevice -.->|Future: Post-MVP| IDVerificationService[ID Verification (3rd Party for Official, AI for Photo Match)]
```

## 3. Frontend: React Native with Expo

*   **Platform:** React Native with Expo (Managed Workflow + EAS Build).
*   **Language:** TypeScript.
*   **Core Responsibilities:**
    *   User Interface (UI) and User Experience (UX).
    *   Client-side state management.
    *   Communication with Supabase backend (Auth, Database, Edge Functions, Storage, Realtime).
    *   Handling user input and gestures.
    *   Requesting necessary device permissions (location, camera, photo library).
*   **Key Modules/Screens (MVP - Epic 1):**
    *   **Authentication:**
        *   Signup Screen (Email/Password)
        *   Login Screen
        *   Password Reset Flow
    *   **Onboarding/Waitlist Completion:**
        *   Screens to complete profile details if invited from waitlist.
    *   **Main App:**
        *   Home/Swipe Screen: Displaying profiles, swipe gestures (like, pass, superlike).
        *   Profile Screen:
            *   View/Edit Own Profile (including `partner_seeking_status` toggle).
            *   View Other Users' Profiles.
            *   Portfolio section (photos/videos).
        *   "Likes You" Screen: Grid of users who liked the current user.
        *   Matches Screen: List of mutual matches.
        *   Chat List Screen: List of ongoing conversations.
        *   Chat Screen: Individual conversation view.
        *   Settings/Search Configuration Screen: User preferences for discovery (age, distance, dance styles, skill level).
        *   Pro Subscription Screen (UI placeholder, functionality deferred).
*   **Navigation:** React Navigation.
*   **State Management:** Zustand, Redux Toolkit, or React Context (to be decided based on complexity, Zustand often a good balance).
*   **API Client:** Supabase JavaScript Client Library (`supabase-js`).
*   **Deployment:** Expo Application Services (EAS) Build for creating development and production builds for iOS and Android app stores.

## 4. Backend: Supabase

Supabase provides the BaaS (Backend as a Service) platform.

*   **Authentication (Supabase Auth):**
    *   Email/Password signup and login.
    *   Secure JWT (JSON Web Token) handling.
    *   Row Level Security (RLS) policies on database tables to enforce data access rules.
    *   Auth Hooks (e.g., to trigger an Edge Function on new user signup to create a profile).
*   **Database (Supabase Postgres):**
    *   PostgreSQL database.
    *   Schema detailed in `backend/database.md`.
    *   **PostGIS Extension:** Enabled for geospatial queries (location-based matching).
    *   RLS heavily utilized for data security.
*   **Edge Functions (Supabase Functions - Deno/TypeScript):**
    *   Serverless functions for custom backend logic.
    *   Examples for MVP:
        *   `on_user_signup`: Triggered by Auth to create an initial user profile.
        *   `get_swipe_candidates`: Fetches profiles for the swipe screen based on user preferences and location (using PostGIS).
        *   `process_swipe`: Handles like/pass/superlike logic, checks for new matches, creates match records.
        *   `update_user_profile`: Handles profile updates.
        *   `get_user_profile`: Fetches a specific user's profile.
        *   `get_likes_received`: Fetches users who liked the current user.
        *   `get_matches`: Fetches mutual matches.
        *   `handle_pro_subscription_webhook`: (Deferred, for Pro Tier launch) Listens for Stripe webhooks to update subscription status.
        *   Admin-specific functions for waitlist processing.
*   **Realtime (Supabase Realtime):**
    *   Used for live chat functionality.
    *   Potentially for real-time notifications (new match, new message, new like).
*   **Storage (Supabase Storage):**
    *   Storing user-uploaded media: profile pictures, portfolio photos/videos.
    *   Access control integrated with RLS policies.

## 5. Waitlist & Pre-Launch Strategy

*   **Phase 1: Initial Interest Capture (`prelaunch.idance.live`)**
    *   A simple, attractive static landing page (e.g., built with a static site generator like Astro/Next.js static export, or a simple HTML/CSS/JS page).
    *   Hosted on services like Vercel, Netlify, or GitHub Pages.
    *   Clear Call to Action: "Join the iDance Pre-Launch Access!" or similar.
    *   Embedded form or link to a form hosted on **Systeme.io** to capture email addresses. The depth of integration with Systeme.io (e.g., for direct data submission from `prelaunch.idance.live` to Systeme.io via API, or for affiliate tracking) will depend on the capabilities exposed by their API (`https://developer.systeme.io/reference/api`). Manual review of this documentation by the development team is required. Initial MVP will rely on Systeme.io's forms and built-in CRM/email features.
*   **Phase 2: Detailed Application & CRM**
    *   Users who submit their email receive an automated email (via Systeme.io).
    *   Email links to a multi-step "application form" (hosted on Systeme.io) to collect detailed profile information (name, dance styles, bio, location intent, etc., mirroring fields in the `profiles` table).
    *   Data collected and managed within Systeme.io CRM.
    *   Systeme.io used for sending out hype-building email sequences.
*   **Phase 3: Manual Review & Invitation**
    *   Admin reviews applications in Systeme.io.
    *   Approved applicants are marked. Data can be exported from Systeme.io and imported into the main Supabase `profiles` table (or a staging `waitlist_profiles` table) via a script or manual process for MVP.
    *   Accepted users receive an email confirming their pre-launch access and eventual app download instructions.

## 6. Pro User Features & Domain Handling

*   **Pro Subscription (Phased Rollout):**
    *   The Pro tier and associated payment integration (Stripe) will be implemented after establishing an initial user base (e.g., ~10k users or as strategically decided), allowing the MVP to launch as a free service initially.
    *   When active, Pro subscriptions will be managed via Stripe integration. Edge Functions will handle communication with Stripe API.
*   **User Profile URLs (`idance.live/username`):**
    *   The primary URL structure for user profiles will be path-based (e.g., `idance.live/theirusername`) for better platform SEO. The `idance.live` domain will be managed via a DNS provider (e.g., Cloudflare). Application routing will handle serving the correct profile.
*   **AI-Powered Profile Optimization (Future Pro Feature):**
    *   Offer tools to Pro users to enhance their profile's discoverability within iDance. This includes content analysis for keyword suggestions and automatic generation of structured data (Schema.org) for their iDance profile page.
*   **Custom Domains for Pro Users (Post-Pro Tier Launch):**
    *   Pro users can map their own custom domains (e.g., `www.dancerjane.com`) to their iDance profile. This involves users pointing a CNAME record from their custom domain to an iDance endpoint.
    *   Verification process needed (e.g., checking DNS records).

## 7. Admin Panel

*   **MVP Requirement:** Minimal functionality for reviewing and processing waitlist applications from Systeme.io (could be manual export/import initially, or a very simple secure web interface calling admin-specific Edge Functions).
*   **Post-MVP:** A dedicated web application (`dashboard/` or `admin/` repo) for:
    *   User management (view, suspend, delete).
    *   Content moderation (future).
    *   Viewing basic analytics.
    *   Managing reported content.

## 8. Deployment Strategy

*   **Frontend (React Native App - `app/`):**
    *   EAS Build for creating and submitting builds to Apple App Store and Google Play Store.
    *   EAS Update for over-the-air updates of JS bundle (for non-native changes).
*   **Backend (Supabase):**
    *   Database migrations managed via Supabase CLI or SQL scripts.
    *   Edge Functions deployed via Supabase CLI.
*   **Pre-Launch Site (`prelaunch/`):**
    *   Deployed to a static hosting provider (Vercel, Netlify, Cloudflare Pages).
*   **Admin Panel (`dashboard/` - Post-MVP):**
    *   Deployed as a web application (e.g., to Vercel, Netlify).

## 9. Future Epics & Enhancements Roadmap (High-Level)

*   **Epic 1: MVP Launch (Core Functionality)**
    *   Auth, Profiles, Swiping, Matching, Chat, Waitlist System, Pro Feature Foundation (Subscription deferred).
    *   *Early Enhancement:* Simple auto-message prompt post-match.
*   **Epic 2: Timeline Feature**
    *   TikTok-style vertical video feed for general dance content.
    *   Likes, comments, ranking.
    *   Content moderation tools (AI-assisted + manual).
*   **Epic 3: Competition Feature**
    *   User/Admin created competitions.
    *   Voting mechanisms.
    *   Sponsor branding placeholders.
*   **Post-MVP Enhancements (Potential Order TBD):**
    *   **ID Verification System:** For official government ID verification, integrate a 3rd party service (e.g., Persona, Veriff - recommended, post-MVP). For a lighter 'Profile Photo Liveness/Match' badge, explore in-house solutions with AI libraries/services (post-MVP).
    *   **Advanced AI Matchmaking:** Beyond basic filters.
    *   **AI Profile Optimization & SEO for Pro User Pages:** (As described in Pro Features).
    *   **AI Smart Replies/Icebreakers in Chat.**
    *   **Full-Fledged Affiliate System:** (If Systeme.io isn't sufficient or deeper integration needed).
    *   **Group Features/Events.**
    *   **Advanced Admin Dashboard.**
    *   **Vector Search for Content Discovery.**

## 10. Technology Choices Summary

*   **Mobile App:** React Native with Expo (TypeScript)
*   **Backend:** Supabase (Postgres, Auth, Edge Functions, Realtime, Storage)
*   **Pre-Launch/Waitlist CRM & Email:** Systeme.io
*   **Payment Processing:** Stripe
*   **DNS/CDN (for `idance.live`):** Cloudflare (recommended)
*   **Package Management (Monorepo if adopted):** pnpm

This architecture aims to provide a solid foundation for the iDance MVP, balancing speed of development with scalability and future growth potential.