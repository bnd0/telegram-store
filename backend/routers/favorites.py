"""
routers/favorites.py — Toggle and list favorites per Telegram user.

Favorites are NOT cached — they must always be fresh.
The telegram_user_id comes from the client (validated by Telegram init data
in a real production app; here we trust the client for simplicity).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from database import get_db, Favorite, App
from schemas import AppSummary, FavoriteToggle, FavoriteOut
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/favorites", tags=["favorites"])


def _app_to_dict(app: App) -> dict:
    return {
        "id": app.id, "name": app.name, "slug": app.slug,
        "description": app.description, "icon_url": app.icon_url,
        "banner_url": app.banner_url, "telegram_url": app.telegram_url,
        "developer": app.developer, "is_featured": app.is_featured,
        "is_verified": app.is_verified, "installs": app.installs,
        "rating": app.rating, "review_count": app.review_count,
        "created_at": str(app.created_at),
        "category": {
            "id": app.category.id, "slug": app.category.slug,
            "name": app.category.name, "icon": app.category.icon,
            "position": app.category.position,
        },
    }


@router.get("", response_model=list[AppSummary])
async def get_favorites(
    telegram_user_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(App)
        .join(Favorite, Favorite.app_id == App.id)
        .options(selectinload(App.category))
        .where(Favorite.telegram_user_id == telegram_user_id)
        .order_by(App.name)
    )
    apps = (await db.execute(stmt)).scalars().all()
    return [_app_to_dict(a) for a in apps]


@router.post("/toggle", response_model=FavoriteOut)
async def toggle_favorite(payload: FavoriteToggle, db: AsyncSession = Depends(get_db)):
    # Verify app exists
    app = (await db.execute(select(App).where(App.id == payload.app_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    existing = (
        await db.execute(
            select(Favorite).where(
                Favorite.app_id == payload.app_id,
                Favorite.telegram_user_id == payload.telegram_user_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        await db.execute(
            delete(Favorite).where(Favorite.id == existing.id)
        )
        await db.commit()
        return {"app_id": payload.app_id, "is_favorited": False}
    else:
        fav = Favorite(app_id=payload.app_id, telegram_user_id=payload.telegram_user_id)
        db.add(fav)
        await db.commit()
        return {"app_id": payload.app_id, "is_favorited": True}
