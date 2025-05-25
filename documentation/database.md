# iDance - Database Architecture (SurrealDB)

This document provides a high-level overview of the SurrealDB database architecture for the iDance application. For detailed table definitions and schema, see the [migration files](../migrations/) and [migration structure guide](./migration-structure.md).

## 📋 Overview

iDance uses SurrealDB as its primary database, leveraging its modern features for a mobile-first dance community platform:

- **Real-time**: WebSocket `LIVE SELECT` for notifications and chat
- **Geospatial**: MTREE indexing for location-based dancer discovery  
- **Authentication**: SurrealDB v2.0 RECORD-based access with JWT
- **Scalability**: Cloud-hosted with edge caching
- **Security**: Record-level permissions and access controls

## 🏗️ Architecture Components

### **Database Structure**
- **Namespace**: `idance`
- **Databases**: `dev`, `prod`, `test`
- **Endpoint**: Cloud-hosted SurrealDB instance
- **Migration System**: Modular migrations (0000-0008)

### **Access Methods**
- **User Access**: Email/password and OAuth authentication
- **OAuth Access**: Social login integration (Google, Facebook, Apple)
- **Worker Access**: JWT-based access for Cloudflare Workers

### **Key Features**
- **Vector Search**: AI embeddings for profile and content matching
- **Geospatial Queries**: Location-based user discovery
- **Real-time Events**: Database triggers for automation
- **Soft Deletes**: Data retention with status flags

## 📊 Data Model Overview

### **Core Entities**

#### **Users & Profiles**
- [`user`](../migrations/0002_core_users.surql) - Authentication and basic user data
- [`profile`](../migrations/0002_core_users.surql) - Comprehensive dancer profiles with location, preferences
- [`device`](../migrations/0002_core_users.surql) - Push notification tokens

#### **Location Hierarchy**
- [`country`](../migrations/0003_lookup_tables.surql) - ISO country codes
- [`state`](../migrations/0003_lookup_tables.surql) - States/provinces  
- [`county`](../migrations/0003_lookup_tables.surql) - County/region data
- [`city`](../migrations/0003_lookup_tables.surql) - Cities with coordinates

#### **Social Features**
- [`follow`](../migrations/0004_social_interactions.surql) - User follow relationships
- [`swipe`](../migrations/0004_social_interactions.surql) - Like/dislike actions
- [`match`](../migrations/0004_social_interactions.surql) - Mutual likes
- [`user_dance_style`](../migrations/0004_social_interactions.surql) - Dance style associations
- [`user_interest`](../migrations/0004_social_interactions.surql) - Interest associations

#### **Communication**
- [`chat`](../migrations/0005_messaging.surql) - Chat sessions between matches
- [`message`](../migrations/0005_messaging.surql) - Individual chat messages
- [`comments`](../migrations/0005_messaging.surql) - Comments on content
- [`notification`](../migrations/0005_messaging.surql) - Push notifications

#### **Content & Media**
- [`vlog`](../migrations/0006_content_vlogs.surql) - User-generated content (videos, images)
- [`vlog_like`](../migrations/0006_content_vlogs.surql) - Content engagement

#### **Groups & Sites**
- [`group`](../migrations/0007_groups_sites.surql) - Dance companies, studios, teams
- [`group_member`](../migrations/0007_groups_sites.surql) - Group membership with roles
- [`site`](../migrations/0007_groups_sites.surql) - Custom websites for users/groups
- [`content_block`](../migrations/0007_groups_sites.surql) - Modular website content

#### **Reference Data**
- [`dance_style`](../migrations/0003_lookup_tables.surql) - Dance styles (ballet, hip-hop, etc.)
- [`interest`](../migrations/0003_lookup_tables.surql) - User interests
- [`social_platform`](../migrations/0003_lookup_tables.surql) - Social media platforms

## 🔐 Security Model

### **Authentication Flow**
1. **User Registration**: Email/password or OAuth via access methods
2. **JWT Tokens**: Stateless authentication with configurable duration
3. **Session Management**: Real-time user validation and status checking
4. **Worker Access**: Separate JWT access for backend services

### **Permission System**
- **Record-level**: Users can only access their own data
- **Public data**: Limited fields visible to other users
- **Worker access**: Full administrative access for backend operations
- **Soft deletes**: Data marked as deleted rather than physically removed

### **Data Privacy**
- **Sensitive fields**: Measurements, exact location protected
- **Tier-based access**: Pro/VIP features for advanced functionality
- **Audit trails**: User status changes and important actions logged

## 🚀 Performance Features

