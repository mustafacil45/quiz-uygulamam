from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import models
from sqlalchemy import select, desc, func

router = APIRouter()


@router.get("/")
async def leaderboard(limit: int = 20, db: AsyncSession = Depends(get_db)):
    # Group by user_id and sum scores for quizzes on the homepage (room_id IS NULL)
    stmt = (
        select(
            models.User.username,
            func.sum(models.Result.score).label("total_score")
        )
        .join(models.Result, models.User.id == models.Result.user_id)
        .join(models.Quiz, models.Result.quiz_id == models.Quiz.id)
        .where(models.Quiz.room_id == None)
        .group_by(models.User.id, models.User.username)
        .order_by(desc("total_score"))
        .limit(limit)
    )
    
    res = await db.execute(stmt)
    rows = res.all()
    
    return [{"username": row.username, "score": row.total_score} for row in rows]
