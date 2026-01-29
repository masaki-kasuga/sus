# Dashboard

Web dashboard (Vite + React) for visualizing IoT device data

## Overview

Provides real-time sensor data display and historical charts, backed by `apps/api`.

## Tech Stack

- React + Vite
- TypeScript

## Local Setup (npm)

```bash
cd apps/dashboard
cp example.env .env.local
npm install
npm run dev
```

## Local Setup (Docker Compose)

```bash
cd deployment/dashboard/compose
docker compose -f docker-compose.yml up -d
```
