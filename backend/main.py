"""
main.py — FastAPI application entry point.

Startup sequence:
  1. Create DB tables (idempotent via CREATE TABLE IF NOT EXISTS)
  2. Seed sample data if DB is empty
  3. Register all routers under /api/v1
  4. Attach CORS middleware

Run with:
  uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import create_tables, AsyncSessionLocal
from seed import seed_database

from routers import apps, categories, reviews, favorites

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    await create_tables()
    async with AsyncSessionLocal() as db:
        await seed_database(db)
    yield
    # ── Shutdown (nothing to teardown for now) ────────────────────────────────


app = FastAPI(
    title="Telegram Web App Store API",
    description="REST backend for the Telegram mini-app marketplace.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows the React front-end (Vite dev server + deployed Vercel URL) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(apps.router,       prefix=PREFIX)
app.include_router(categories.router, prefix=PREFIX)
app.include_router(reviews.router,    prefix=PREFIX)
app.include_router(favorites.router,  prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment}
