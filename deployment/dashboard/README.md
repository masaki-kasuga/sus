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

### Automated Deployment Script

The `scripts/deploy_pi.sh` script automates the entire deployment process to a Raspberry Pi.

### What the Script Does

1. **Builds applications locally**
   - Installs dependencies for frontend and backend
   - Builds production-optimized bundles
   - Verifies build outputs

2. **Connects to Raspberry Pi**
   - Uses SSH with custom port (SORACOM Napter support)
   - Creates necessary directories on the Pi
   - Sets proper permissions

3. **Uploads built files**
   - Frontend: `apps/dashboard/dist/` → `/opt/waste-dashboard/frontend/dist/`
   - Backend: `apps/api/dist/` → `/opt/waste-dashboard/backend/dist/`
   - Transfers `package.json` and `package-lock.json`
   - Uploads static data files from `apps/api/data/`
   - Copies environment file (`.env.pi` → `.env`)
   - Uploads nginx configuration

4. **Installs and restarts services**
   - Runs `npm ci --omit=dev` on the Pi
   - Restarts backend systemd service
   - Reloads nginx configuration

### Prerequisites

**Local machine:**
- `ssh` command
- `scp` command
- `rsync` (optional, but recommended for faster transfers)
- `npm` installed

**Raspberry Pi:**
- SSH access configured
- Node.js installed
- nginx installed
- systemd service configured (see `deployment/raspi/systemd/`)

### Usage

```bash
# From project root
cd deployment/dashboard/scripts
./deploy_pi.sh
```

The script will prompt for:
- **SSH Port**: Custom SSH port (e.g., for SORACOM Napter)
- **SSH Host**: Hostname or IP (e.g., `54-xxx.napter.soracom.io` or `192.168.1.100`)
- **SSH User**: Username on the Pi (e.g., `pi` or `ubuntu`)

### Example Session

```bash
$ ./deploy_pi.sh

=== Deploy to Raspberry Pi (SORACOM Napter) ===
SSH port (-p): 12345
SSH host (e.g. 54-xxx.napter.soracom.io): 54-xxx.napter.soracom.io
SSH user (-l): pi

Target: pi@54-xxx.napter.soracom.io (port 12345)
Remote frontend: /opt/waste-dashboard/frontend/dist
Remote backend:  /opt/waste-dashboard/backend

Proceed? (y/N): y

=== Build frontend ===
[npm ci and build output...]

=== Build backend ===
[npm ci and build output...]

=== Ensure remote directories ===
[SSH output...]

=== Upload frontend dist ===
[rsync/scp output...]

=== Upload backend runtime ===
[rsync/scp output...]

=== Upload backend env (.env.pi -> .env) ===
[scp output...]

=== Upload nginx config ===
[scp output...]

On Pi: npm ci --omit=dev and restart backend+nginx? (y/N): y
[restart output...]

=== Done ===
Tip: You can tunnel and open http://localhost:8080 if needed.
```

### Required Environment File

Create `apps/api/.env.pi` with production settings:

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_management
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

### Remote Directory Structure

After deployment, the Raspberry Pi will have:

```
/opt/waste-dashboard/
├── frontend/
│   └── dist/              # Built React app
│       ├── index.html
│       ├── assets/
│       └── ...
└── backend/
    ├── dist/              # Compiled TypeScript
    │   └── server.js
    ├── data/              # Static JSON/CSV data
    ├── package.json
    ├── package-lock.json
    └── .env               # Production environment variables
```

### Nginx Configuration

The nginx config is uploaded to `/tmp/waste-dashboard.conf`. 

To activate it:

```bash
# On the Raspberry Pi
sudo mv /tmp/waste-dashboard.conf /etc/nginx/sites-available/waste-dashboard
sudo ln -s /etc/nginx/sites-available/waste-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Or if using the main config directly:

```bash
sudo mv /tmp/waste-dashboard.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Systemd Service

The backend should run as a systemd service. See `deployment/raspi/systemd/sustainability-api.service`.

To set up:

```bash
# On the Raspberry Pi
sudo cp /path/to/sustainability-api.service /etc/systemd/system/waste-backend.service
sudo systemctl daemon-reload
sudo systemctl enable waste-backend
sudo systemctl start waste-backend
```

### Manual Deployment Steps

If you prefer manual deployment:

1. **Build locally:**
   ```bash
   cd apps/dashboard
   npm ci
   npm run build
   
   cd ../api
   npm ci
   npm run build
   ```

2. **Copy to Pi:**
   ```bash
   scp -r apps/dashboard/dist user@pi-host:/opt/waste-dashboard/frontend/
   scp -r apps/api/dist user@pi-host:/opt/waste-dashboard/backend/
   scp apps/api/package*.json user@pi-host:/opt/waste-dashboard/backend/
   ```

3. **On the Pi:**
   ```bash
   cd /opt/waste-dashboard/backend
   npm ci --omit=dev
   sudo systemctl restart waste-backend
   ```

### Troubleshooting

#### SSH Connection Issues
```bash
# Test SSH connection
ssh -p PORT user@host

# Check SSH config
cat ~/.ssh/config
```

#### Build Failures
```bash
# Clean and rebuild
cd apps/dashboard
rm -rf node_modules dist
npm install
npm run build
```

#### Transfer Failures
```bash
# Check available disk space on Pi
ssh -p PORT user@host "df -h"

# Verify file permissions
ssh -p PORT user@host "ls -la /opt/waste-dashboard"
```

#### Service Not Starting
```bash
# On the Pi, check logs
sudo journalctl -u waste-backend -f

# Check if port is in use
sudo lsof -i :3000

# Restart service
sudo systemctl restart waste-backend
```

### Performance Tips

1. **Use rsync for faster transfers** (automatically used if available)
2. **Keep node_modules on Pi** (don't upload, use `npm ci --omit=dev`)
3. **Use SSH key authentication** (avoid password prompts)
4. **Configure SSH connection reuse** in `~/.ssh/config`:
   ```
   Host pi-host
     HostName your-pi-hostname
     Port your-port
     User your-user
     ControlMaster auto
     ControlPath ~/.ssh/control-%r@%h:%p
     ControlPersist 600
   ```

### Security Considerations

1. **Use SSH keys** instead of passwords
2. **Restrict SSH access** with firewall rules
3. **Use non-standard SSH port** (e.g., via SORACOM Napter)
4. **Keep .env.pi secure** - never commit to git
5. **Use strong database passwords**
6. **Keep system updated** on the Pi

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