### **Indexing Strategy**
- **Geospatial**: MTREE indexes for location-based queries
- **Vector Search**: HNSW indexes for AI embedding similarity
- **Composite**: Multi-field indexes for common query patterns
- **Unique constraints**: Email, username, and other unique fields

### **Real-time Capabilities**
- **Live Queries**: `LIVE SELECT` for real-time updates
- **Database Events**: Automatic triggers for business logic
- **WebSocket**: Persistent connections for instant notifications
- **Edge Caching**: Cloudflare R2 for media and static content

### **Scalability Design**
- **Horizontal scaling**: SurrealDB cluster support
- **Edge deployment**: Multi-region data distribution
- **Caching layers**: Redis for session data, R2 for media
- **CDN integration**: Global content delivery

## 🔄 Migration System

### **Migration Structure**
The database schema is managed through modular migration files:

- **[0000_namespace_database.surql](../migrations/0000_namespace_database.surql)** - Foundation setup
- **[0001_authentication.surql](../migrations/0001_authentication.surql)** - Authentication system
- **[0002_core_users.surql](../migrations/0002_core_users.surql)** - User and profile tables
- **[0003_lookup_tables.surql](../migrations/0003_lookup_tables.surql)** - Reference data
- **[0004_social_interactions.surql](../migrations/0004_social_interactions.surql)** - Social features
- **[0005_messaging.surql](../migrations/0005_messaging.surql)** - Communication system
- **[0006_content_vlogs.surql](../migrations/0006_content_vlogs.surql)** - Content management
- **[0007_groups_sites.surql](../migrations/0007_groups_sites.surql)** - Groups and websites
- **[0008_events_triggers.surql](../migrations/0008_events_triggers.surql)** - Automation and events

### **Running Migrations**
```bash
# Run all migrations
./scripts/run-migration.sh

# Run specific migration
./scripts/run-migration.sh --migration 0002

# Get help
./scripts/run-migration.sh --help
```

See the [Migration Structure Guide](./migration-structure.md) for detailed information.

## 🎯 Key Design Decisions

### **SurrealDB Choice**
- **Modern features**: Real-time queries, vector search, geospatial
- **Simplified stack**: Reduces need for separate cache/search layers
- **Developer experience**: SQL-like syntax with modern capabilities
- **Scalability**: Built for cloud-native applications

### **Modular Schema**
- **Maintainability**: Smaller, focused migration files
- **Testing**: Individual features can be tested in isolation
- **Deployment**: Incremental rollouts and rollbacks
- **Development**: Parallel work on different features

### **Security-First Design**
- **Zero-trust**: Every query validated at database level
- **Principle of least privilege**: Users see only necessary data
- **Audit capabilities**: All changes tracked and logged
- **Data sovereignty**: User controls their own data

### **Real-time Architecture**
- **Live queries**: Instant updates without polling
- **Event-driven**: Database triggers for business logic
- **WebSocket connections**: Persistent real-time channels
- **Edge optimization**: Global low-latency access

## 📚 Related Documentation

- **[Migration Structure Guide](./migration-structure.md)** - Detailed migration system
- **[Authentication Guide](./authentication.md)** - Auth setup and configuration
- **[JWT Secrets Guide](./jwt-secrets-guide.md)** - Security key management
- **[Architecture Overview](./architecture.md)** - System design and components

## 🔧 Development Workflow

### **Local Development**
1. Set up environment variables (`.env`)
2. Run SurrealDB locally or connect to cloud instance
3. Apply migrations: `./scripts/run-migration.sh`
4. Test with your application

### **Schema Changes**
1. Create new migration file with next number (0009, 0010, etc.)
2. Define tables, fields, indexes, and permissions
3. Test migration locally
4. Update documentation if needed
5. Deploy to staging, then production

### **Best Practices**
- **Always backup** before running migrations in production
- **Test migrations** in development environment first
- **Use transactions** for complex schema changes
- **Document dependencies** clearly in migration files
- **Monitor performance** after deploying new indexes

## 📊 Monitoring & Maintenance

### **Health Checks**
- Database connectivity and response times
- Query performance and slow query analysis
- Index usage and optimization opportunities
- Storage usage and growth patterns

### **Backup Strategy**
- Automated daily backups to secure storage
- Point-in-time recovery capabilities
- Cross-region backup replication
- Regular restore testing

### **Performance Monitoring**
- Query execution times and patterns
- Index effectiveness and usage
- Connection pool utilization
- Real-time query performance

For operational procedures and monitoring setup, see the [Architecture Overview](./architecture.md).