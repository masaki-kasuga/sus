# Dashboard Deployment

This directory contains Docker Compose configurations for deploying the dashboard application.

## Directory Structure

```
deployment/dashboard/
├── docker-compose.dev.yml      # Development environment
├── docker-compose.prod.yml     # Production environment
├── nginx/                      # Nginx configuration
│   ├── waste-dashboard.conf           # Standalone nginx config
│   └── waste-dashboard.docker.conf    # Docker nginx config
├── postgres/                   # PostgreSQL configuration
│   └── init/                   # Database initialization scripts
│       ├── 00_schema.sql              # Schema creation
│       └── 10_seed.sql                # Seed data
└── scripts/                    # Deployment scripts
    └── deploy_pi.sh                   # Raspberry Pi deployment script
```

## Environments

### Development Environment

**File**: `docker-compose.dev.yml`

**Services**:
- `backend`: API server with hot reload
- `frontend`: Dashboard with Vite dev server and hot reload
- `postgres`: PostgreSQL database
- `pg_seed`: Database initialization

**Ports**:
- API: 3000
- Dashboard: 5173
- PostgreSQL: 5432

**Usage**:
```bash
# From project root
make docker-dev

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop
docker compose -f docker-compose.dev.yml down
```

**Features**:
- Hot reload for both API and Dashboard
- Source code mounted as volumes
- Development-optimized builds
- Direct access to PostgreSQL for debugging

### Production Environment

**File**: `docker-compose.prod.yml`

**Services**:
- `backend`: API server (production build)
- `frontend_build`: Dashboard build container (exits after build)
- `nginx`: Serves static files and proxies API requests
- `postgres`: PostgreSQL database
- `pg_seed`: Database initialization

**Ports**:
- Nginx (serving dashboard + API proxy): 8080
- PostgreSQL: 5432

**Usage**:
```bash
# From project root
make docker-prod

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop
docker compose -f docker-compose.prod.yml down
```

**Features**:
- Production-optimized builds
- Nginx serves static files
- API proxied through Nginx
- No source code volumes (immutable)

## Configuration Files

### Nginx

- **waste-dashboard.conf**: Standalone nginx configuration for deploying on a host with nginx already installed
- **waste-dashboard.docker.conf**: Nginx configuration for Docker environment, includes API proxy

### PostgreSQL

- **00_schema.sql**: Creates database schema and tables
- **10_seed.sql**: Inserts seed data for testing

These scripts are automatically executed when the database is first initialized.

## Environment Variables

### API (.env.dev / .env.prod)

Required environment variables in `apps/api/`:

```env
PORT=3000
NODE_ENV=development|production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=waste_management
DB_USER=postgres
DB_PASSWORD=postgres
```

### Dashboard

Development environment variables are set in docker-compose files:
- `VITE_API_TARGET`: API endpoint for the dashboard

## Deployment to Raspberry Pi

See `scripts/deploy_pi.sh` for automated deployment to Raspberry Pi.

## Networking

Both environments use a bridge network called `waste-network` for service communication.

## Volumes

- `waste_pgdata`: PostgreSQL data persistence

## Health Checks

The backend service includes health checks to ensure proper startup order:
- Checks `/health` endpoint
- 15-second interval
- 20 retries with 2-second timeout

## Troubleshooting

### Services not starting

```bash
# Check logs
docker compose -f docker-compose.dev.yml logs

# Rebuild images
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Database connection issues

```bash
# Check if postgres is running
docker compose -f docker-compose.dev.yml ps

# Access postgres shell
docker exec -it <postgres-container-name> psql -U postgres -d waste_management

# Reset database
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Port conflicts

If ports 3000, 5173, 5432, or 8080 are in use, modify the port mappings in the compose files.

## Best Practices

1. **Development**: Use `docker-compose.dev.yml` for local development with hot reload
2. **Production Testing**: Use `docker-compose.prod.yml` to test production builds locally
3. **Database Backups**: Regularly backup the `waste_pgdata` volume
4. **Environment Files**: Never commit `.env.dev` or `.env.prod` files with real credentials
5. **Logs**: Monitor logs regularly for errors and issues

## Related Documentation

- [Main README](../../README.md)
- [Development Guide](../../DEVELOPMENT.md)
- [API Documentation](../../apps/api/README.md)
- [Dashboard Documentation](../../apps/dashboard/README.md)
