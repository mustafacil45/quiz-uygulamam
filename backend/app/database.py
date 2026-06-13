import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Reliable path resolution:
# __file__ is backend/app/database.py
# parent is backend/app
# parent.parent is backend
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(BASE_DIR, 'dev.db')

# Use SQLite with absolute path to prevent re-creation or location issues
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# Allow override from env if specifically provided (e.g. for production) usually
# but strictly default to the stable local file if missing.
env_db = os.getenv("DATABASE_URL")
if env_db and env_db.startswith("postgresql"):
    DATABASE_URL = env_db

print(f"Database URL: {DATABASE_URL}")

engine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
