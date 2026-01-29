## Overall Architecture (conf-managed)

```bash
[ Development PC (WSL2) ]
  ├─ sus/
  │   ├─ apps/
  │   │   ├─ dashboard (Vite / React)
  │   │   │    └─ dist/                     ← build output (static files)
  │   │   └─ api (Node.js / Express)
  │   │        ├─ dist/                     ← build output (server runtime)
  │   │        ├─ data/                     ← runtime data (json/csv)
  │   │        ├─ package.json
  │   │        └─ package-lock.json
  │   └─ deployment/
  │        └─ dashboard/
  │             └─ nginx/
  │                  └─ waste-dashboard.conf  ← nginx config (versioned)
  └─ Transfer artifacts to Raspberry Pi via scp/rsync

[ Raspberry Pi ]
  ├─ /opt/waste-dashboard/
  │    ├─ frontend/dist/     ← deployed static files
  │    └─ backend/           ← deployed backend runtime + data
  ├─ /etc/nginx/sites-available/
  │    └─ waste-dashboard    ← deployed nginx config (from repo)
  ├─ nginx (0.0.0.0:8080)
  │    ├─ serves frontend dist
  │    └─ /api → reverse proxy to backend (127.0.0.1:3000)
  ├─ backend (systemd)
  │    └─ listens on 127.0.0.1:3000
  └─ SORACOM Napter (SSH / Port forwarding)
```

---

## Steps to publish the build artifacts to Raspberry Pi (conf-managed)

### A) On your Development PC (WSL2)

#### Optional helper script

You can run the deploy helper to build + upload + (optionally) restart:

```bash
./deployment/dashboard/scripts/deploy_pi.sh
```

#### 1. Build frontend

```bash
cd ~/workspace/sus/apps/dashboard
npm ci
npm run build
```

Check:

```bash
ls -la dist
# index.html / assets/* should exist
```

#### 2. Build backend

```bash
cd ~/workspace/sus/apps/api
npm ci
npm run build
```

Check:

```bash
ls -la dist
# server.js and compiled folders should exist
```

#### 3. Ensure nginx config exists in your repo

Recommended location:

```bash
~/workspace/sus/deployment/dashboard/nginx/waste-dashboard.conf
```

Example content (same logic as your initial version, but in repo-managed form):

```nginx
server {
    listen 8080;
    server_name _;

    root /opt/waste-dashboard/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 4. What to send to Raspberry Pi

**Frontend**

* `apps/dashboard/dist/` only

**Backend**

* `apps/api/dist/`
* `apps/api/package.json`
* `apps/api/package-lock.json`
* `apps/api/data/`  ← required in your case (CSV/JSON runtime files)

**Nginx config**

* `deployment/dashboard/nginx/waste-dashboard.conf`

#### 5. Transfer to Raspberry Pi (scp)

```bash
# frontend
scp -P 31896 -r \
  ~/workspace/sus/apps/dashboard/dist \
  dwc-pi-five@13-192-42-85.napter.soracom.io:/opt/waste-dashboard/frontend/

# backend
scp -P 31896 -r \
  ~/workspace/sus/apps/api/{dist,package.json,package-lock.json,data} \
  dwc-pi-five@13-192-42-85.napter.soracom.io:/opt/waste-dashboard/backend/

# nginx conf (repo-managed)
scp -P 31896 \
  ~/workspace/sus/deployment/dashboard/nginx/waste-dashboard.conf \
  dwc-pi-five@13-192-42-85.napter.soracom.io:/tmp/waste-dashboard.conf
```

> Why `/tmp`? Because writing directly into `/etc/nginx/...` requires sudo.
> So we upload to a writable location first, then move it with sudo on the Pi.

---

### B) On the Raspberry Pi

#### 1. First time only: install packages

```bash
sudo apt update
sudo apt install -y nginx
node -v || true
npm -v || true
```

#### 2. Backend: install production dependencies

```bash
cd /opt/waste-dashboard/backend
npm ci --omit=dev
```

Your output:

* `found 0 vulnerabilities` ✅ good
* npm version update notice ✅ optional, not required for now

#### 3. Systemd (backend resident)

Create `/etc/systemd/system/waste-backend.service` (you already have it; this is correct):

```ini
[Unit]
Description=Waste Dashboard Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/waste-dashboard/backend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=3
User=dwc-pi-five
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Apply:

```bash
sudo systemctl daemon-reload
sudo systemctl enable waste-backend
sudo systemctl restart waste-backend
```

Check:

```bash
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3000/api/dashboard | head
```

#### 4. Deploy nginx config (from repo → /etc/nginx)

Move the uploaded file into the standard nginx location:

```bash
sudo mv /tmp/waste-dashboard.conf /etc/nginx/sites-available/waste-dashboard
sudo chown root:root /etc/nginx/sites-available/waste-dashboard
sudo chmod 644 /etc/nginx/sites-available/waste-dashboard
```

Enable it:

