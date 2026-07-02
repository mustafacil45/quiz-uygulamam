import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Room

async def main():
    async with AsyncSessionLocal() as db:
        q = "ROOM1"
        stmt = select(Room).where((Room.name.ilike(f"%{q}%")) | (Room.code == q))
        res = await db.execute(stmt)
        rooms = res.scalars().all()
        print("ROOM1 matched:", [r.name for r in rooms])

        q = "room1"
        stmt = select(Room).where((Room.name.ilike(f"%{q}%")) | (Room.code == q))
        res = await db.execute(stmt)
        rooms = res.scalars().all()
        print("room1 matched:", [r.name for r in rooms])

if __name__ == "__main__":
    asyncio.run(main())
