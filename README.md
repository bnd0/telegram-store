# Telegram Web App Store

A full-stack Telegram Mini App marketplace — browse, search, and launch
Telegram Web Apps from inside the Telegram client.

## Stack

| Layer      | Tech                                      |
|------------|-------------------------------------------|
| Frontend   | React 18 · Vite · Tailwind CSS · Zustand  |
| Backend    | Python 3.12 · FastAPI · SQLAlchemy async  |
| Primary DB | PostgreSQL 16                             |
| Cache      | Redis 7                                   |
| Serving    | Nginx (SPA + API reverse proxy)           |
| Containers | Docker + Docker Compose                   |

---

## Project Structure

```
telegram-store/
├── docker-compose.yml              # All 4 services wired together
├── backend/
│   ├── Dockerfile                  # Python 3.12-slim, uvicorn
│   ├── main.py                     # FastAPI app, lifespan, CORS, routers
│   ├── config.py                   # Pydantic-settings (.env loader)
│   ├── database.py                 # SQLAlchemy engine + 4 ORM tables
│   ├── cache.py                    # Redis async client + key helpers
│   ├── schemas.py                  # Pydantic v2 request/response models
│   ├── seed.py                     # 8 categories + 14 sample apps
│   ├── requirements.txt
│   └── routers/
│       ├── apps.py                 # List, search, detail, create, launch
│       ├── categories.py           # Category listing (cached 5 min)
│       ├── reviews.py              # Read + post reviews
│       └── favorites.py            # Toggle + list per Telegram user
└── frontend/
    ├── Dockerfile                  # Multi-stage: Node build → Nginx serve
    ├── nginx.conf                  # SPA fallback + /api proxy → backend
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx / App.jsx / api.js / store.js / index.css
        ├── hooks/useApps.js
        ├── components/
        │   ├── Header.jsx / CategoryTabs.jsx / AppCard.jsx
        │   ├── FeaturedBanner.jsx / BottomNav.jsx
        │   ├── StarRating.jsx / ReviewList.jsx
        └── pages/
            ├── HomePage.jsx / AppDetailPage.jsx
            ├── TrendingPage.jsx / FavoritesPage.jsx
```

---

## Running with Docker (recommended)

```bash
cd telegram-store
docker compose up --build
# Store  → http://localhost:3000
# API docs → http://localhost:8000/docs
```

On first boot the backend auto-creates tables and seeds 14 sample apps.

### Useful commands

```bash
docker compose up --build      # rebuild and start
docker compose up -d           # start in background
docker compose down            # stop (data preserved)
docker compose down -v         # stop + wipe DB (fresh start)
docker compose logs -f backend # tail backend logs
docker compose ps              # service health
```

---

## Local Development (no Docker)

```bash
# Start just the DBs
docker compose up postgres redis -d

# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev  # http://localhost:5173
```

---

## How the Docker network works

```
Browser
  │
  └─► frontend:3000 (Nginx)
        ├── /        → React SPA static files
        └── /api/*   → proxy_pass http://backend:8000
                              ├── postgres:5432
                              └── redis:6379
```

Nginx is the single entry point — no CORS issues since /api is proxied server-side.

---

## API Reference

| Method | Route                     | Cache  | Description                      |
|--------|---------------------------|--------|----------------------------------|
| GET    | /api/v1/apps              | 5 min  | List apps (filter + paginate)    |
| GET    | /api/v1/apps/featured     | 10 min | Featured apps for banner         |
| GET    | /api/v1/apps/{id}         | 10 min | App detail                       |
| POST   | /api/v1/apps              | bust   | Create app                       |
| POST   | /api/v1/apps/{id}/launch  | bust   | Increment install counter        |
| GET    | /api/v1/categories        | 5 min  | All categories                   |
| GET    | /api/v1/reviews/{app_id}  | 2 min  | Reviews for an app               |
| POST   | /api/v1/reviews           | bust   | Post review (1 per Telegram user)|
| GET    | /api/v1/favorites         | none   | User's favorites (always fresh)  |
| POST   | /api/v1/favorites/toggle  | —      | Add / remove favorite            |
| GET    | /health                   | —      | Health check                     |

---

## Production Deployment

### Docker on a VPS
```bash
# Edit docker-compose.yml — set strong passwords + real CORS_ORIGINS
docker compose up --build -d
# Put Caddy/Nginx in front for TLS
```

### Managed Cloud
- Backend → **Railway** or **Render**
- Frontend → **Vercel** (`VITE_API_BASE=https://your-api.railway.app/api/v1`)
- DB → **Supabase** (free PostgreSQL)
- Cache → **Upstash** (free serverless Redis)

### Telegram Bot Setup
1. `@BotFather` → `/newbot` → get token
2. `/newapp` → set your deployed frontend URL
3. Users open the bot → store loads inside Telegram
