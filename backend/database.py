"""
database.py — Async SQLAlchemy engine, session factory, and ORM models.

Table layout:
  categories  → top-level groupings (Games, Tools, AI, …)
  apps        → the mini-apps listed in the store
  reviews     → user reviews attached to an app
  favorites   → junction table: telegram_user_id ↔ app_id

All timestamps are UTC and managed by the DB (server_default).
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text,
    ForeignKey, DateTime, func, UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from config import get_settings

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,   # drop stale connections automatically
    pool_size=10,
    max_overflow=20,
    echo=(settings.environment == "development"),
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


# ── Base ──────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Models ────────────────────────────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id       = Column(Integer, primary_key=True)
    slug     = Column(String(60), unique=True, nullable=False)   # e.g. "games"
    name     = Column(String(120), nullable=False)               # e.g. "Games"
    icon     = Column(String(10), nullable=False, default="📦")  # emoji shorthand
    position = Column(Integer, default=0)                        # display order

    apps = relationship("App", back_populates="category")


class App(Base):
    __tablename__ = "apps"

    id           = Column(Integer, primary_key=True)
    name         = Column(String(120), nullable=False)
    slug         = Column(String(120), unique=True, nullable=False)
    description  = Column(Text, nullable=False)
    icon_url     = Column(String(500), nullable=False)
    banner_url   = Column(String(500))
    telegram_url = Column(String(500), nullable=False)   # t.me/... link to launch
    developer    = Column(String(120), nullable=False)
    category_id  = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_featured  = Column(Boolean, default=False)
    is_verified  = Column(Boolean, default=False)
    installs     = Column(Integer, default=0)
    rating       = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    category  = relationship("Category", back_populates="apps")
    reviews   = relationship("Review", back_populates="app", cascade="all, delete-orphan")
    favorited = relationship("Favorite", back_populates="app", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id              = Column(Integer, primary_key=True)
    app_id          = Column(Integer, ForeignKey("apps.id"), nullable=False)
    telegram_user_id= Column(String(40), nullable=False)  # Telegram numeric user ID as string
    username        = Column(String(80))
    rating          = Column(Integer, nullable=False)      # 1–5
    body            = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("app_id", "telegram_user_id", name="uq_one_review_per_user"),
    )

    app = relationship("App", back_populates="reviews")


class Favorite(Base):
    __tablename__ = "favorites"

    id               = Column(Integer, primary_key=True)
    app_id           = Column(Integer, ForeignKey("apps.id"), nullable=False)
    telegram_user_id = Column(String(40), nullable=False)

    __table_args__ = (
        UniqueConstraint("app_id", "telegram_user_id", name="uq_one_fav_per_user"),
    )

    app = relationship("App", back_populates="favorited")


# ── Dependency ────────────────────────────────────────────────────────────────
async def get_db():
    """FastAPI dependency that yields a scoped async session."""
    async with AsyncSessionLocal() as session:
        yield session


# ── DDL helper ────────────────────────────────────────────────────────────────
async def create_tables():
    """Called once at startup to create missing tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
