# Executive Dashboard — Backend

REST API backend for the Nusanet Executive Dashboard. Built with **Bun** + **Hono** + **TypeScript**, connecting to multiple MySQL databases to aggregate operational metrics.

## Tech Stack

| Layer | Library |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Language | TypeScript |
| Database | MySQL 8 (via `mysql2`) |
| Cache | Redis (via `ioredis`) |
| Auth | JWT + Google OAuth + IS5 |
| Validation | Zod (`@hono/zod-validator`) |
| API Docs | Swagger UI (`@hono/swagger-ui`) |

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- MySQL 8.0
- Redis >= 6.0
- Access to NIS, NusaFiber, NusaProspect & Dashboard databases

## Getting Started

```bash
# Install dependencies
bun install

# Copy and configure environment
cp .env.example .env

# Start development server (hot reload)
bun run dev
```

The server runs on `http://localhost:4000` by default.

API documentation is available at `http://localhost:4000/api/docs`.

## Environment Variables

Create a `.env` file based on the following:

```env
PORT=4000
NODE_ENV=development
APP_URL=http://localhost:3000

# Dashboard DB (internal, read-write)
DASHBOARD_DB_HOST=localhost
DASHBOARD_DB_PORT=3306
DASHBOARD_DB_USER=root
DASHBOARD_DB_PASS=
DASHBOARD_DB_NAME=executive_dashboard
DASHBOARD_DB_POOL=10

# NIS DB (read-only)
NIS_DB_HOST=
NIS_DB_PORT=3306
NIS_DB_USER=
NIS_DB_PASSWORD=
NIS_DB_NAME=Nusanet
NIS_DB_POOL=4

# Nusafiber DB (read-only, optional)
NUSAFIBER_DB_HOST=
NUSAFIBER_DB_PORT=3306
NUSAFIBER_DB_USER=
NUSAFIBER_DB_PASSWORD=
NUSAFIBER_DB_NAME=nusafiber
NUSAFIBER_DB_POOL=10

# NusaProspect DB (read-only)
NUSAPROSPECT_DB_HOST=
NUSAPROSPECT_DB_PORT=3306
NUSAPROSPECT_DB_USER=
NUSAPROSPECT_DB_PASS=
NUSAPROSPECT_DB_NAME=bis_tenant_nusanet
NUSAPROSPECT_DB_POOL=10

# Redis Cache
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_TTL=86400           # 24 hours in seconds

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# IS5 Authentication
IS5_AUTH_URL=

# NusaWork API
NUSAWORK_API_URL=
NUSAWORK_CLIENT_ID=
NUSAWORK_CLIENT_SECRET=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
```

## API Endpoints

Base path: `/api`

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Login via IS5 credentials |
| POST | `/auth/google` | — | Login via Google OAuth token |
| POST | `/auth/refresh` | — | Refresh access token |
| GET | `/auth/me` | Bearer | Get current user profile |

### General (all require Bearer token)

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/general/noc` | — | NOC status metrics |
| GET | `/general/revenue` | `period` (YYYYMM) | Revenue summary |
| GET | `/general/revenue/period` | `startPeriod`, `endPeriod` | Revenue across date range |
| GET | `/general/revenue/monthly` | `period` | Monthly revenue trend |
| GET | `/general/isp` | `period` | ISP subscriber stats |
| GET | `/general/nusawork` | `period` | NusaWork HR stats |
| GET | `/general/homeconnect` | `period` | HomeConnect stats |
| GET | `/general/alerts` | — | Active alerts |
| GET | `/general/health` | `period` | Health metrics |

### Additional

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/additional/period` | `period` (YYYYMM) | Period breakdown details |

> `period` defaults to the current month (YYYYMM format, e.g. `202604`).

## Redis Cache

Snapshot data from external databases (NIS, NusaFiber, NusaProspect) is cached in Redis with a configurable TTL (default: 24 hours).

### How it works

1. **Cache middleware** intercepts GET requests and checks Redis first
2. On **MISS**, the request proceeds to the handler; the response is cached automatically
3. On **HIT**, the cached response is returned directly (skipping DB queries)
4. A **daily scheduler** invalidates all cache at 00:01 so fresh data is fetched on the next request
5. If Redis is unavailable, the app continues without caching (graceful degradation)

### Cached endpoints

- All `GET /api/direksi/general/*` endpoints
- All `GET /api/vp-access-business/growth/*` endpoints
- All `GET /api/vp-access-business/retention/*` endpoints
- All `GET /api/vp-access-business/service-quality/*` endpoints
- `GET /api/vp-access-business/setting/revenue`

### Not cached

- `GET /setting/target`
- `GET /setting/target/log`
- `POST /setting/target`

### Manual cache invalidation

```bash
bun run cache-prefill
```

## Project Structure

```
src/
├── config/           # Database & Redis connections, app config
├── core/
│   ├── exceptions/   # Custom exception classes
│   ├── helpers/      # Auth, date, response, cache, formatter utilities
│   └── middlewares/  # JWT auth & cache middlewares
├── jobs/             # Scheduled jobs (sync, cache prefill)
├── modules/
│   ├── auth/         # Authentication (IS5, Google, JWT)
│   ├── direksi/      # Director-level dashboard (general metrics)
│   ├── vp-access-business/  # VP Access Business (growth, retention, service quality, setting)
│   ├── additional/   # Utility endpoints (period)
│   ├── nusawork/     # NusaWork integration
│   ├── user/         # User service & serializer
│   └── is5/          # IS5 external auth integration
├── routes/
│   └── api.ts        # Route registration & DI wiring
└── index.ts          # App entrypoint
```

## Docker

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

The app container (`executive-dashboard-be`) exposes port `4000`.

Build the image standalone:

```bash
docker build -t executive-dashboard-be .
```

## Database Setup

Run the SQL schema to initialize the Dashboard database:

```bash
mysql -u root -p executive_dashboard < table.sql
```
