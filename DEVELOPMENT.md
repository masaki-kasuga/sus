# Development Guide

This guide provides detailed instructions for local development, testing, and deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Docker Development](#docker-development)
- [Testing](#testing)
- [Building](#building)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Node.js**: 20.20.0 or later
- **npm**: 10.x or later
- **Docker**: 20.x or later (for Docker development)
- **Docker Compose**: v2.x or later

### Recommended

- **mise**: For automatic tool version management
- **make**: For convenient task running

### Installing mise (Optional but Recommended)

mise automatically manages Node.js versions and provides convenient task shortcuts.

```bash
# macOS
brew install mise

# Other platforms
curl https://mise.run | sh
```

After installing, activate mise in your shell:

```bash
echo 'eval "$(mise activate bash)"' >> ~/.bashrc  # for bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc    # for zsh
```

Then install the project tools:

```bash
mise install
```

## Quick Start

### Option 1: Using Make (Recommended)

```bash
# Install dependencies
make install

# Start API in development mode
make dev-api

# Or start Dashboard
make dev-dashboard

# Or use Docker
make docker-dev
```

### Option 2: Using mise

```bash
# Install dependencies
mise run install

# Start API
mise run dev-api

# Start Dashboard
mise run dev-dashboard

# Start with Docker
mise run docker-dev
```

### Option 3: Using npm directly

```bash
# Install dependencies
npm install

# Start API
npm run dev --workspace=apps/api

# Start Dashboard
npm run dev --workspace=apps/dashboard
```

## Local Development

### 1. Environment Setup

#### API Environment

```bash
cd apps/api
cp example.env .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_management
DB_USER=postgres
DB_PASSWORD=your_password
```

#### Dashboard Environment

```bash
cd apps/dashboard
cp example.env .env.local
```

Edit `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Start PostgreSQL

You need a PostgreSQL instance running. Options:

#### Option A: Use Docker Compose (Recommended)

```bash
cd deployment/dashboard
docker compose -f docker-compose.dev.yml up -d postgres
```

#### Option B: Local PostgreSQL

Install and start PostgreSQL locally, then run migrations:

```bash
cd apps/api
npm run migrate
npm run seed
```

### 3. Start Development Servers

#### API Server

```bash
# From project root
make dev-api

# Or
npm run dev --workspace=apps/api
```

API will be available at `http://localhost:3000`

#### Dashboard

```bash
# From project root
make dev-dashboard

# Or
npm run dev --workspace=apps/dashboard
```

Dashboard will be available at `http://localhost:5173`

### 4. Development Workflow

```bash
# Run linter
make lint

# Auto-fix lint issues
make lint-fix

# Build for production
make build

# Run all CI checks locally
make ci
```

## Docker Development

### Development Environment

The development environment includes:
- PostgreSQL database
- API server with hot reload
- Dashboard with hot reload

```bash
# Start all services
make docker-dev

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.dev.yml up -d

# View logs
make docker-dev-logs

# Stop all services
make docker-down
```

**Services:**
- API: http://localhost:3000
- Dashboard: http://localhost:5173
- PostgreSQL: localhost:5432

**Hot reload:** Source code changes are automatically reflected.

### Production Environment (Local Testing)

Test the production build locally:

```bash
# Build and start production environment
make docker-prod

# Or manually
cd deployment/dashboard
docker compose -f docker-compose.prod.yml up -d

# View logs
make docker-prod-logs

# Rebuild images
make docker-prod-build

# Stop
make docker-down
```

**Services:**
- Dashboard: http://localhost:8080 (served via nginx)

### Docker Commands Reference

```bash
# Show running containers
make docker-ps

# Stop all containers
make docker-down

# Clean all Docker resources (containers, volumes, images)
make docker-clean

# Rebuild development images
make docker-dev-build

# Rebuild production images
make docker-prod-build
```

## Testing

### Linting

```bash
# Lint all workspaces
make lint

# Lint specific workspace
make lint-api
make lint-dashboard

# Auto-fix issues
make lint-fix
```

### Type Checking

```bash
# API
cd apps/api
npm run build  # TypeScript compilation

# Dashboard
cd apps/dashboard
npm run build  # TypeScript + Vite build
```

### Manual Testing

1. **API Endpoints:**
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Get dashboard data
   curl http://localhost:3000/api/dashboard
   ```

2. **Dashboard:**
   Open http://localhost:5173 in your browser

## Building

### Build All

```bash
make build
```

### Build Individual Apps

```bash
# API only
make build-api

# Dashboard only
make build-dashboard
```

Build outputs:
- API: `apps/api/dist/`
- Dashboard: `apps/dashboard/dist/`

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev --workspace=apps/api
```

### Dependencies Issues

```bash
# Clean and reinstall
make clean
make install

# Or manually
rm -rf node_modules apps/*/node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Clean everything and start fresh
make docker-clean
make docker-dev-build
make docker-dev
```

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

2. **Check connection:**
   ```bash
   docker exec -it waste-postgres-dev psql -U postgres -d waste_management
   ```

3. **Reset database:**
   ```bash
   make docker-clean
   make docker-dev
   ```

### ESLint Errors

```bash
# Auto-fix what can be fixed
make lint-fix

# Check specific issues
make lint-api
make lint-dashboard
```

### mise Not Working

```bash
# Reinstall tools
mise install --force

# Check configuration
mise doctor

# Check current versions
mise current
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- Docker
- PostgreSQL

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact"
  ]
}
```

### Cursor

The same extensions and settings work for Cursor.

## Deployment to Raspberry Pi

### Automated Deployment

Deploy built applications to Raspberry Pi using the automated script:

```bash
# From project root
cd deployment/dashboard/scripts
./deploy_pi.sh
```

The script will:
1. Build frontend and backend locally
2. Connect to Raspberry Pi via SSH
3. Upload built files and configurations
4. Install production dependencies
5. Restart services

### What You Need

**Before deploying:**

1. **Environment file**: Create `apps/api/.env.pi` with production settings
   ```env
   PORT=3000
   NODE_ENV=production
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=waste_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

2. **SSH access** to your Raspberry Pi
   - Hostname/IP or SORACOM Napter URL
   - SSH port
   - Username

3. **Raspberry Pi setup:**
   - Node.js installed
   - PostgreSQL installed and configured
   - nginx installed
   - Systemd service configured

### Deployment Flow

```
Local Machine                    Raspberry Pi
─────────────                    ────────────
1. npm run build                 
   (frontend + backend)          
                                 
2. SSH connect          ──────>  
                                 
3. Upload files         ──────>  /opt/waste-dashboard/
   - dist/                       ├── frontend/dist/
   - package.json                └── backend/
   - .env                            ├── dist/
   - nginx config                    ├── data/
                                     └── .env
                                 
4. Install & restart    ──────>  npm ci --omit=dev
                                 systemctl restart waste-backend
                                 systemctl reload nginx
```

### Quick Deploy

```bash
# One-command deployment
make deploy-pi    # (if added to Makefile)

# Or manually
cd deployment/dashboard/scripts
./deploy_pi.sh
```

### Manual Build and Deploy

If you prefer manual control:

```bash
# 1. Build locally
npm run build:api
npm run build:dashboard

# 2. Copy to Pi
scp -r apps/dashboard/dist pi@your-pi:/opt/waste-dashboard/frontend/
scp -r apps/api/dist pi@your-pi:/opt/waste-dashboard/backend/

# 3. On Pi: install and restart
ssh pi@your-pi "cd /opt/waste-dashboard/backend && npm ci --omit=dev && sudo systemctl restart waste-backend"
```

For detailed deployment documentation, see [deployment/dashboard/README.md](deployment/dashboard/README.md#deployment-to-raspberry-pi).

## Additional Resources

- [API README](apps/api/README.md)
- [Dashboard README](apps/dashboard/README.md)
- [Deployment Guide](deployment/dashboard/README.md)
- [API Specifications](docs/specs/api/README.md)
- [Hardware Specifications](docs/specs/hardware/README.md)

## Getting Help

- Check the [main README](README.md)
- Review this development guide
- Check [deployment documentation](deployment/dashboard/README.md)
- Check [GitHub Issues](https://github.com/masaki-kasuga/sus/issues)
