import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models import User, Quiz, Question, Room

async def run():
    async with AsyncSessionLocal() as session:
        u_count = await session.scalar(select(func.count()).select_from(User))
        q_count = await session.scalar(select(func.count()).select_from(Quiz))
        qs_count = await session.scalar(select(func.count()).select_from(Question))
        r_count = await session.scalar(select(func.count()).select_from(Room))
        print(f"Users: {u_count}, Quizzes: {q_count}, Questions: {qs_count}, Rooms: {r_count}")

if __name__ == "__main__":
    asyncio.run(run())
