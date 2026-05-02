"""
schemas.py — Pydantic v2 request and response models.

These are separate from the SQLAlchemy ORM models in database.py.
FastAPI uses these for:
  • Input validation  (request body / query params)
  • Output serialisation (response_model=)
  • Auto-generated OpenAPI docs
"""

from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, field_validator


# ── Category ──────────────────────────────────────────────────────────────────
class CategoryOut(BaseModel):
    id: int
    slug: str
    name: str
    icon: str
    position: int

    model_config = {"from_attributes": True}


# ── App ───────────────────────────────────────────────────────────────────────
class AppSummary(BaseModel):
    """Lightweight card shown in list / search results."""
    id: int
    name: str
    slug: str
    description: str
    icon_url: str
    telegram_url: str
    developer: str
    is_featured: bool
    is_verified: bool
    installs: int
    rating: float
    review_count: int
    category: CategoryOut

    model_config = {"from_attributes": True}


class AppDetail(AppSummary):
    """Full detail page — adds banner and timestamps."""
    banner_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AppCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    slug: str = Field(..., min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    description: str = Field(..., min_length=10)
    icon_url: str
    banner_url: str | None = None
    telegram_url: str
    developer: str = Field(..., min_length=2, max_length=120)
    category_id: int
    is_featured: bool = False


# ── Review ────────────────────────────────────────────────────────────────────
class ReviewOut(BaseModel):
    id: int
    app_id: int
    telegram_user_id: str
    username: str | None
    rating: int
    body: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    app_id: int
    telegram_user_id: str = Field(..., min_length=1, max_length=40)
    username: str | None = Field(None, max_length=80)
    rating: int = Field(..., ge=1, le=5)
    body: str | None = Field(None, max_length=2000)


# ── Favorite ──────────────────────────────────────────────────────────────────
class FavoriteToggle(BaseModel):
    app_id: int
    telegram_user_id: str


class FavoriteOut(BaseModel):
    app_id: int
    is_favorited: bool


# ── Generic responses ─────────────────────────────────────────────────────────
class PaginatedApps(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AppSummary]


class MessageResponse(BaseModel):
    message: str
