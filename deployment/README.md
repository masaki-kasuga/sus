# Deployment

This directory contains deployment configurations and scripts for the Sustainability IoT system.

## Directory Structure

```
deployment/
├── dashboard/                  # Dashboard application deployment
│   ├── docker-compose.dev.yml       # Development environment
│   ├── docker-compose.prod.yml      # Production environment
│   ├── nginx/                       # Nginx configurations
│   ├── postgres/                    # PostgreSQL configurations
│   ├── scripts/                     # Deployment scripts
│   └── README.md                    # Detailed dashboard deployment docs
│
└── raspi/                      # Raspberry Pi deployment configs
    ├── nginx/                       # Nginx configurations
    └── systemd/                     # Systemd service files
```

## Deployment Environments

### Dashboard Application

The dashboard consists of:
- **Backend API**: Node.js/Express server
- **Frontend**: React/Vite application
- **Database**: PostgreSQL

**Development**: `docker-compose.dev.yml`
- Hot reload enabled
- Debug-friendly
- Exposes all ports directly

**Production**: `docker-compose.prod.yml`
- Optimized builds
- Nginx reverse proxy
- Production-ready configuration

See [dashboard/README.md](dashboard/README.md) for detailed documentation.

### Raspberry Pi

Configuration files for deploying the API on Raspberry Pi devices:
- Nginx reverse proxy configuration
- Systemd service for auto-start and management

## Quick Start

### Development Environment

From project root:

```bash
# Using Make
make docker-dev

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.dev.yml up -d
```

**Access**:
- API: http://localhost:3000
- Dashboard: http://localhost:5173
- PostgreSQL: localhost:5432

### Production Environment

```bash
# Using Make
make docker-prod

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.prod.yml up -d
```

**Access**:
- Dashboard + API: http://localhost:8080

## Environment Variables

Each environment requires specific environment files:

### API
- Development: `apps/api/.env.dev`
- Production: `apps/api/.env.prod`

Example:
```env
PORT=3000
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=waste_management
DB_USER=postgres
DB_PASSWORD=your_password
```

### Dashboard

Environment variables are set in the docker-compose files:
- `VITE_API_TARGET`: API endpoint

## Deployment Strategies

### Local Development
- Use `docker-compose.dev.yml`
- Hot reload for rapid development
- Direct port exposure for debugging

### Local Production Testing
- Use `docker-compose.prod.yml`
- Test production builds locally
- Verify nginx configuration

### Raspberry Pi Deployment
- Use deployment scripts in `dashboard/scripts/`
- Configure systemd services
- Set up nginx reverse proxy

## Common Commands

### Start Services
```bash
make docker-dev          # Development
make docker-prod         # Production
```

### View Logs
```bash
make docker-dev-logs     # Development logs
make docker-prod-logs    # Production logs
```

### Stop Services
```bash
make docker-down         # Stop all containers
```

### Clean Up
```bash
make docker-clean        # Remove containers and volumes
```

### Rebuild Images
```bash
make docker-dev-build    # Rebuild dev images
make docker-prod-build   # Rebuild prod images
```

## Port Mapping

| Service    | Dev Port | Prod Port | Description |
|------------|----------|-----------|-------------|
| API        | 3000     | -         | Direct API access (dev only) |
| Dashboard  | 5173     | -         | Vite dev server (dev only) |
| Nginx      | -        | 8080      | Production web server |
| PostgreSQL | 5432     | 5432      | Database |

## Networking

All services communicate via Docker networks:
- **waste-network**: Bridge network for inter-service communication

## Data Persistence

- **waste_pgdata**: PostgreSQL data volume
  - Persists database data across container restarts
  - Managed by Docker

## Health Checks

Services include health checks for reliability:
- **Backend**: HTTP check on `/health` endpoint
- **PostgreSQL**: `pg_isready` check

## Security Considerations

1. **Environment Files**: Never commit `.env` files with real credentials
2. **Database Passwords**: Use strong passwords in production
3. **Nginx Configuration**: Review and harden nginx settings for production
4. **Network Isolation**: Use Docker networks to isolate services
5. **Volume Permissions**: Set appropriate permissions on mounted volumes

## Monitoring

### View Container Status
```bash
docker compose -f docker-compose.dev.yml ps
make docker-ps
```

### View Logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f backend
```

### Resource Usage
```bash
docker stats
```

## Troubleshooting

See [dashboard/README.md](dashboard/README.md) for detailed troubleshooting steps.

Common issues:
- Port conflicts: Change port mappings in compose files
- Database connection: Check postgres container is running
- Build failures: Clear Docker cache and rebuild

## Related Documentation

- [Dashboard Deployment Details](dashboard/README.md)
- [Development Guide](../DEVELOPMENT.md)
- [Main README](../README.md)
- [API Documentation](../apps/api/README.md)
- [Dashboard Documentation](../apps/dashboard/README.md)

## Best Practices

1. Use development environment for local development
2. Test with production environment before deploying
3. Keep environment files secure
4. Regular database backups
5. Monitor logs for errors
6. Update Docker images regularly
7. Use version tags for production images
