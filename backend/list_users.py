import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        for u in result.scalars():
            print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")

if __name__ == "__main__":
    asyncio.run(run())
