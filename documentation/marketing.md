# iDance - Marketing, Pre-Launch & Growth Strategy

This document outlines marketing, pre-launch, user acquisition, and growth strategies for the "iDance" application and web platform.

## 1. Target Audience

*   **Primary:** Dancers of all levels (18-35+), including professionals, amateurs, and hobbyists. This includes individuals interested in social dance, partner dances (Latin, Ballroom), street styles, performance art, contemporary, ballet, and fitness-based dance.
*   **Secondary:**
    *   Dance event organizers, studio owners, choreographers, and talent scouts seeking dancers or promoting opportunities.
    *   Dance teams and crews looking for members.
*   **Psychographics:**
    *   Socially active, digitally native, and often creators/consumers of online dance content.
    *   Passionate about dance as a form of self-expression, community building, professional development, or a healthy lifestyle.
    *   Seeking connections (partners, collaborators, friends, mentors), opportunities (jobs, auditions, performances), and a platform to showcase their talent and journey.
    *   Likely users of platforms like Instagram, TikTok, YouTube, LinkedIn (for professionals), and potentially niche community forums.

## 2. Pre-Launch Strategy: "iDance Genesis Network"

The goal is to build initial hype, cultivate a foundational community of engaged early adopters, pre-populate the platform with diverse and quality profiles, and kickstart the referral engine before public launch.

*   **Phase 1: Awareness & Initial Interest (`idance.live`)**
    *   **Website:** A dynamic and visually appealing landing page at `idance.live`.
        *   **Content:**
            *   Compelling headline: "iDance: Connect Your Passion. Amplify Your Dance." / "The Network for Dancers, Built by Dancers."
            *   Engaging video showcasing mockups, the vision, and diverse dance styles.
            *   Clear overview of core features: Comprehensive Profiles (personal dance website), Swipe Search, Dance Journal & Timeline, Direct Chat, and the powerful Referral System.
            *   Highlight Pre-Launch Perks (see below).
            *   Clear Call to Action (CTA): "Join the iDance Genesis Network!" / "Secure Your Early Access & Lifetime Benefits!"
        *   **Technology:** Web application capable of handling direct signups (e.g., Next.js, Remix).
    *   **Direct Signup & "Outgoing AI" Narrative:**
        *   Users sign up directly on `idance.live`, providing email, password, and an optional referrer code/username.
        *   Upon signup, accounts are created with a `profile_status` of 'pending_waitlist_approval'.
        *   Marketing communications will feature an "Outgoing AI Onboarding Specialist" persona that guides users through the pre-launch benefits and encourages them to complete their profiles and share their unique referral link/code on social media to start building their network and potential commission streams immediately.

*   **Phase 2: Profile Enrichment & Community Seeding**
    *   **Profile Completion Drive:** Encourage users to fully complete their profiles (dance styles, proficiency, reels, photos, bio, social links, etc.) while on the waitlist. This enhances their visibility upon activation and helps populate the platform.
    *   **Early Engagement:** Utilize automated emails (via integrated services like Resend/Postmark or Supabase custom SMTP) and potential early access to a limited version of the platform (e.g., profile editing, basic timeline view) for approved pre-launch members to foster engagement.
    *   **Content Seeding:** Potentially work with a small group of "Founding Dancers" to pre-populate the timeline with engaging dance journal content.

*   **Phase 3: Admin Review, Activation & Phased Rollout**
    *   Admins review 'pending_waitlist_approval' profiles for authenticity and completeness.
    *   Approved users are activated (`profile_status` changed to 'active').
    *   Activated users receive a welcome notification, full platform access, and their pre-launch perks are applied (e.g., Pro status for 1 year).
    *   A phased rollout might occur, gradually activating users to manage server load and gather initial feedback.

*   **Pre-Launch Perks for "Genesis Network" Members:**
    *   **Free "Pro" Membership for 1 Year:** Full access to Pro features (valued at $240).
    *   **Personal Dance Website:** Premium customization options for their iDance profile, usable as their primary online dance presence.
    *   **Priority Access to Professional Opportunities:** Early visibility for job postings or collaboration requests.
    *   **Lifetime Commission Foundation:** By sharing their referral link during pre-launch, they can build a downline. Commissions become active once they and their referrals meet Pro membership criteria and payments are processed.
    *   Potential for "Genesis Member" badge or recognition.

## 3. Pricing Tiers & Value Proposition

*   **Basic Tier (Free):**
    *   **Features:** Create and host a personal dance website/profile with standard customization; upload dance reels/journal posts to profile and timeline (with potential limits); limited swipe search functionality (e.g., daily cap); access to basic community features and chat.
    *   **Value:** A no-cost entry point to showcase talent, discover others, and engage with the dance community.

*   **Pro Tier (Subscription):**
    *   **Pricing:** $19.99/year (annual billing) or $24.95/month (monthly billing).
    *   **Features:** All Basic Tier features PLUS:
        *   Enhanced profile customization options for their personal dance website.
        *   Increased swipe match limits and potentially advanced search filters.
        *   **Full Eligibility for Multi-Level Referral Commissions:** Earn from referred Pro members.
        *   Priority support.
        *   Access to exclusive content or early feature releases (TBD).
    *   **Value:** Unlocks the full networking power of iDance, provides premium tools for self-promotion, and enables income generation through referrals.

