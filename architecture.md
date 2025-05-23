# iDance - System Architecture

```mermaid
flowchart TD
    %% Main User Entry Points
    MobileApp["Mobile App<br>(React Native + Expo)"]
    UserSites["User Sites<br>(Next.js)"]
    AdminPortal["Admin Portal<br>(Next.js)"]

    %% Infrastructure & Hosting
    CF["Cloudflare<br>Pages + DNS + CDN"]
    
    %% Storage Systems
    iDriveE2["iDrive E2<br>Primary Storage"]
    R2["Cloudflare R2<br>Edge Cache"]
    
    %% Backend Systems
    Supabase["Supabase Platform<br>Auth + Database + Realtime"]
    EdgeFuncs["Edge Functions<br>Business Logic"]

    %% User Access
    Users(("Users"))
    Admins(("Admins"))
    
    %% Flow Connections
    Users --> MobileApp
    Users --> UserSites
    Admins --> AdminPortal
    
    %% Frontend to Infrastructure
    UserSites --> CF
    AdminPortal --> CF
    
    %% Infrastructure to Backend
    CF --> Supabase
    CF --> EdgeFuncs
    CF --> R2
    
    %% Storage Flow
    EdgeFuncs --> iDriveE2
    iDriveE2 -.-> R2
    
    %% Mobile Direct Connections
    MobileApp --> Supabase
    MobileApp --> R2
    
    %% Backend Interconnections
    EdgeFuncs <--> Supabase
    
    %% Styling
    classDef primary fill:#2d3748,stroke:#cbd5e0,stroke-width:2px,color:white
    classDef storage fill:#2c5282,stroke:#90cdf4,stroke-width:2px,color:white
    classDef infrastructure fill:#1a365d,stroke:#4299e1,stroke-width:2px,color:white
    classDef users fill:#742a2a,stroke:#fc8181,stroke-width:2px,color:white
    
    class MobileApp,UserSites,AdminPortal primary
    class iDriveE2,R2 storage
    class CF,Supabase,EdgeFuncs infrastructure
    class Users,Admins users
```

## 1. Overview

iDance is a mobile application and web platform designed to facilitate connecting dancers to showcase their dance talents, help find new dance partners, other dancers, dance jobs, building professional networks, and fostering a vibrant community.

**Key Features:**
- Comprehensive user profiles (dance styles, proficiency, media, awards)
- Swipe-based matching system
- TikTok-like timeline and dance journal
- Direct chat capabilities
- Multi-level referral system
- Custom user websites

**Guiding Principles:**
*   **Mobile-First:** Primary focus on iOS and Android apps
*   **Rapid Development:** Using React Native, Expo, Supabase
*   **Scalability:** Cloud-native architecture with Supabase
*   **Cost-Effectiveness:** Leveraging affordable managed services

## 2. Core Software Components

### 2.1 Mobile App (iOS/Android)
*   **Technology:**
    - React Native with Expo
    - TypeScript
    - EAS Build + Updates
    - Supabase Client SDK
    - React Navigation

*   **Key Features:**
    - Authentication & profile management
    - Swipe-based matching
    - Timeline/social features
    - Chat system
    - Media management
    - Location-based search
    - Referral dashboard

*   **Key Screens:**
    - Auth & Onboarding
    - Timeline Feed
    - Swipe Discovery
    - Profile Management
    - Chat & Messages
    - Settings & Preferences
    - Referral Dashboard

### 2.2 Backend Services
*   **Technology:**
    - Supabase Platform
    - Edge Functions (TypeScript)
    - PostgreSQL + PostGIS
    - iDrive E2 Storage
    - Supabase Realtime

*   **Core Services:**
    - User Authentication
    - Database & Data Access
    - Media Storage
    - Real-time Features
    - Business Logic (Edge Functions)
    - Geospatial Search

*   **Key Functions:**
    - User Management
    - Profile Operations
    - Matching Logic
    - Timeline Processing
    - Referral System
    - Media Handling
    - Analytics Collection

### 2.3 Unified Admin Portal
*   **Technology:**
    - Next.js (TypeScript)
    - TailwindCSS
    - Supabase Client SDK
    - Cloudflare Pages

*   **Access Levels:**
    - Site Administrators (iDance Team)
    - Group Administrators (Dance Companies/Studios)
    - Pro Users
    - Free Users

*   **Core Features:**
    - Role-based Dashboard
    - User/Group Management
    - Content Moderation
    - Analytics & Reports
    - System Configuration
    - Site Customization
    - Media Management
    - SEO Tools

*   **Key Interfaces:**
    - Global Admin Dashboard
    - Group Management Console
    - User Site Editor
    - Analytics Dashboard
    - Content Manager
    - System Settings

### 2.4 Dynamic User Sites
*   **Technology:**
    - Next.js (TypeScript)
    - TailwindCSS
    - Cloudflare Pages
    - Edge Functions

*   **Architecture:**
    - Single Next.js application
    - Dynamic routing per user/group
    - Edge-based content resolution
    - Real-time data updates
    - Global CDN distribution

