"""
routers/reviews.py — Read and post reviews.

After a review is posted, the app's rating and review_count are
recalculated from the average and the cache for that app is busted.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db, Review, App
from schemas import ReviewOut, ReviewCreate
from cache import cache_get, cache_set, cache_delete, key_reviews, key_app_detail

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/{app_id}", response_model=list[ReviewOut])
async def get_reviews(app_id: int, db: AsyncSession = Depends(get_db)):
    cached = await cache_get(key_reviews(app_id))
    if cached:
        return cached

    stmt = (
        select(Review)
        .where(Review.app_id == app_id)
        .order_by(Review.created_at.desc())
        .limit(50)
    )
    reviews = (await db.execute(stmt)).scalars().all()
    result = [
        {
            "id": r.id, "app_id": r.app_id,
            "telegram_user_id": r.telegram_user_id,
            "username": r.username, "rating": r.rating,
            "body": r.body, "created_at": str(r.created_at),
        }
        for r in reviews
    ]
    await cache_set(key_reviews(app_id), result, ttl=120)
    return result


@router.post("", response_model=ReviewOut, status_code=201)
async def post_review(payload: ReviewCreate, db: AsyncSession = Depends(get_db)):
    # Check app exists
    app = (await db.execute(select(App).where(App.id == payload.app_id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    # Prevent duplicate reviews
    existing = (
        await db.execute(
            select(Review).where(
                Review.app_id == payload.app_id,
                Review.telegram_user_id == payload.telegram_user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this app")

    review = Review(**payload.model_dump())
    db.add(review)
    await db.flush()

    # Recalculate app rating and count
    agg = (
        await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.app_id == payload.app_id)
        )
    ).one()
    app.rating = round(float(agg[0] or 0), 2)
    app.review_count = agg[1]

    await db.commit()
    await db.refresh(review)

    # Invalidate caches
    await cache_delete(key_reviews(payload.app_id))
    await cache_delete(key_app_detail(payload.app_id))

    return review
