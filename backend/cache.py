"""
cache.py — Redis client wrapper using the async redis-py driver.

Strategy:
  • App list / categories: cached for 5 minutes (300 s)
  • Single app detail: cached for 10 minutes (600 s)
  • Review lists: cached for 2 minutes (120 s)
  • Favorites: NOT cached — must always be fresh per user

Cache keys follow the pattern:  tgstore:<resource>:<identifier>
Invalidation is done explicitly after write operations.
"""

import json
import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()

# One shared connection pool for the whole process
_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def cache_get(key: str) -> dict | list | None:
    r = await get_redis()
    raw = await r.get(key)
    return json.loads(raw) if raw else None


async def cache_set(key: str, value: dict | list, ttl: int = 300) -> None:
    r = await get_redis()
    await r.set(key, json.dumps(value, default=str), ex=ttl)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern (e.g. 'tgstore:apps:*')."""
    r = await get_redis()
    keys = await r.keys(pattern)
    if keys:
        await r.delete(*keys)


# ── Named key builders (avoids typos across routers) ─────────────────────────
def key_app_list(category: str = "all", search: str = "") -> str:
    return f"tgstore:apps:list:{category}:{search}"

def key_app_detail(app_id: int) -> str:
    return f"tgstore:apps:{app_id}"

def key_categories() -> str:
    return "tgstore:categories"

def key_reviews(app_id: int) -> str:
    return f"tgstore:reviews:{app_id}"

def key_featured() -> str:
    return "tgstore:apps:featured"