*   **VIP Tier (Earned, Not Paid):**
    *   **Criteria:** Achieved by meeting specific, transparent criteria (e.g., high engagement, significant views/likes on dance journal content, substantial number of successful Pro referrals, positive community impact, verified professional status).
    *   **Features:** All Pro Tier benefits PLUS:
        *   Exclusive VIP badge and profile distinction.
        *   Highest visibility in search/timeline (optional toggle).
        *   Potential direct access to premium opportunities or partnerships.
        *   Input into future platform development.
    *   **Value:** Recognition as a key influencer and contributor within the iDance ecosystem, with premium perks and status.

## 4. Positioning & Messaging

*   **"Your Dance Universe, Connected":** Emphasize iDance as the central hub for all aspects of a dancer's life – connection, creation, career, and community.
*   **"More Than Just Swipes":** Highlight the depth of features beyond simple matching – the dance journal, comprehensive profiles as personal websites, and the robust referral system.
*   **"Empowering Every Dancer":** Focus on how iDance provides tools and opportunities for dancers at every stage of their journey, from hobbyist to seasoned professional.
*   **"Build Your Network, Build Your Legacy":** Connect the referral system to long-term benefits and community building.
*   **Authenticity & Professionalism:** While inclusive, also highlight features that support professional dancers (job seeking, portfolio, awards).

## 5. Automatic Referral System & Growth Engine

This is a cornerstone of the growth strategy, designed for viral adoption and rewarding community builders.

*   **Mechanism:**
    *   **Signup:** New users can sign up using a referrer's unique code or username, or via a direct referral link. A referrer is generally required, but admin/system can generate initial codes or allow signups without for specific campaigns.
    *   **Tracking:** The system automatically links the referred user to their referrer.
    *   **Dashboard:** Users have a dedicated referral dashboard to:
        *   View their unique referral code and shareable link.
        *   Track the number of direct, secondary, and tertiary referrals.
        *   See the status of their referrals (e.g., 'pending_activation', 'active_basic', 'active_pro').
        *   Monitor earned commissions (pending and paid).
*   **Commission Structure (Multi-Level):**
    *   **Lifetime Commissions:** Referrers earn a percentage of the Pro subscription fees paid by their direct referrals for the lifetime of that subscription.
    *   **Tiered Rates:** Commission percentages increase based on the number of active Pro members referred (e.g., 5 referrals = 10%, 20 referrals = 15%, 100+ referrals = up to 60% - specific tiers TBD).
    *   **Secondary Commissions:** Earn a smaller percentage (e.g., up to 10%) from Pro subscriptions of users referred by their direct referrals (Level 2).
    *   **Tertiary Commissions:** Earn an even smaller percentage (e.g., up to 5%) from Pro subscriptions of users referred by their secondary referrals (Level 3).
    *   **Eligibility:** Only active Pro members are eligible to earn commissions. Commissions are typically paid out after a clearing period and when a minimum payout threshold is met.

## 6. User Acquisition & Marketing Channels (Post Pre-Launch)

*   **Leverage Genesis Network & Referral System:** The primary engine for organic growth.
*   **Content Marketing & SEO:**
    *   Blog on `idance.live` with articles on dance tips, industry news, dancer spotlights, platform features.
    *   Optimize user profiles and public journal content for search engines.
*   **Organic Social Media:**
    *   Active presence on Instagram, TikTok, YouTube, Pinterest, showcasing user-generated content (with permission), app features, dance challenges, and community stories.
    *   Run contests and giveaways to encourage engagement and referrals.
*   **Dance Community Engagement:**
    *   Partner with dance schools, universities, studios, and event organizers for cross-promotion.
    *   Sponsor or participate in dance events and competitions.
*   **Influencer Marketing:**
    *   Collaborate with dance influencers (micro to macro) for authentic reviews, tutorials, and promotion of the referral program.
*   **Public Relations:**
    *   Target dance publications, lifestyle blogs, and local media for features and announcements.
*   **Paid Advertising (Strategic):**
    *   Consider targeted ads on social media platforms (Meta, TikTok) and Google Ads, focusing on specific dance niches and demographics once organic traction is established.
*   **App Store Optimization (ASO) & Web SEO:**
    *   Continuous optimization of app store listings (keywords, visuals, descriptions) and website SEO.

## 7. Key Marketing Metrics (To Track)

*   **Pre-Launch & Launch:**
    *   Landing page conversion rate (signups).
    *   Profile completion rate for waitlisted users.
    *   Referral code usage during signup.
    *   Activation rate (from 'pending_waitlist_approval' to 'active').
*   **Growth & Engagement:**
    *   App downloads / New web signups.
    *   Daily Active Users (DAU) / Monthly Active Users (MAU).
    *   User retention rate (cohort analysis).
    *   Engagement metrics: swipes per user, matches per user, messages sent, journal posts created, timeline views/interactions.
    *   Referral program metrics: average referrals per user, conversion rate of referrals to Pro, commission payout volume.
*   **Monetization:**
    *   Conversion rate from Basic to Pro tier.
    *   Average Revenue Per User (ARPU) / Average Revenue Per Paying User (ARPPU).
    *   Subscription churn rate.
    *   Lifetime Value (LTV) of a user.

This marketing and growth strategy aims to build a strong, engaged community from the outset, leveraging viral mechanics and providing clear value at each tier. It will be continuously refined based on data and user feedback.