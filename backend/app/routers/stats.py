from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import models
from sqlalchemy import select, func, desc
from datetime import datetime
import time

router = APIRouter()

# Simple start time tracking
START_TIME = time.time()

@router.get("/")
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total Quizzes
    res_quiz = await db.execute(select(func.count(models.Quiz.id)))
    total_quizzes = res_quiz.scalar() or 0

    # Active Rooms
    res_room = await db.execute(select(func.count(models.Room.id)))
    active_rooms = res_room.scalar() or 0

    res_r = await db.execute(select(func.count(models.Room.id)))
    active_rooms = res_r.scalar() or 0
    
    # Total Users
    res_u = await db.execute(select(func.count(models.User.id)))
    total_users = res_u.scalar() or 0

    # Recent activities
    # Recent quizzes
    res_recent_q = await db.execute(select(models.Quiz).order_by(models.Quiz.created_at.desc()).limit(3))
    recent_quizzes = res_recent_q.scalars().all()
    
    # Recent rooms
    res_recent_r = await db.execute(select(models.Room).order_by(models.Room.created_at.desc()).limit(3))
    recent_rooms = res_recent_r.scalars().all()
    
    activities = []
    for q in recent_quizzes:
        activities.append({
            "type": "quiz",
            "message": f"Yeni quiz eklendi: {q.title}",
            "time": q.created_at.isoformat() if q.created_at else ""
        })
    for r in recent_rooms:
        activities.append({
            "type": "room",
            "message": f"Yeni oda oluşturuldu: {r.name}",
            "time": r.created_at.isoformat() if r.created_at else ""
        })
    
    # Sort mixed activities by time desc (simplification)
    activities.sort(key=lambda x: x["time"], reverse=True)

    uptime_seconds = int(time.time() - START_TIME)

    return {
        "total_quizzes": total_quizzes,
        "active_rooms": active_rooms,
        "system_status": "Online",
        "uptime": uptime_seconds,
        "recent_activities": activities[:5]
    }

