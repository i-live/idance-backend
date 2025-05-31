# iDance Database Setup

This directory contains the SurrealDB database setup for the iDance platform, including Docker Compose configurations, migrations, and management scripts.

## Quick Start

### 1. Start Local Database

**Prerequisites**: Ensure Docker is running
- **Windows/WSL**: Start Docker Desktop
- **Linux**: `sudo systemctl start docker`
- **macOS**: Start Docker Desktop

```bash
# Start development database (in-memory, fast)
cd database
docker compose up -d

# Wait for health check, then run migrations
./scripts/run-migration.sh
```

### 2. Access Database

- **SurrealDB Endpoint**: wss://localhost:8000 (WSS with self-signed cert)
- **SurrealDB Studio**: http://localhost:8080 (visual database management)
- **Default Credentials**: `root` / `root`

## Database Configurations

### Development (Default)
- **Storage**: In-memory (fast, data lost on restart)
- **Port**: 8000
- **Use case**: Local development, testing, CI/CD

```bash
docker compose up -d
```

### Production-like (TiKV)
- **Storage**: TiKV (persistent, distributed)
- **Port**: 8001
- **Use case**: Staging, performance testing

```bash
docker compose --profile tikv up -d
```

## Environment Variables

Copy the environment template and configure:

```bash
cp ../.env.example ../.env
# Edit .env with your database credentials
```

Required variables for local development:
```env
SURREALDB_URL=wss://localhost:8000
SURREALDB_NAMESPACE=idance
SURREALDB_DATABASE=dev
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root
SURREALDB_JWT_SECRET=your-jwt-secret-here
SURREALDB_WORKER_JWT_SECRET=your-worker-jwt-secret-here
```

## Migration System

### Run All Migrations
```bash
./scripts/run-migration.sh
```

### Run Specific Migration
```bash
./scripts/run-migration.sh --migration 0003
```

### Migration Files
- `0000_namespace_database.surql` - Foundation setup
- `0001_authentication.surql` - User authentication & JWT
- `0002_core_users.surql` - User profiles & devices
- `0003_lookup_tables.surql` - Countries, states, dance styles
- `0004_social_interactions.surql` - Follows, matches, swipes
- `0005_messaging.surql` - Real-time chat
- `0006_content_vlogs.surql` - User-generated content
- `0007_groups_sites.surql` - Dance groups & websites
- `0008_events_triggers.surql` - Automation & notifications

## Database Schema

The database includes:

- **Authentication**: JWT-based auth with OAuth support
- **User Management**: Profiles, devices, preferences
- **Social Features**: Following, matching, swiping
- **Content**: Vlogs, posts, media
- **Groups**: Dance groups and custom websites
- **Messaging**: Real-time chat and notifications
- **Lookup Data**: Countries, states, cities, dance styles

## CI/CD Integration

### GitHub Actions
```yaml
services:
  surrealdb:
    image: surrealdb/surrealdb:latest
    ports:
      - 8000:8000
    options: >-
      --health-cmd "curl -f http://localhost:8000/health"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Production Deployment

For production, consider:
- **SurrealDB Cloud** for managed hosting
- **TiKV cluster** for self-hosted distributed storage
- **Backup strategies** for data persistence
- **Monitoring** with Prometheus/Grafana

## Troubleshooting

### Database Won't Start
```bash
# Check logs
docker compose logs surrealdb

# Restart services
docker compose down && docker compose up -d
```

### Migration Failures
```bash
# Check environment variables
./scripts/run-migration.sh --skip-validation

# Run specific migration
./scripts/run-migration.sh --migration 0001
```

### Connection Issues
```bash
# Test connection
curl http://localhost:8000/health

# Check if port is available
netstat -tulpn | grep 8000
```

## Development Workflow

1. **Start database**: `docker compose up -d`
2. **Run migrations**: `./scripts/run-migration.sh`
3. **Develop your app** with connection to `http://localhost:8000`
4. **Use SurrealDB Studio** at `http://localhost:8080` for debugging
5. **Stop database**: `docker compose down`

## Security Notes

- Default credentials (`root`/`root`) are for development only
- JWT secrets must be 32+ characters in production
- Use environment variables for all sensitive data
- Enable TLS in production deployments