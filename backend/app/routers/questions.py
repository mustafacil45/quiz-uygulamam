from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import models, schemas
from sqlalchemy import select
import json

router = APIRouter()


@router.get("/quiz/{quiz_id}")
async def list_questions(quiz_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.Question).where(models.Question.quiz_id == quiz_id))
    qs = res.scalars().all()
    out = []
    for q in qs:
        out.append({"id": q.id, "text": q.text, "choices": json.loads(q.choices) if q.choices else []})
    return out
