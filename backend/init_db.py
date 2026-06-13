import asyncio
import os

from app.models import Base
from app.database import engine


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


if __name__ == "__main__":
    # Load env vars if .env present
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except Exception:
        pass

    print("Initializing database schema...")
    asyncio.run(init_db())
    print("Done.")
