# CyberSec & IAM Blog

A cybersecurity and Identity & Access Management (IAM) blog built with **CQRS**, **event sourcing**, and an **event-driven** backend. Writes go through commands that append events; reads come from optimized PostgreSQL read models updated by projections.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [Redis (Optional)](#redis-optional)
9. [API](#api)
10. [Admin Panel](#admin-panel)
11. [Security](#security)
12. [Scripts Reference](#scripts-reference)
13. [Testing](#testing)
14. [Docker](#docker)
15. [Deployment Notes](#deployment-notes)
16. [Backups](#backups)
17. [Troubleshooting](#troubleshooting)
18. [Extending the Application](#extending-the-application)

---

## Architecture

### Core principles

- **CQRS** — Commands change state; queries read from read models only.
- **Event sourcing** — State changes are stored as immutable events in PostgreSQL.
- **Event-driven** — Domain events trigger projections that update read models.
- **Eventual consistency** — Read models catch up asynchronously after events are written.

### Request flow (write)

```
API route → CommandBus → Command handler → PostgresEventStore (events table)
                                        → EventBus → Projection → ReadModelStore (blog_posts, etc.)
```

### Request flow (read)

```
API route → QueryBus → Query handler → ReadModelStore (Sequelize / PostgreSQL)
```

### Key backend components

| Component | Location | Role |
|-----------|----------|------|
| `PostgresEventStore` | `src/backend/infrastructure/PostgresEventStore.js` | Persists events to the `events` table |
| `ReadModelStore` | `src/backend/infrastructure/ReadModelStore.js` | Sequelize access to read-model tables |
| `CommandBus` | `src/backend/infrastructure/CommandBus.js` | Routes commands to handlers |
| `QueryBus` | `src/backend/infrastructure/QueryBus.js` | Routes queries to handlers |
| `EventBus` | `src/backend/infrastructure/EventBus.js` | Publishes events to projections |
| `BlogPostProjection` | `src/backend/readModels/projections/BlogPostProjection.js` | Updates `blog_posts` from blog events |
| Domain commands/events | `src/backend/domain/` | Command and event definitions |
| Command/query handlers | `src/backend/application/` | Business logic |

### Frontend

React 18 SPA (Vite) with pages for public blog content and an admin area for post management, newsletter subscribers, contact messages, and AI-assisted post generation.

---

## Technology Stack

### Backend

- Node.js + Express
- PostgreSQL (event store **and** read models via Sequelize)
- Redis (optional — rate limiting only)
- JWT auth in HTTP-only cookies
- Winston logging, Helmet security headers, Joi validation
- OpenAI integration for AI post generation (optional)

### Frontend

- React 18, Vite, Tailwind CSS
- React Query, React Router, Framer Motion
- Markdown rendering with syntax highlighting

### Infrastructure

- Docker Compose for PostgreSQL and optional Redis
- GitHub Actions for CI (unit tests, e2e)
- Production targets: Railway (backend), Vercel (frontend)

> **Note:** Older docs referenced MongoDB and EventStore DB. The current codebase uses **PostgreSQL only** for both events and read models.

---

## Project Structure

```
iam_blog/
├── src/backend/
│   ├── api/routes/           # REST endpoints (blog, auth, contact, newsletter, upload, analytics)
│   ├── application/          # Command and query handlers
│   ├── config/               # Environment and security config
│   ├── domain/               # Commands, events, aggregates
│   ├── infrastructure/       # Event store, buses, read model store
│   ├── middleware/           # Rate limiting, sanitization, timeouts
│   ├── migrations/           # Sequelize migrations (production)
│   ├── models/               # Sequelize models (BlogPost, User, etc.)
│   ├── readModels/projections/
│   ├── server.js             # Application entry point
│   └── utils/
├── frontend/
│   ├── src/components/
│   ├── src/pages/            # Public pages + admin/*
│   ├── src/services/         # API client
│   └── vite.config.js        # Dev proxy: /api → localhost:3001
├── scripts/                  # DB setup, migrations, backups, admin user
├── tests/                    # Unit, integration, e2e (Playwright)
├── docker-compose.yml
├── env.example
└── README.md
```

---

## Prerequisites

- **Node.js 18+** and npm
- **Docker Desktop** (recommended for PostgreSQL)
- **Git**

On Windows, if `node` / `npm` are not found in Cursor's terminal after installing Node, restart Cursor or add `C:\Program Files\nodejs\` to your PATH.

---

## Local Development Setup

### 1. Install dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp env.example .env
npm run generate:jwt
```

`JWT_SECRET` must be at least 32 characters and must **not** use the placeholder from `env.example`.

### 3. Start PostgreSQL

```bash
docker compose up -d postgresql
```

`npm run dev:backend` also runs `scripts/auto-start-postgres.js`, which can start PostgreSQL via Docker automatically.

### 4. Initialize database (first run)

**Development** — tables auto-sync on backend startup. For sample data and a clean schema:

```bash
npm run setup:db
npm run create:admin
```

**Production** — use migrations instead of auto-sync:

```bash
npm run migrate:up
npm run create:admin
```

### 5. Start the app

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api-docs |
| Health check | http://localhost:3001/health |

The Vite dev server proxies `/api` to the backend, so `VITE_API_URL` is not required locally.

### Verify dependencies before starting

```bash
npm run check:deps
```

### Import from production (Railway)

Posts live in **PostgreSQL** (`blog_posts` + `events`), not in the frontend alone. Local dev starts with an empty DB unless you import production data.

1. Copy the production connection string from **Railway → PostgreSQL → Variables → `DATABASE_URL`** (or Connect tab).
2. Append `?sslmode=require` if it is not already in the URL.
3. Run (PowerShell):

```powershell
$env:PRODUCTION_POSTGRESQL_URI="postgresql://USER:PASS@HOST:PORT/railway?sslmode=require"
npm run import:production
```

This dumps production via Docker and restores into your local `POSTGRESQL_URI` from `.env`. Your production admin login password is imported with the `users` table.

**Do not run `npm run setup:db` after import** — it drops all tables.

Alternative: download a Railway backup manually and run `npm run restore:db -- backups/your-file.dump --force`.

---

## Environment Variables

Copy `env.example` to `.env`. Required and commonly used variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Min 32 chars; generate with `npm run generate:jwt` |
| `POSTGRESQL_URI` | Yes* | Default: `postgresql://postgres:postgres@localhost:5432/iam_blog_db` |
| `DATABASE_URL` | Alt* | Alternative to `POSTGRESQL_URI` |
| `PORT` | No | Backend port (default `3001`) |
| `FRONTEND_URL` | Prod | CORS origin (default `http://localhost:3000`) |
| `REDIS_URL` | No | e.g. `redis://localhost:6379` — enables distributed rate limiting |
| `OPENAI_API_KEY` | No | Required only for AI post generation |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` | No | Used by `npm run create:admin` only |
| `SITE_AUTHOR_NAME` / `SITE_AUTHOR_EMAIL` | No | Public author byline (default: `Ilirijana Zuka`) |
| `VITE_SITE_AUTHOR_NAME` | No | Frontend author name (Vercel); defaults to `Ilirijana Zuka` |
| `VITE_GOOGLE_ADSENSE_CLIENT_ID` | No | AdSense client ID (`ca-pub-...`); required to show ads |
| `VITE_ADSENSE_SLOT_BLOG_LIST` | No | Ad unit slot ID for blog list banner |
| `VITE_ADSENSE_SLOT_BLOG_POST_SIDEBAR` | No | Ad unit slot ID for article sidebar |
| `VITE_ADSENSE_SLOT_BLOG_POST_IN_ARTICLE` | No | Ad unit slot ID below article body |

See `env.example` for backup, logging, rate limit, and upload settings.

---

## Database

### Tables

| Table | Purpose |
|-------|---------|
| `events` | Event store — immutable history (`PostgresEventStore`) |
| `blog_posts` | Blog read model |
| `users` | Admin users |
| `newsletter_subscriptions` | Newsletter subscribers |
| `contact_messages` | Contact form submissions |
| `SequelizeMeta` | Migration tracking |

### Blog post event types

`BlogPostCreated`, `BlogPostUpdated`, `BlogPostPublished`, `BlogPostUnpublished`, `BlogPostDeleted`, `TagAddedToBlogPost`, `TagRemovedFromBlogPost`, `BlogPostViewed`

### Migrations

Migration files live in `src/backend/migrations/`.

```bash
npm run migrate:status   # Show pending/applied migrations
npm run migrate:up       # Apply pending migrations
```

- **Development:** Sequelize `sync()` creates/updates tables on startup.
- **Production:** Auto-sync is disabled; run `migrate:up` before deploy.

### Useful SQL

```sql
-- Published posts
SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC;

-- Events for one post
SELECT * FROM events WHERE stream_id = 'blogpost-<POST_ID>' ORDER BY event_number;
```

---

## Redis (Optional)

Redis is **not required**. It is used only for **distributed rate limiting** (`rate-limit-redis`). Without Redis, the app uses an in-memory store (fine for single-instance local dev).

```bash
docker compose up -d redis
```

Set in `.env`:

```
REDIS_URL=redis://localhost:6379
```

Health checks report Redis as optional/degraded when unavailable; the app keeps running.

---

## API

Interactive docs: **http://localhost:3001/api-docs** (OpenAPI JSON at `/api-docs.json`).

### Authentication

Cookie-based JWT. Login via `POST /api/auth/login` sets an HTTP-only `adminToken` cookie.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Admin login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Current user |

### Blog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blog/posts` | No | Published posts (paginated) |
| GET | `/api/blog/posts/:postId` | No | Post by ID |
| GET | `/api/blog/posts/slug/:slug` | No | Post by slug |
| GET | `/api/blog/search` | No | Search |
| GET | `/api/blog/iam` | No | IAM posts |
| GET | `/api/blog/security` | No | Security posts |
| POST | `/api/blog/posts` | Admin | Create post |
| PUT | `/api/blog/posts/:postId` | Admin | Update post |
| DELETE | `/api/blog/posts/:postId` | Admin | Delete post |
| POST | `/api/blog/posts/:postId/publish` | Admin | Publish |
| POST | `/api/blog/posts/:postId/unpublish` | Admin | Unpublish |

### Contact, newsletter, uploads

- `POST /api/contact/send` — public contact form
- `POST /api/newsletter/subscribe` / `unsubscribe` — public
- `GET /api/contact/messages`, `GET /api/newsletter/subscribers` — admin
- `POST /api/upload/files` — admin file upload

### Rate limits (defaults)

| Limiter | Window | Max |
|---------|--------|-----|
| Auth (login) | 15 min | 5 |
| General | 15 min | 100 |
| Read | 15 min | 200 |
| Write | 15 min | 20 |

### Error format

```json
{
  "success": false,
  "message": "Error message",
  "requestId": "uuid"
}
```

---

## Admin Panel

| URL | Purpose |
|-----|---------|
| `/admin/login` | Login |
| `/admin` or `/admin/dashboard` | Dashboard |
| `/admin/posts` | Manage posts |
| `/admin/posts/new` | Create post |
| `/admin/posts/:id/edit` | Edit post |
| `/admin/generate` | AI post generation |
| `/admin/newsletter` | Subscribers |
| `/admin/contact` | Contact messages |

Create the first admin user with `npm run create:admin` (uses `ADMIN_*` vars in `.env`).

---

## Security

- **Input sanitization** — DOMPurify (`isomorphic-dompurify`) for HTML; plain-text fields stripped of tags
- **SQL injection checks** — Parameterized Sequelize queries + validation middleware
- **Security headers** — Helmet (CSP, HSTS, etc.)
- **Rate limiting** — Per-IP limits on auth and API routes
- **JWT** — HTTP-only cookies; secret validated on startup (min 32 chars)
- **Passwords** — bcrypt hashing
- **File uploads** — MIME type, extension, size, and path-traversal checks

Run security-related tests:

```bash
npm run test:sanitization
npm run test:security-headers
```

---

## Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + frontend |
| `npm run dev:backend` | Auto-start Postgres, check deps, nodemon |
| `npm run dev:frontend` | Vite on port 3000 |
| `npm run check:deps` | Validate `.env`, JWT, PostgreSQL |
| `npm run start:postgres` | Start PostgreSQL via Docker |

### Database

| Script | Description |
|--------|-------------|
| `npm run setup:db` | Drop/recreate tables + sample data |
| `npm run migrate:up` | Run pending migrations |
| `npm run migrate:status` | Migration status |
| `npm run create:admin` | Create admin user |
| `npm run backup:db` | Backup (local pg tools) |
| `npm run backup:db:docker` | Backup via Docker |
| `npm run restore:db` | Restore from backup |
| `npm run indexes:verify` | Verify DB indexes |

### Build & production

| Script | Description |
|--------|-------------|
| `npm run build` | Build backend (Babel) + frontend (Vite) |
| `npm start` | Run backend (no nodemon) |
| `npm run health:check` | External health monitor script |
| `npm run import:production` | Copy production PostgreSQL data into local dev DB |

---

## Testing

```bash
npm test                  # All Jest tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright e2e (requires running app)
npm run test:e2e:ui       # Playwright UI mode
```

E2e tests expect PostgreSQL and optionally Redis (see `.github/workflows/e2e.yml`).

---

## Docker

```bash
# Infrastructure only (typical local dev)
docker compose up -d postgresql

# Optional Redis
docker compose up -d redis

# Full stack (backend + frontend containers)
docker compose up --build
```

Services in `docker-compose.yml`:

| Service | Port | Notes |
|---------|------|-------|
| `postgresql` | 5432 | Required |
| `redis` | 6379 | Optional |
| `backend` | 3001 | Uses container network for DB |
| `frontend` | 3000 | Nginx serving Vite build |
| `eventstore` | 2113 | Legacy service; **not used** by current backend |

---

## Deployment Notes

Typical production layout:

- **Frontend** — Vercel (`frontend/`), set `VITE_API_URL` to the Railway backend URL
- **Backend** — Railway, set `POSTGRESQL_URI`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
- **Database** — Railway PostgreSQL, Supabase, or other managed Postgres
- **Migrations** — Run `npm run migrate:up` against production DB before starting the backend

Production checklist:

1. Set strong `JWT_SECRET` (32+ chars)
2. Run migrations (`npm run migrate:up`)
3. Set `FRONTEND_URL` for CORS
4. Optionally set `REDIS_URL` for distributed rate limiting
5. Configure backups (`BACKUP_*` env vars)

---

## Backups

```bash
npm run backup:db          # Requires local pg_dump
npm run backup:db:docker   # Uses Docker PostgreSQL container
npm run restore:list       # List backups in ./backups
npm run restore:db <file>  # Restore
```

Configure via `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `BACKUP_COMPRESS`, `BACKUP_FORMAT` in `.env`.

---

## Troubleshooting

### `node` / `npm` not recognized (Windows / Cursor)

Node is installed but PATH may be stale. Restart Cursor, or run:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

### Proxy / `ECONNREFUSED` on startup

The frontend starts before the backend. Check the backend terminal for errors. Common causes:

1. PostgreSQL not running → `docker compose up -d postgresql`
2. Missing or invalid `.env` → `cp env.example .env` then `npm run generate:jwt`
3. Default `JWT_SECRET` still set → must change before backend starts

### Database connection failed

```bash
docker compose up -d postgresql
docker compose ps
npm run check:deps
```

### JWT_SECRET errors

```bash
npm run generate:jwt
```

### Backend starts but admin login fails

```bash
npm run create:admin
```

---

## Extending the Application

To add a new feature following CQRS:

1. **Define a command** in `src/backend/domain/commands/`
2. **Define events** in `src/backend/domain/events/`
3. **Add a command handler** in `src/backend/application/commandHandlers/`
4. **Register the handler** on the `CommandBus` in `server.js`
5. **Update or add a projection** in `src/backend/readModels/projections/`
6. **Add query handlers** if new read patterns are needed
7. **Expose via routes** in `src/backend/api/routes/`
8. **Add a migration** for schema changes (required for production)

Example command handler pattern:

```javascript
async handleCreateBlogPost(command) {
  const event = new BlogPostCreatedEvent(eventData);
  await this.eventStore.appendToStream(`blogpost-${postId}`, [event]);
  await this.eventBus.publish(event);
}
```

Projection pattern:

```javascript
async onBlogPostCreated(event) {
  await this.readModelStore.create('BlogPost', mappedData);
}
```

---

## License

MIT — see [LICENSE](LICENSE).

---

**Built for the cybersecurity and IAM community.**
