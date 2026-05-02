"""
routers/apps.py — CRUD for mini-apps.

Public endpoints (no auth):
  GET  /apps                list + filter + paginate
  GET  /apps/featured       featured apps (home banner)
  GET  /apps/{id}           single app detail
  POST /apps/{id}/launch    increment install counter

Admin endpoints (require X-Admin-Key header):
  POST   /apps              create a new app
  PATCH  /apps/{id}         edit any field of an existing app
  DELETE /apps/{id}         remove an app permanently

Cache strategy:
  Reads  → check Redis first; on miss hit Postgres and back-fill
  Writes → invalidate relevant cache keys
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database import get_db, App, Category
from schemas import AppSummary, AppDetail, AppCreate, AppUpdate, PaginatedApps, MessageResponse
from cache import (
    cache_get, cache_set, cache_delete, cache_delete_pattern,
    key_app_list, key_app_detail, key_featured,
)
from admin_auth import require_admin

router = APIRouter(prefix="/apps", tags=["apps"])


# ── Helper ────────────────────────────────────────────────────────────────────
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


async def _bust_caches(app_id: int | None = None):
    await cache_delete_pattern("tgstore:apps:list:*")
    await cache_delete(key_featured())
    if app_id:
        await cache_delete(key_app_detail(app_id))


# ── Public routes ─────────────────────────────────────────────────────────────
@router.get("", response_model=PaginatedApps)
async def list_apps(
    category:  str = Query("all", description="Category slug or 'all'"),
    search:    str = Query("",    description="Full-text search term"),
    page:      int = Query(1,     ge=1),
    page_size: int = Query(20,    ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    cache_key = key_app_list(category, search) + f":{page}:{page_size}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = select(App).options(selectinload(App.category))

    if category != "all":
        stmt = stmt.join(Category).where(Category.slug == category)

    if search:
        term = f"%{search.lower()}%"
        stmt = stmt.where(
            App.name.ilike(term) | App.description.ilike(term) | App.developer.ilike(term)
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(App.is_featured.desc(), App.installs.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    apps = (await db.execute(stmt)).scalars().all()

    result = {
        "total": total, "page": page, "page_size": page_size,
        "items": [_app_to_dict(a) for a in apps],
    }
    await cache_set(cache_key, result, ttl=300)
    return result


@router.get("/featured", response_model=list[AppSummary])
async def get_featured(db: AsyncSession = Depends(get_db)):
    cached = await cache_get(key_featured())
    if cached:
        return cached

    stmt = (
        select(App).options(selectinload(App.category))
        .where(App.is_featured == True)
        .order_by(App.installs.desc()).limit(6)
    )
    apps = (await db.execute(stmt)).scalars().all()
    result = [_app_to_dict(a) for a in apps]
    await cache_set(key_featured(), result, ttl=600)
    return result


@router.get("/{app_id}", response_model=AppDetail)
async def get_app(app_id: int, db: AsyncSession = Depends(get_db)):
    cached = await cache_get(key_app_detail(app_id))
    if cached:
        return cached

    stmt = select(App).options(selectinload(App.category)).where(App.id == app_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    result = _app_to_dict(app)
    await cache_set(key_app_detail(app_id), result, ttl=600)
    return result


@router.post("/{app_id}/launch", status_code=200)
async def record_launch(app_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(App).where(App.id == app_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    app.installs += 1
    await db.commit()
    await cache_delete(key_app_detail(app_id))
    await cache_delete_pattern("tgstore:apps:list:*")
    return {"installs": app.installs}


# ── Admin routes (X-Admin-Key required) ───────────────────────────────────────
@router.post("", response_model=AppDetail, status_code=201,
             dependencies=[Depends(require_admin)])
async def create_app(payload: AppCreate, db: AsyncSession = Depends(get_db)):
    cat = (await db.execute(select(Category).where(Category.id == payload.category_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    app = App(**payload.model_dump())
    db.add(app)
    await db.commit()

    stmt = select(App).options(selectinload(App.category)).where(App.id == app.id)
    app = (await db.execute(stmt)).scalar_one()
    await _bust_caches()
    return _app_to_dict(app)


@router.patch("/{app_id}", response_model=AppDetail,
              dependencies=[Depends(require_admin)])
async def update_app(app_id: int, payload: AppUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(App).options(selectinload(App.category)).where(App.id == app_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    # If category is being changed, verify it exists
    if payload.category_id is not None:
        cat = (await db.execute(select(Category).where(Category.id == payload.category_id))).scalar_one_or_none()
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid category_id")

    # Apply only the fields that were actually sent
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(app, field, value)

    await db.commit()

    # Re-fetch with category joined
    stmt = select(App).options(selectinload(App.category)).where(App.id == app_id)
    app = (await db.execute(stmt)).scalar_one()
    await _bust_caches(app_id)
    return _app_to_dict(app)


@router.delete("/{app_id}", response_model=MessageResponse,
               dependencies=[Depends(require_admin)])
async def delete_app(app_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(App).where(App.id == app_id)
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    await db.delete(app)
    await db.commit()
    await _bust_caches(app_id)
    return {"message": f"App {app_id} deleted successfully."}
