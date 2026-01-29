# API Server

Dashboard backend API (Node.js/Express + PostgreSQL)

## Overview

Receives sensor data, manages the DB, and provides REST endpoints for the dashboard UI.

## Key Features

- REST API for dashboard data
- PostgreSQL access for sensor readings
- JSON-based sample data for UI
- CORS and basic rate limiting

## Local Setup (npm)

```bash
cd apps/api
cp example.env .env
npm install
npm run dev
```

## Local Setup (Docker Compose)

```bash
cd deployment/dashboard/compose
docker compose -f docker-compose.yml up -d
```

## Environment

Create `.env` for local npm and `.env.dev`/`.env.prod` for compose based on `example.env`.
