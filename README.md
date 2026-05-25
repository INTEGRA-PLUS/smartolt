# SmartOLT Gateway API

Enterprise-grade SmartOLT API aggregator and middleware for IntegraColom bia.

## Architecture

```
Laravel Apps / External Clients
            ↓
    SmartOLT Gateway API
    ┌─────────────────────────────────┐
    │  Fastify + JWT Auth             │
    │  Rate Limiting (Redis)          │
    │  Request Deduplication          │
    └────────────┬────────────────────┘
                 │
    ┌────────────┴────────────────────┐
    │         Service Layer           │
    │  ┌──────────┐  ┌─────────────┐ │
    │  │  Cache   │  │   Queues    │ │
    │  │  Redis   │  │   BullMQ    │ │
    │  └──────────┘  └─────────────┘ │
    │  ┌──────────────────────────┐  │
    │  │    Circuit Breaker       │  │
    │  └──────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
    ┌────────────┴────────────────────┐
    │   SmartOLT Client (Axios)       │
    │   Retry + Backoff + Timeout     │
    └────────────┬────────────────────┘
                 │
    https://{subdomain}.smartolt.com/api
```

## Stack

| Component     | Technology             |
|---------------|------------------------|
| Runtime       | Node.js 20+            |
| Framework     | Fastify 4              |
| Language      | TypeScript 5           |
| ORM           | Prisma 5               |
| Database      | PostgreSQL 16          |
| Cache         | Redis 7 + ioredis      |
| Queue         | BullMQ                 |
| HTTP Client   | Axios                  |
| Auth          | JWT (@fastify/jwt)     |
| Validation    | Zod                    |
| Docs          | Swagger/OpenAPI 3      |
| Logging       | Pino                   |
| Containers    | Docker + Compose       |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm or npm

### 1. Clone and install

```bash
cd smartolt-gateway
npm install
```

### 2. Environment setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
# Start PostgreSQL + Redis (with dev UIs)
docker-compose up -d postgres redis redis-commander pgadmin
```

### 4. Database setup

```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

### 6. Access

| URL | Description |
|-----|-------------|
| `http://localhost:3000/docs` | Swagger UI |
| `http://localhost:3000/health` | Health check |
| `http://localhost:3000/metrics` | Metrics |
| `http://localhost:8080` | pgAdmin |
| `http://localhost:8081` | Redis Commander |

## API Reference

### Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@integracolombia.online","password":"yourpassword"}'

# Use token
export TOKEN="eyJ..."
curl http://localhost:3000/api/v1/olts \
  -H "Authorization: Bearer $TOKEN"
```

### OLT Endpoints

```
GET  /api/v1/olts                    - List all OLTs (cached 10m)
GET  /api/v1/olts/:oltId             - OLT detail (cached)
GET  /api/v1/olts/:oltId/running-config - Running config (not cached)
DELETE /api/v1/olts/cache            - Invalidate OLT cache
```

### ONU Endpoints

```
GET  /api/v1/onus                    - List all ONUs (cached 5m)
GET  /api/v1/onus?olt_id=123         - ONUs by OLT (cached)
GET  /api/v1/onus/:sn                - ONU detail (cached)
GET  /api/v1/onus/:sn/status         - ONU status (cached 5m)
GET  /api/v1/onus/signal-levels      - All signal levels (cached 15m)
GET  /api/v1/onus/signal-levels?sn=X - Signal by SN (cached)
GET  /api/v1/onus/types              - ONU types (cached 24h)
GET  /api/v1/onus/unauthorized       - Unauthorized ONUs (cached 1m)
DELETE /api/v1/onus/cache            - Invalidate ONU cache
DELETE /api/v1/onus/cache?sn=X       - Invalidate specific ONU cache
```

### ONU Operations (Queued)

All write operations return immediately with a `jobId` and execute asynchronously via BullMQ.

```
POST /api/v1/onus/reboot             - Reboot ONU
POST /api/v1/onus/authorize          - Authorize ONU
POST /api/v1/onus/move               - Move ONU
POST /api/v1/onus/enable             - Enable ONU
POST /api/v1/onus/disable            - Disable ONU
POST /api/v1/onus/delete             - Delete ONU
POST /api/v1/onus/restore-factory    - Restore factory settings
POST /api/v1/onus/resync-config      - Resync ONU config
GET  /api/v1/onus/jobs/:jobId        - Check job status
```

**Example reboot:**
```json
POST /api/v1/onus/reboot
{
  "sn": "HWTC12345678",
  "olt_id": 1
}

Response 202:
{
  "success": true,
  "data": {
    "jobId": "42",
    "status": "queued"
  }
}
```

### Tenant Management

```
GET    /api/v1/tenants               - List tenants
POST   /api/v1/tenants               - Create tenant
GET    /api/v1/tenants/:id           - Get tenant
PATCH  /api/v1/tenants/:id           - Update tenant
DELETE /api/v1/tenants/:id           - Delete tenant
POST   /api/v1/tenants/:id/toggle-status
GET    /api/v1/tenants/:id/stats
```

## Cache Configuration

Default TTL values (configurable per tenant via `cacheRules`):

| Endpoint | TTL | Env Var |
|----------|-----|---------|
| OLTs | 10 min | `CACHE_TTL_OLTS` |
| ONUs | 5 min | `CACHE_TTL_ONUS` |
| Signal Levels | 15 min | `CACHE_TTL_SIGNAL_LEVELS` |
| ONU Status | 5 min | `CACHE_TTL_ONU_STATUS` |
| ONU Types | 24 h | `CACHE_TTL_ONU_TYPES` |

Per-tenant overrides via `cacheRules` field:

```json
{
  "olts": 1200,
  "onus": 600,
  "signal_levels": 1800
}
```

## Production Deployment

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Run migrations on production
docker-compose exec api npx prisma migrate deploy
```

### Environment Variables

See `.env.example` for all available options. Critical variables:

```env
JWT_SECRET=<min 32 chars random string>
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis-host
REDIS_PASSWORD=strong-password
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=StrongPassword123!
```

## Circuit Breaker

The circuit breaker protects against SmartOLT outages:

- **CLOSED**: Normal operation
- **OPEN**: After `SMARTOLT_CIRCUIT_BREAKER_THRESHOLD` consecutive failures, blocks requests for `SMARTOLT_CIRCUIT_BREAKER_TIMEOUT` ms
- **HALF_OPEN**: After timeout, allows limited requests to test recovery

Circuit state is visible in `/health` and `/metrics`.

## Queue System

Write operations are processed asynchronously:

1. Client posts to e.g. `/api/v1/onus/reboot` → receives `jobId` instantly
2. BullMQ worker processes the actual SmartOLT API call
3. Client polls `/api/v1/onus/jobs/:jobId` for status
4. Failed jobs retry with exponential backoff (configurable attempts)

## Multi-Tenant

Each request resolves the tenant from the JWT `tenantId` claim:
- Tenant-specific SmartOLT `subdomain` and `xToken` are never exposed to clients
- Cache keys are namespaced per tenant: `smartolt:tenant:{id}:olts`
- Rate limits are enforced per-tenant
- Audit logs track all operations per tenant

## Development Commands

```bash
npm run dev           # Start with hot reload
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run lint:fix      # Auto-fix lint issues
npm run db:studio     # Prisma Studio UI
npm run db:seed       # Seed database
npm run test          # Run tests
npm run health        # Quick health check
```
