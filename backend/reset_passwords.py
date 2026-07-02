import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def reset_passwords():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        for u in result.scalars():
            u.hashed_password = get_password_hash("admin123")
        await session.commit()
        print("All passwords reset to admin123")

if __name__ == "__main__":
    asyncio.run(reset_passwords())
