"""
seed.py — Populates the database with sample categories and apps.
Called once from main.py lifespan if the categories table is empty.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import Category, App


CATEGORIES = [
    {"slug": "games",   "name": "Games",      "icon": "🎮", "position": 0},
    {"slug": "tools",   "name": "Tools",      "icon": "🛠️", "position": 1},
    {"slug": "finance", "name": "Finance",    "icon": "💰", "position": 2},
    {"slug": "ai",      "name": "AI",         "icon": "🤖", "position": 3},
    {"slug": "social",  "name": "Social",     "icon": "💬", "position": 4},
    {"slug": "shopping","name": "Shopping",   "icon": "🛍️", "position": 5},
    {"slug": "news",    "name": "News",       "icon": "📰", "position": 6},
    {"slug": "health",  "name": "Health",     "icon": "❤️", "position": 7},
]

# icon_url uses placeholder service so no real assets needed
_ICON = "https://placehold.co/128x128/5B9BD5/FFFFFF?text={}"
_BANNER = "https://placehold.co/800x300/1E3A5F/FFFFFF?text={}"

APPS = [
    # Games
    dict(name="Hamster Kombat", slug="hamster-kombat", description="Tap to earn crypto coins while fighting hamsters in this viral Telegram clicker game.", icon_url=_ICON.format("HK"), banner_url=_BANNER.format("Hamster+Kombat"), telegram_url="https://t.me/hamster_kombat_bot", developer="HamsterLabs", category_slug="games", is_featured=True, is_verified=True, installs=12_000_000, rating=4.6, review_count=9823),
    dict(name="Blum", slug="blum", description="Play mini-games and complete tasks to earn BLUM tokens — a leading Telegram GameFi app.", icon_url=_ICON.format("BL"), banner_url=_BANNER.format("Blum"), telegram_url="https://t.me/BlumCryptoBot", developer="Blum Labs", category_slug="games", is_featured=True, is_verified=True, installs=8_500_000, rating=4.4, review_count=4321),
    dict(name="Paws", slug="paws", description="A tap-to-earn pet collecting game where each paw print earns you tokens.", icon_url=_ICON.format("PW"), telegram_url="https://t.me/PAWSOG_bot", developer="PawsTeam", category_slug="games", is_verified=True, installs=3_200_000, rating=4.1, review_count=1102),

    # Tools
    dict(name="Fragment", slug="fragment", description="Official TON-powered marketplace for Telegram usernames, numbers, and gifts.", icon_url=_ICON.format("FR"), banner_url=_BANNER.format("Fragment"), telegram_url="https://t.me/fragment", developer="Telegram", category_slug="tools", is_featured=True, is_verified=True, installs=5_000_000, rating=4.8, review_count=7654),
    dict(name="Wallet", slug="wallet", description="Send, receive, and store TON, BTC, and USDT directly inside Telegram.", icon_url=_ICON.format("WL"), telegram_url="https://t.me/wallet", developer="Telegram", category_slug="tools", is_verified=True, installs=10_000_000, rating=4.7, review_count=12_000),
    dict(name="TG Polls Pro", slug="tg-polls-pro", description="Advanced polling and survey bot with analytics dashboards and CSV export.", icon_url=_ICON.format("PP"), telegram_url="https://t.me/pollsprobot", developer="PollsTeam", category_slug="tools", installs=450_000, rating=4.2, review_count=530),

    # Finance
    dict(name="Bitget Wallet", slug="bitget-wallet", description="Multi-chain DeFi wallet supporting 100+ blockchains with built-in swap and NFT gallery.", icon_url=_ICON.format("BG"), banner_url=_BANNER.format("Bitget+Wallet"), telegram_url="https://t.me/BitgetWallet_TGBot", developer="Bitget", category_slug="finance", is_featured=True, is_verified=True, installs=2_300_000, rating=4.3, review_count=2100),
    dict(name="OKX Mini", slug="okx-mini", description="Trade spot, earn yield, and manage your OKX portfolio without leaving Telegram.", icon_url=_ICON.format("OK"), telegram_url="https://t.me/OKX_official_bot", developer="OKX", category_slug="finance", is_verified=True, installs=1_800_000, rating=4.5, review_count=3400),

    # AI
    dict(name="AskGPT", slug="askgpt", description="ChatGPT-powered assistant inside Telegram. Supports GPT-4o, image generation, and voice.", icon_url=_ICON.format("AG"), banner_url=_BANNER.format("AskGPT"), telegram_url="https://t.me/askgpt_bot", developer="AskGPT LLC", category_slug="ai", is_featured=True, is_verified=True, installs=6_000_000, rating=4.5, review_count=8900),
    dict(name="Midjourney Bot", slug="midjourney-bot", description="Generate stunning AI art via Midjourney's API — right inside your Telegram chats.", icon_url=_ICON.format("MJ"), telegram_url="https://t.me/midjourney_tg_bot", developer="Community", category_slug="ai", installs=900_000, rating=4.0, review_count=670),

    # Social
    dict(name="Confess Bot", slug="confess-bot", description="Send anonymous confessions to groups. Rate and react to others' confessions in real time.", icon_url=_ICON.format("CB"), telegram_url="https://t.me/confess_tgbot", developer="ConfessTeam", category_slug="social", installs=1_100_000, rating=3.9, review_count=430),

    # Shopping
    dict(name="TON Shop", slug="ton-shop", description="Browse and buy digital goods, gift cards, and subscriptions paid via TON crypto.", icon_url=_ICON.format("TS"), telegram_url="https://t.me/tonshopbot", developer="TON Foundation", category_slug="shopping", is_verified=True, installs=700_000, rating=4.3, review_count=890),

    # News
    dict(name="NewsFlash", slug="newsflash", description="Personalized AI news digest. Choose topics and get a daily briefing in Telegram.", icon_url=_ICON.format("NF"), telegram_url="https://t.me/newsflashbot", developer="FlashMedia", category_slug="news", installs=320_000, rating=4.1, review_count=210),

    # Health
    dict(name="WaterTracker", slug="water-tracker", description="Hydration reminder and tracker bot. Log your intake and hit your daily goals.", icon_url=_ICON.format("WT"), telegram_url="https://t.me/water_tracker_bot", developer="HealthApps", category_slug="health", installs=180_000, rating=4.4, review_count=340),
]


async def seed_database(db: AsyncSession) -> None:
    """Insert seed data only if categories table is empty."""
    result = await db.execute(select(Category).limit(1))
    if result.scalar_one_or_none() is not None:
        return  # Already seeded

    # Insert categories
    cat_map: dict[str, Category] = {}
    for c in CATEGORIES:
        cat = Category(**c)
        db.add(cat)
        cat_map[c["slug"]] = cat

    await db.flush()  # get category IDs before inserting apps

    # Insert apps
    for a in APPS:
        slug = a.pop("category_slug")
        app = App(**a, category_id=cat_map[slug].id)
        db.add(app)

    await db.commit()
    print("✅ Database seeded with categories and apps.")
