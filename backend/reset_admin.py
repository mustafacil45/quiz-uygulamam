import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from app.core.security import get_password_hash

async def reset_admin():
    async with AsyncSessionLocal() as session:
        user = await session.get(User, 1)
        if user:
            user.hashed_password = get_password_hash("admin123")
            await session.commit()
            print(f"Password reset for User ID 1: {user.username}")
        else:
            print("User ID 1 not found!")

if __name__ == "__main__":
    asyncio.run(reset_admin())
