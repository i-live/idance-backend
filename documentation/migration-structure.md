# Migration Structure Guide

This document explains the new modular migration structure for the iDance SurrealDB schema.

## 📋 Migration Overview

The original monolithic `0000_initial_schema.surql` file has been broken down into 9 focused migration files for better maintainability, testing, and deployment flexibility.

## 🗂️ Migration Files

### **0000_namespace_database.surql** - Foundation
**Purpose**: Establishes the basic SurrealDB structure
**Contains**:
- Namespace definition (`idance`)
- Database definitions (`dev`, `prod`, `test`)
- Environment setup

**Dependencies**: None (must run first)

### **0001_authentication.surql** - Security Layer
**Purpose**: Sets up SurrealDB v2.0 authentication system
**Contains**:
- User access method (email/password)
- OAuth access method (social login)
- Worker access method (backend services)
- Authentication utility functions

**Dependencies**: 0000
**Key Features**:
- RECORD-based authentication
- Real-time user validation
- JWT token management
- Backward compatibility functions

### **0002_core_users.surql** - User Management
**Purpose**: Core user-related tables and profiles
**Contains**:
- `user` table (authentication data)
- `profile` table (user profiles with location, preferences)
- `device` table (push notification tokens)

**Dependencies**: 0000, 0001
**Key Features**:
- Granular location fields
- AI matching embeddings
- Soft delete support
- Comprehensive permissions

### **0003_lookup_tables.surql** - Reference Data
**Purpose**: Static reference data for the application
**Contains**:
- Location tables (`country`, `state`, `county`, `city`)
- `dance_style` table
- `interest` table
- `social_platform` table

**Dependencies**: 0000
**Key Features**:
- Hierarchical location data
- Geospatial indexing for cities
- Categorized interests and dance styles

### **0004_social_interactions.surql** - Social Features
**Purpose**: User relationships and dating mechanics
**Contains**:
- `user_dance_style`, `user_interest` (associations)
- `follow`, `referred` (social relationships)
- `swipe`, `match` (dating mechanics)

**Dependencies**: 0002, 0003
**Key Features**:
- Proficiency levels for dance styles
- Referral tracking
- Mutual like detection

### **0005_messaging.surql** - Communication System
**Purpose**: Real-time messaging and notifications
**Contains**:
- `chat`, `message` (messaging system)
- `comments` (content comments)
- `notification` (push notifications)

**Dependencies**: 0002, 0004
**Key Features**:
- Real-time chat sessions
- Multi-media message support
- Threaded comments
- Push notification tracking

### **0006_content_vlogs.surql** - User Content
**Purpose**: User-generated content and media
**Contains**:
- `vlog` table (posts, videos, images)
- `vlog_like` table (content interactions)

**Dependencies**: 0002
**Key Features**:
- Multi-media content support
- Public/private content
- Engagement tracking

### **0007_groups_sites.surql** - Advanced Features
**Purpose**: Groups and custom websites
**Contains**:
- `group`, `group_member` (dance groups/studios)
- `site`, `content_block` (custom websites)

**Dependencies**: 0002, 0003
**Key Features**:
- Role-based group management
- Custom website builder
- Modular content blocks

### **0008_events_triggers.surql** - Automation
**Purpose**: Real-time events and database triggers
**Contains**:
- Message events (chat updates, notifications)
- Match events (auto-chat creation)
- Like/follow events (engagement tracking)
- Auto-match detection

**Dependencies**: 0004, 0005
**Key Features**:
- Real-time automation
- Automatic notification generation
- Match detection logic

## 🚀 Running Migrations

### Run All Migrations (Recommended)
```bash
./scripts/run-migration.sh
```

### Run Specific Migration
```bash
./scripts/run-migration.sh --migration 0002
```

### Skip Environment Validation (Development)
```bash
./scripts/run-migration.sh --skip-validation
```

### Get Help
```bash
./scripts/run-migration.sh --help
```

## 🔧 Development Workflow

### 1. **Foundation First**
Start with migrations 0000-0001 for basic setup and authentication testing.

### 2. **Core Features**
Add migrations 0002-0003 for user management and reference data.

### 3. **Social Layer**
Implement migrations 0004-0005 for social features and messaging.

### 4. **Advanced Features**
Deploy migrations 0006-0008 for content, groups, and automation.

### 5. **Testing Strategy**
- Test each migration independently
- Verify dependencies are met
- Check permissions and access controls
- Validate real-time events

## 📊 Migration Dependencies

```
0000 (Foundation)
├── 0001 (Authentication) [depends on 0000]
├── 0002 (Core Users) [depends on 0000, 0001]
├── 0003 (Lookup Tables) [depends on 0000]
├── 0004 (Social) [depends on 0002, 0003]
├── 0005 (Messaging) [depends on 0002, 0004]
├── 0006 (Content) [depends on 0002]
├── 0007 (Groups) [depends on 0002, 0003]
└── 0008 (Events) [depends on 0004, 0005]
```

## 🎯 Benefits

### **Maintainability**
- Smaller, focused files are easier to understand
- Clear separation of concerns
- Better code reviews

### **Testing**
- Test individual features in isolation
- Easier debugging and troubleshooting
- Incremental validation

### **Deployment**
- Roll out features incrementally
- Rollback specific features if needed
- Optional features can be deployed later

### **Development**
- Multiple developers can work on different areas
- Reduced merge conflicts
- Feature-based development

## 🔄 Migration Best Practices

### **Order Matters**
Always run migrations in numerical order (0000, 0001, 0002, etc.). The script enforces this automatically.

### **Environment Variables**
Ensure all required environment variables are set before running migrations.

### **Backup First**
Always backup your database before running migrations in production.

### **Test Locally**
Test all migrations in development environment first.

### **Monitor Performance**
Some migrations (especially with indexes) may take time on large datasets.

## 🆘 Troubleshooting

### **Migration Fails**
1. Check the error message for specific issues
2. Verify environment variables are set correctly
3. Ensure previous migrations completed successfully
4. Check SurrealDB connection and permissions

### **Dependency Issues**
1. Run migrations in order (0000, 0001, 0002, etc.)
2. Don't skip migrations unless you understand the dependencies
3. Use `--migration` flag to run specific migrations for testing

### **Environment Problems**
1. Verify `.env` file exists and is properly configured
2. Check JWT secrets are properly generated
3. Ensure SurrealDB is running and accessible

## 📚 Related Documentation

- [Authentication Guide](./authentication.md) - Detailed auth setup
- [JWT Secrets Guide](./jwt-secrets-guide.md) - Secret management
- [Database Schema](./database.md) - Complete schema reference
- [Architecture Overview](./architecture.md) - System design

## 🔮 Future Migrations

The 4-digit numbering system (0000-9999) provides room for:
- Feature additions (0009, 0010, etc.)
- Schema modifications
- Performance optimizations
- New integrations

When adding new migrations:
1. Use the next available number
2. Document dependencies clearly
3. Update this guide
4. Test thoroughly before deployment