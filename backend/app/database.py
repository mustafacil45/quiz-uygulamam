import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Reliable path resolution:
# __file__ is backend/app/database.py
# parent is backend/app
# parent.parent is backend
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(BASE_DIR, 'dev.db')

# Default: SQLite for local development
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# Production: DATABASE_URL from environment (Supabase, Render, etc.)
# Supabase provides postgresql:// → convert to postgresql+asyncpg://
env_db = os.getenv("DATABASE_URL")
if env_db:
    # Supabase/Render give "postgresql://..." — need async driver prefix
    if env_db.startswith("postgres://"):
        env_db = env_db.replace("postgres://", "postgresql+asyncpg://", 1)
    elif env_db.startswith("postgresql://") and "+asyncpg" not in env_db:
        env_db = env_db.replace("postgresql://", "postgresql+asyncpg://", 1)
    DATABASE_URL = env_db

_is_production = "asyncpg" in DATABASE_URL
print(f"Database: {'PostgreSQL (production)' if _is_production else 'SQLite (development)'}")

# PostgreSQL needs pool settings for free-tier connection limits
_engine_kwargs = {"future": True, "echo": False}
if _is_production:
    _engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 2,
        "pool_pre_ping": True,       # otomatik bağlantı kontrolü
        "pool_recycle": 300,         # 5 dk sonra bağlantıyı yenile
    })

engine = create_async_engine(DATABASE_URL, **_engine_kwargs)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
