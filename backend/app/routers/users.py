from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.database import get_db
from app import models, schemas
from app.core import security
from app.core.security import get_current_user
import json
import secrets

router = APIRouter()

USERNAME_MIN, USERNAME_MAX = 3, 32
PASSWORD_MIN = 6

@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserUpdateOut)
async def update_users_me(payload: schemas.UserUpdate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    username_changed = False

    if payload.username is not None:
        new_username = payload.username.strip()
        if not (USERNAME_MIN <= len(new_username) <= USERNAME_MAX):
            raise HTTPException(status_code=422, detail=f"Kullanıcı adı {USERNAME_MIN}-{USERNAME_MAX} karakter olmalı")
        if new_username != current_user.username:
            res = await db.execute(select(models.User).where((models.User.username == new_username) & (models.User.id != current_user.id)))
            if res.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
            current_user.username = new_username
            username_changed = True

    if payload.email is not None and payload.email != current_user.email:
        res = await db.execute(select(models.User).where((models.User.email == payload.email) & (models.User.id != current_user.id)))
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
        current_user.email = payload.email

    if payload.avatar_url is not None:
        url = payload.avatar_url.strip()
        if url == "":
            current_user.avatar_url = None
        elif url.startswith("/static/uploads/") or url.startswith("http://") or url.startswith("https://"):
            current_user.avatar_url = url
        else:
            raise HTTPException(status_code=422, detail="Geçersiz fotoğraf adresi")

    await db.commit()
    await db.refresh(current_user)

    out = schemas.UserUpdateOut.model_validate(current_user)
    if username_changed:
        # Token "sub" = username; eski token artık bu kullanıcıyı bulamaz
        out.access_token = security.create_access_token({"sub": current_user.username})
        out.refresh_token = security.create_refresh_token({"sub": current_user.username})
    return out


@router.post("/me/password")
async def change_password(payload: schemas.PasswordChange, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    if len(payload.new_password) < PASSWORD_MIN:
        raise HTTPException(status_code=422, detail=f"Yeni şifre en az {PASSWORD_MIN} karakter olmalı")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=422, detail="Yeni şifre eskisiyle aynı olamaz")
    current_user.hashed_password = security.get_password_hash(payload.new_password)
    await db.commit()
    return {"status": "ok"}


@router.delete("/me", status_code=204)
async def delete_users_me(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Skorlar ve odalar başka kullanıcıların verisine bağlı olduğundan satır silinmez;
    # hesap anonimleştirilip kapatılır. Kapalı hesapla giriş yapılamaz (bkz. security).
    uid = current_user.id
    current_user.username = f"silinen_kullanici_{uid}"
    current_user.email = f"deleted_{uid}@deleted.local"
    current_user.avatar_url = None
    current_user.hashed_password = security.get_password_hash(secrets.token_urlsafe(32))
    current_user.is_active = False
    await db.commit()
    return None

@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    # Calculate total scores for each user based ONLY on global quizzes (room_id IS NULL)
    stmt = (
        select(models.User.id, models.User.username, models.User.avatar_url, func.sum(models.Result.score).label("total_score"))
        .join(models.Result, models.User.id == models.Result.user_id)
        .join(models.Quiz, models.Result.quiz_id == models.Quiz.id)
        .where(models.Quiz.room_id == None) # Global quizzes only
        .group_by(models.User.id, models.User.username, models.User.avatar_url)
        .order_by(desc("total_score"))
        .limit(50)
    )

    res = await db.execute(stmt)
    rows = res.all()

    leaderboard = []
    for i, (uid, uname, avatar, score) in enumerate(rows):
        leaderboard.append({
            "rank": i + 1,
            "user_id": uid,
            "username": uname,
            "avatar_url": avatar,
            "score": score
        })
        
    return leaderboard

@router.get("/me/stats")
async def read_user_stats(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Solved quizzes count
    res_solved = await db.execute(select(func.count(models.Result.id)).where(models.Result.user_id == current_user.id))
    solved_count = res_solved.scalar() or 0
    
    # Calculate Total Score vs Total Possible
    # Get all results for this user with their associated quiz (to know total questions)
    stmt = (
        select(models.Result, models.Quiz)
        .join(models.Quiz, models.Result.quiz_id == models.Quiz.id)
        .where(models.Result.user_id == current_user.id)
        .options(selectinload(models.Quiz.questions)) # need questions count
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    total_score = 0
    total_possible = 0
    
    for result, quiz in rows:
        total_score += result.score
        # Max score per question is 100
        q_count = len(quiz.questions) if quiz.questions else 0
        total_possible += (q_count * 100)
            
    # Joined rooms count (only approved)
    res_rooms = await db.execute(select(func.count(models.UserRoom.room_id)).where((models.UserRoom.user_id == current_user.id) & (models.UserRoom.status == 'approved')))
    joined_rooms_count = res_rooms.scalar() or 0
    
    return {
        "solved_quizzes": solved_count,
        "total_score": total_score,
        "total_possible_score": total_possible,
        "joined_rooms": joined_rooms_count
    }

@router.get("/me/rooms")
async def read_user_rooms(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get rooms joined by user
    stmt = (
        select(models.Room, models.UserRoom.status)
        .join(models.UserRoom, models.Room.id == models.UserRoom.room_id)
        .where(models.UserRoom.user_id == current_user.id)
        .options(selectinload(models.Room.quizzes))
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    # Simple schema mapping
    out = []
    for r, status in rows:
        out.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "is_private": r.is_private,
            "quizzes_count": len(r.quizzes) if r.quizzes else 0,
            "status": status # added status
        })
    return out

@router.get("/me/quizzes")
async def read_user_quizzes(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get solved quizzes details
    stmt = (
        select(models.Result, models.Quiz)
        .join(models.Quiz, models.Result.quiz_id == models.Quiz.id)
        .outerjoin(models.Room, models.Quiz.room_id == models.Room.id)
        .where(models.Result.user_id == current_user.id)
        .order_by(desc(models.Result.created_at))
        .options(selectinload(models.Quiz.questions), selectinload(models.Quiz.room))
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    out = []
    for result, quiz in rows: # Note: rows might be different structure due to outerjoin if selecting Room explicitly? 
        # Actually with ORM load, 'quiz.room' should be populated.
        # But `rows` from `res.all()` with `select(Result, Quiz)` will return (Result, Quiz).
        # `outerjoin` in query ensures we don't drop global quizzes.
        
        total = len(quiz.questions) if quiz.questions else 0
        room_name = quiz.room.name if quiz.room else "Genel" # "Global" or "Genel"
        
        out.append({
            "id": result.id,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "score": result.score,
            "total_questions": total,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "room_name": room_name
        })
    return out