```bash
sudo ln -sf /etc/nginx/sites-available/waste-dashboard /etc/nginx/sites-enabled/waste-dashboard
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Final checks on the Pi

```bash
curl -v http://127.0.0.1:8080/
curl -s http://127.0.0.1:8080/api/dashboard | head
```

---

## How to view the Raspberry Pi web app from your Development PC (SSH tunnel)

### 1) SSH port forwarding (Dev PC)

```bash
ssh -p 31896 \
  -L 8080:127.0.0.1:8080 \
  dwc-pi-five@13-192-42-85.napter.soracom.io
```

### 2) Open in your Dev PC browser

```bash
http://localhost:8080
```

**Yes**: when you open `http://localhost:8080` on your Dev PC, you are seeing **the Raspberry Pi’s nginx:8080**, because the SSH tunnel maps:

* Dev PC `localhost:8080`
  → Pi `127.0.0.1:8080`

---

## What changed vs the initial version?

1. **nginx config is now a tracked artifact** (`deployment/dashboard/nginx/waste-dashboard.conf`)
2. Deployment includes **copying the conf** to `/etc/nginx/sites-available/`
3. This makes your setup **portable**: other developers or another Pi can reproduce it by following the same steps.

---

### Overall Architecture (Initial version)
```bash
[ Development PC (WSL2) ]
  ├─ frontend (Vite / React)
  │    └─ dist/  ← Static files
  ├─ backend (Node.js / Express)
  │    ├─ dist/
  │    ├─ data/
  │    └─ package.json
  └─ Transfer to Raspberry Pi via scp

[ Raspberry Pi ]
  ├─ nginx (8080)
  │    ├─ Deploy frontend dist
  │    └─ /api → Reverse proxy to backend(3000)
  ├─ backend (Persistent with systemd)
  │    └─ http://127.0.0.1:3000
  └─ SORACOM Napter (SSH / Port forwarding)
```

## Steps to publish the build file as a web application on Raspberry Pi
### Run on your development PC
###
1. Build frontend
    ```bash
    cd ~/workspace/sus/apps/dashboard
    npm install
    npm run build
    ```


    #### Check:
    ```bash
    ls dist
    # index.html / assets/* is OK
    ```
    
2. Build backend
    ```bash
    cd ~/workspace/sus/apps/api
    npm install
    npm run build
    ```

    #### Check:
    ```bash
    ls dist
    # server.js, controllers/, services/, repository/, etc.
    ```


3. What to send to Raspberry Pi
    #### Frontend
    - Send only dist/ (since it's static delivery)

    #### Backend
    - dist/
    - package.json
    - package-lock.json
    - data/


4. Transfer to Raspberry Pi with scp
    ```bash
    # frontend
    scp -P 31896 -r \
    ~/workspace/sus/apps/dashboard/dist \
    dwc-pi-five@13-192-42-85.napter.soracom.io:/opt/waste-dashboard/frontend/

    # backend
    scp -P 31896 -r \
    ~/workspace/sus/apps/api/{dist,package.json,package-lock.json,data} \
    dwc-pi-five@13-192-42-85.napter.soracom.io:/opt/waste-dashboard/backend/
    ```

###
### What to do on the Raspberry Pi
###
1. Install Node.js & nginx(first time only)
    ```bash
    sudo apt update
    sudo apt install -y nodejs npm nginx
    ```

2. Putting backend dependencies into production
    ```bash
    cd /opt/waste-dashboard/backend
    npm ci --omit=dev
    ```

3. Systemd settings(backend resident)
    ```bash
    [Unit]
    Description=Waste Dashboard Backend
    After=network.target

    [Service]
    Type=simple
    WorkingDirectory=/opt/waste-dashboard/backend
    Environment=NODE_ENV=production
    Environment=PORT=3000
    ExecStart=/usr/bin/node dist/server.js
    Restart=on-failure
    RestartSec=3
    User=dwc-pi-five
    StandardOutput=journal
    StandardError=journal

    [Install]
    WantedBy=multi-user.target
    ```

4. Reflection
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable waste-backend
    sudo systemctl start waste-backend
    ```

5. Check
    ```bash
    curl http://127.0.0.1:3000/health
    ```

6. nginx settings(frontend + reverse proxy)
    ```nginx
    server {
        listen 8080;
        server_name _;

        root /opt/waste-dashboard/frontend/dist;
        index index.html;

        location / {
            try_files $uri /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

7. Enable
    ```bash
    sudo ln -sf /etc/nginx/sites-available/waste-dashboard /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    ```

8. Check
    ```bash
    curl http://127.0.0.1:8080
    curl http://127.0.0.1:8080/api/dashboard
    ```

### How to view a web application from your development PC
###
#### Run on your development PC
1. SSH port forwarding
    ```bash
    ssh -p 31896 \
        -L 8080:127.0.0.1:8080 \
        dwc-pi-five@13-192-42-85.napter.soracom.io
    ```

2. Open in browser
    ```bash
    http://localhost:8080
    ```