*   **Core Features:**
    - Personal/Group subdomains
    - Custom domain support
    - Dynamic content rendering
    - Media optimization
    - SEO enhancement
    - Contact forms
    - Blog/Updates
    - Analytics tracking

*   **Performance Features:**
    - Edge caching
    - Image optimization
    - Incremental Static Regeneration
    - Analytics per site
    - Regional distribution

## 3. Infrastructure & Services

### 3.1 Storage Architecture
*   **Primary Storage (iDrive E2):**
    - Long-term media storage
    - Image optimization
    - Video transcoding
    - Access control
    - Quota management
    - Cost-effective for large storage volumes

*   **Edge Caching (Cloudflare R2):**
    - Fast edge-cached access to frequent assets
    - Global distribution
    - Seamless Cloudflare integration
    - Automatic cache invalidation
    - Pay-per-use pricing model

### 3.2 Deployment Infrastructure
*   **Mobile App:**
    - EAS Build (iOS/Android)
    - EAS Update (OTA updates)

*   **Web Components:**
    - Cloudflare Pages (SSR/Static)
    - Cloudflare Functions
    - Custom Domain Support

*   **Backend:**
    - Supabase Platform
    - Database Migrations
    - Edge Functions

### 3.3 Domain & DNS
*   **Core Setup:**
    - Cloudflare for `idance.live` domain
    - Automatic SSL for all subdomains
    - CDN for global performance
    - CNAME setup for custom domains

*   **Custom Domain Support:**
    - Simple documentation for CNAME setup
    - Users can point their domains to `sites.idance.live`
    - Automatic SSL via Cloudflare
    - Zero additional cost for the platform

## 4. Business Features

### 4.1 User Tiers
*   **Initial Launch (Free):**
    - Personal `username.idance.live` subdomain
    - Full featured portfolio site
    - Media gallery and blog
    - Contact form
    - Basic analytics
    - Custom domain support (via CNAME)
    - Basic SEO tools
    - Referral tracking

*   **Pro Tier (Future):**
    - To be introduced after company setup
    - Enhanced analytics
    - Priority support
    - Premium themes
    - Advanced SEO tools
    - Commission payouts

*   **VIP (Future - Earned):**
    - Recognition for top creators
    - Special profile badges
    - Early feature access
    - Community leadership opportunities

### 4.2 Referral System
*   **Features:**
    - Multi-level structure
    - Commission tracking
    - Automated payouts
    - Analytics dashboard

## 5. Launch Strategy: User Sites First

### 5.1 Initial Launch: Personal Dance Sites
*   **Direct Value Proposition**
    - Instant `username.idance.live` subdomain upon signup
    - Portfolio site with media gallery and blog
    - Built-in SEO optimization
    - Contact forms and social links
    - Custom domain support
    - Analytics dashboard

*   **Admin Portal Access**
    - Site customization tools
    - Content management
    - Visitor analytics
    - Referral system tracking
    - SEO settings

*   **Built-in Growth Engine**
    - Users share their iDance sites on social media
    - Referral tracking from day one
    - Commission system for Pro signups
    - SEO drives organic growth

### 5.2 Phase Two: Mobile App Launch
*   **Data-Driven Features**
    - Pre-built network of verified dancers
    - Existing content for timeline/social features
    - Ready user base for matching algorithm
    - Proven user engagement metrics

*   **Natural Platform Evolution**
    - Web users transition to mobile features
    - Integration between sites and app
    - Cross-platform content sharing
    - Unified analytics and tracking

## 6. Technical Architecture



## 7. Development & Deployment

### 7.1 Development
*   **Repo Structure:**
    - pnpm workspace
    - Shared types
    - Consistent tooling

*   **Key Tools:**
    - TypeScript
    - ESLint/Prettier
    - Jest/Testing Library
    - Storybook

### 7.2 CI/CD
*   **Mobile:**
    - EAS Build
    - TestFlight/Internal Testing
    - Production Release
    - Github Actions

*   **Web:**
    - Cloudflare Pages
    - Preview Deployments
    - Production Release

## 8. Technology Stack Summary
*   **Frontend:** React Native (TypeScript), Next.js (TypeScript)
*   **Backend:** Supabase, Edge Functions (TypeScript)
*   **Storage:** iDrive E2 (primary storage), Cloudflare R2 (edge caching)
*   **Infrastructure:** Cloudflare
*   **Payment:** Stripe
*   **Development Tools:**
    *   TypeScript for all components (mobile, web, backend)
    *   pnpm for package management
    *   ESLint + Prettier for code formatting
    *   Jest for testing
    *   GitHub Actions for CI/CD

### Type Safety & Code Sharing

*   Shared TypeScript types between:
    *   Mobile app and web components
    *   Frontend and backend (Supabase)
    *   API interfaces and database schema
*   Automatic type generation from database schema
*   Strong typing for API responses and requests

This architecture emphasizes type safety, code reuse, and maintainable development practices while enabling rapid iteration and scalability.