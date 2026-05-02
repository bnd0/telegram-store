"""
routers/categories.py — Category listing.

Cached heavily (5 min) since categories rarely change.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db, Category
from schemas import CategoryOut
from cache import cache_get, cache_set, key_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    cached = await cache_get(key_categories())
    if cached:
        return cached

    cats = (await db.execute(select(Category).order_by(Category.position))).scalars().all()
    result = [{"id": c.id, "slug": c.slug, "name": c.name, "icon": c.icon, "position": c.position} for c in cats]
    await cache_set(key_categories(), result, ttl=300)
    return result
