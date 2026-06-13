
import asyncio
from sqlalchemy import select
from app.database import get_db, AsyncSessionLocal
from app.models import User

async def check_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"- {u.username} (active={u.is_active})")

if __name__ == "__main__":
    asyncio.run(check_users())
