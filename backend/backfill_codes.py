
import asyncio
import random
import string
from app.database import AsyncSessionLocal
from app import models
from sqlalchemy import select

def generate_code():
    return ''.join(random.choices(string.digits, k=4))

async def backfill():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(models.Room))
        rooms = res.scalars().all()
        for room in rooms:
            if not room.code:
                room.code = generate_code()
                print(f"Assigning code {room.code} to room {room.id}")
        await db.commit()

if __name__ == "__main__":
    asyncio.run(backfill())
