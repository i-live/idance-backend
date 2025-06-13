# iDance Project Requirements & Guidelines

## Development Guidelines

### UI/UX Requirements
- **Theme Management**: All web-facing and mobile-facing apps must have robust theme management
- **Modern UI**: Clean, modern, responsive design
- **Mobile-First**: All interfaces must be mobile-friendly and responsive
- **Consistency**: Maintain design consistency across all applications

### Authentication
- **Shared Authentication**: Authentication system must be modular and shared across apps (backoffice, user-sites, etc.)
- **NextAuth.js**: Use NextAuth.js for web applications
- **SurrealDB Integration**: Integrate with existing SurrealDB authentication system
- **Role-Based Access**: Support role-based access control (user, admin, support, moderator)

### Technology Stack
- **Latest Versions**: Always use latest stable versions of dependencies
- **Documentation**: Always check latest documentation using context7 MCP when coding
- **TypeScript**: Use TypeScript throughout all applications
- **Monorepo**: pnpm workspace + nx cloud structure
- **Database**: SurrealDB hosted on Surrealist Cloud
- **Hosting**: Cloudflare Pages for web apps, Cloudflare Workers for services

### Development Process
- **Git Commits**: Regular commits with appropriate commit messages after completing good steps
- **Documentation**: Keep this requirements log updated with new instructions
- **Code Quality**: Maintain high code quality and best practices
- **Port Management**: If a port is already in use, kill the existing process instead of changing ports. Use `pkill -f "process_name"` or `lsof -ti:PORT | xargs kill -9`

### Architecture
- **Cloudflare Pages**: Use for admin interfaces and user-facing web apps (better for complex UI)
- **Cloudflare Workers**: Use for API endpoints and microservices
- **Shared Packages**: Create reusable packages in `/packages/` for common functionality

## Current Project Structure
```
idance/
├── apps/
│   ├── backoffice/           # Next.js admin interface (Cloudflare Pages)
│   ├── user-sites/           # Next.js user sites (Cloudflare Pages)
│   ├── mobile/               # Expo/React Native
│   └── services/             # Cloudflare Workers
├── packages/
│   ├── auth/                 # Shared authentication logic
│   ├── utils/
│   └── types/
└── database/                 # SurrealDB migrations
```

## Backoffice Functionality Requirements

### Admin Interface Features
- **Multi-role Support**: Admin, Moderator, Support roles with hierarchical permissions
- **Ecosystem Management**: Full control over iDance platform
- **User Management**: Manage all users, their profiles, and permissions
- **Content Moderation**: Review and moderate user-generated content
- **Analytics Dashboard**: Platform usage statistics and insights
- **System Configuration**: Platform-wide settings and configurations

### User Interface Features
- **Profile Management**: Users can configure their own profiles
- **User-Site Configuration**: Personal site setup and customization
- **Affiliate Management**: Affiliate program setup and tracking
- **Personal Dashboard**: User-specific analytics and settings

### Permission Hierarchy
1. **Admin**: Full platform access, user management, system configuration
2. **Moderator**: Content moderation, limited user management
3. **Support**: User support, limited access to user data
4. **User**: Personal profile and site management only

## Next Steps
1. Implement authentication with role-based access control
2. Create admin dashboard layout with navigation
3. Build user profile management interface
4. Set up affiliate management system
5. Test and commit progress regularly