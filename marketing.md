# iDance - Marketing & Pre-Launch Strategy (MVP)

This document outlines initial marketing, pre-launch, and user acquisition strategies for the "iDance" application MVP.

## 1. Target Audience (Initial Focus)

*   **Primary:** Young adults (18-30, skewing slightly towards 18-25 females) interested in various forms of dance, from social and partner dances to street styles, performance, and fitness-based dance.
*   **Secondary:**
    *   More experienced dancers looking for professional connections or to showcase their portfolio.
    *   Dance event organizers and studio owners (future potential for partnerships).
*   **Psychographics:**
    *   Socially active, digitally native.
    *   Passionate about dance as a hobby, lifestyle, or profession.
    *   Seeking connections, community, self-expression, and opportunities.
    *   Likely users of apps like Instagram, TikTok, Tinder, Bumble.

## 2. Pre-Launch Strategy: "iDance Exclusive Access"

The goal is to build hype, gather a list of engaged early adopters, and pre-populate the app with quality profiles before the public launch.

*   **Phase 1: Initial Interest & Email Capture (`prelaunch.idance.live`)**
    *   **Website:** A visually appealing, mobile-responsive landing page hosted at `prelaunch.idance.live`.
        *   **Content:**
            *   Compelling headline: "The Future of Dance Connections is Coming." / "Find Your Rhythm. Find Your Partner. Find Your Crew."
            *   Short, engaging video (mockups, animations, vision statement).
            *   Brief overview of key features (Swiping, Detailed Profiles, Future: Pro Tier, Timeline & Competitions).
            *   Clear Call to Action (CTA): "Join the iDance Exclusive Access List!" / "Get Your Early Invite!"
        *   **Technology:** Static site (Astro, Next.js static export, or simple HTML/CSS/JS) hosted on Vercel/Netlify. `idance.live` will redirect here initially.
    *   **Email Capture:**
        *   Form embedded on `prelaunch.idance.live` integrating directly with **Systeme.io**.
        *   Collect only email address at this stage to minimize friction.

*   **Phase 2: Detailed Application & CRM Engagement (via Systeme.io)**
    *   **Automated Email:** Upon email submission, an automated welcome email is sent via Systeme.io.
        *   Thanks the user for their interest.
        *   Invites them to "complete their exclusive access application" to be among the first to experience iDance.
        *   Links to a multi-step application form hosted/created within Systeme.io.
    *   **Application Form (Systeme.io):**
        *   Collects detailed profile information (first/last name, username preference, dance styles, skill level, location intent, bio snippets, gender, etc. – mirroring `profiles` table fields).
        *   Reinforces exclusivity and benefits of early access.
        *   Informs users that applications will be reviewed.
    *   **CRM & Email Sequences (Systeme.io):**
        *   Manage all applicants within Systeme.io CRM.
        *   Develop an email sequence to:
            *   Keep applicants engaged (sneak peeks, behind-the-scenes, dance tips).
            *   Build anticipation for launch.
            *   Educate them about app features.

*   **Phase 3: Manual Review & Invitation**
    *   Admin team reviews submitted applications in Systeme.io for quality and completeness.
    *   Approved applicants are tagged/segmented in Systeme.io.
    *   Data for approved applicants is exported from Systeme.io and imported into the main Supabase `profiles` table (or a staging `waitlist_profiles` table) before launch.
    *   **Acceptance Email:** Sent to approved applicants, confirming their "Exclusive Access" status, providing an estimated launch window, and instructions on what to expect next (e.g., app download link when ready).

## 3. Positioning & Messaging

*   **Inclusive Platform:** While partner finding is a core feature, emphasize that iDance is for *all* dancers.
    *   "Your Dance World, Connected."
    *   "Connect, Collaborate, Create."
    *   Highlight the profile as a personal dance portfolio.
*   **Empowerment & Expression:** Focus on how iDance helps users express their passion and achieve their dance goals.
*   **Safety & Authenticity:** (Post-MVP with ID verification) Highlight features that promote a safe and genuine community.

## 4. Initial User Acquisition Channels (Post-Pre-Launch)

*   **Leverage Pre-Launch List:** The primary source of initial users.
*   **Organic Social Media:**
    *   Create engaging content on Instagram, TikTok, YouTube Shorts showcasing dance, app features, and user stories (from early adopters).
    *   Use relevant hashtags.
*   **Dance Communities & Influencers:**
    *   Reach out to dance schools, university dance clubs, local dance event organizers for partnerships or shoutouts.
    *   Collaborate with dance influencers for reviews or sponsored content (consider budget).
*   **App Store Optimization (ASO):**
    *   Optimize app title, description, keywords, and screenshots for app store search.
*   **Public Relations (Local/Niche):**
    *   Reach out to local news outlets or dance-focused blogs/magazines.

## 5. Affiliate Marketing / Referral Program (Future Growth)

*   **Systeme.io Investigation:** The development team will need to manually review Systeme.io's API documentation (`https://developer.systeme.io/reference/api`) to determine the feasibility of deep integration for affiliate tracking and other automations. Initial use will focus on Systeme.io's built-in forms, CRM, and email sequence capabilities.
    *   If their API allows for robust affiliate tracking and conversion reporting, it can be leveraged.
*   **Manual Partnerships & Simple Referral Codes (MVP):** Initially, focus on building relationships with key community organizers or influencers. A simple in-app referral code system (e.g., users get a code to share, new signups can enter it) can be implemented to track basic referrals, with any rewards managed manually.
*   **Formal Program (Post-Pro Tier Launch):** Develop a more structured affiliate/referral program with clear rewards and automated tracking once the Pro tier is launched and if Systeme.io's capabilities (or an alternative solution) support it.

## 6. Key Marketing Metrics (To Track)

*   **Pre-Launch:**
    *   Landing page visits (`prelaunch.idance.live`).
    *   Email sign-up conversion rate.
    *   Application form completion rate.
    *   Email open/click-through rates.
*   **Post-Launch:**
    *   App downloads.
    *   User activation rate (completing profile).
    *   Daily Active Users (DAU) / Monthly Active Users (MAU).
    *   Engagement metrics (swipes per user, matches per user, messages sent).
    *   Pro feature adoption rate (once Pro tier is launched).
    *   User retention rate.

This marketing plan provides a starting point and should be iterated upon based on performance and user feedback.