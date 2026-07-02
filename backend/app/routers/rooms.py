from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import models, schemas
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.security import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.RoomOut)
async def create_room(payload: schemas.RoomCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # diagnostics logging
    try:
        print('[DEBUG] POST /api/rooms/ payload:', payload.dict())
    except Exception:
        print('[DEBUG] POST /api/rooms/ payload: <unserializable>')
    # validate
    if not payload.name or payload.name.strip() == '':
        print('WARNING: create_room: missing name in payload')
        raise HTTPException(status_code=422, detail='name is required')
    # generate unique code
    import random
    import string
    # Generate a unique 4-digit code
    code = None
    for _ in range(20):
        temp_code = ''.join(random.choices(string.digits, k=4))
        res = await db.execute(select(models.Room).where(models.Room.code == temp_code))
        if not res.scalar_one_or_none():
            code = temp_code
            break
            
    if not code:
        # Fallback if 10000 rooms are exhausted or extremely unlucky
        code = ''.join(random.choices(string.digits, k=6))

    room = models.Room(name=payload.name, host_id=current_user.id, is_private=payload.is_private, code=code)
    db.add(room)
    await db.flush()

    host_membership = models.UserRoom(
        user_id=current_user.id,
        room_id=room.id,
        status="approved",
        can_create_quiz=True,
    )
    db.add(host_membership)
    await db.commit()
    await db.refresh(room)
    # Return a response that matches RoomOut; otherwise FastAPI raises a 500
    # response validation error after the room is created.
    return {
        "id": room.id,
        "name": room.name,
        "host_id": room.host_id,
        "is_private": room.is_private,
        "participant_count": 1,
        "quizzes": [],
        "code": room.code,
    }



@router.post("/{room_id}/join")
async def join_room(room_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if room exists
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    # Check if already joined
    res_ur = await db.execute(select(models.UserRoom).where((models.UserRoom.user_id == current_user.id) & (models.UserRoom.room_id == room_id)))
    existing = res_ur.scalar_one_or_none()
    if existing:
        if existing.status == 'approved':
            return {"status": "already_joined"}
        elif existing.status == 'pending':
             return {"status": "pending"}
        # If rejected, they can request again? Let's say yes for now or just return pending.
        # Ideally if rejected, maybe they can't join? Or they re-request.
        # Let's set status to pending again if it was rejected?
        if existing.status == 'rejected':
             existing.status = 'pending'
             await db.commit()
             return {"status": "pending"}
        return {"status": "already_joined"}

    # Join with pending status
    ur = models.UserRoom(user_id=current_user.id, room_id=room_id, status="pending")
    db.add(ur)
    await db.commit()
    return {"status": "pending"}



@router.get("/", response_model=list[schemas.RoomOut])
async def list_rooms(q: str = None, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(models.Room).options(selectinload(models.Room.quizzes).selectinload(models.Quiz.questions)).options(selectinload(models.Room.members))
        
        if q:
            q_clean = q.strip()
            # Search by name (partial) or code (partial)
            stmt = stmt.where((models.Room.name.ilike(f"%{q_clean}%")) | (models.Room.code.ilike(f"%{q_clean}%")))
            
        res = await db.execute(stmt)
        rooms = res.scalars().all()
        import json as _json
        out = []
        for r in rooms:
            quizzes = []
            for q in getattr(r, 'quizzes', []) or []:
                # Safety check for choices
                choices_data = []
                if q.questions:
                    for qq in q.questions:
                        try:
                            # Handle potential None or invalid JSON in choices
                            c_list = _json.loads(qq.choices) if qq.choices else []
                            choices_data.append({
                                "id": qq.id, 
                                "text": qq.text, 
                                "choices": c_list, 
                                "correct_choice": qq.correct_choice
                            })
                        except Exception as e:
                            print(f"Error parsing choices for question {qq.id}: {e}")
                            choices_data.append({
                                "id": qq.id, 
                                "text": qq.text, 
                                "choices": [], 
                                "correct_choice": qq.correct_choice
                            })
                
                quizzes.append({
                    "id": q.id,
                    "title": q.title,
                    "description": q.description,
                    "room_id": q.room_id,
                    "questions": choices_data,
                    "is_featured": q.is_featured,
                    "is_retakeable": q.is_retakeable,
                    "scoring_mode": q.scoring_mode
                })
            
            # Count participants
            p_count = len(r.members) if r.members else 0
            
            out.append({
                "id": r.id, 
                "name": r.name, 
                "host_id": r.host_id, 
                "id": r.id, 
                "name": r.name, 
                "host_id": r.host_id, 
                "is_private": r.is_private, 
                "participant_count": p_count,
                "quizzes": quizzes,
                "code": r.code
            })
        return out
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


from app.ws_manager import manager

@router.delete("/{room_id}", status_code=204)
async def delete_room(room_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the room owner can delete this room")

    memberships = await db.execute(select(models.UserRoom).where(models.UserRoom.room_id == room_id))
    for membership in memberships.scalars().all():
        await db.delete(membership)

    await db.delete(room)
    await db.commit()
    return


@router.delete("/{room_id}/participants/{user_id}")
async def remove_room_participant(
    room_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Room owner can remove (kick) a user from the room by deleting their UserRoom membership.
    """
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the room owner can remove participants")
    if user_id == room.host_id:
        raise HTTPException(status_code=400, detail="Room owner cannot be removed")

    res_ur = await db.execute(
        select(models.UserRoom).where((models.UserRoom.room_id == room_id) & (models.UserRoom.user_id == user_id))
    )
    ur = res_ur.scalar_one_or_none()
    if not ur:
        raise HTTPException(status_code=404, detail="User not found in room")

    await db.delete(ur)
    await db.commit()

    # Best-effort notify room clients (if using websocket UI).
    try:
        import json

        await manager.broadcast(str(room_id), json.dumps({"type": "participant_removed", "room_id": room_id, "user_id": user_id}))
    except Exception:
        pass

    return {"status": "removed"}


@router.get("/{room_id}/participants")
async def get_room_participants(room_id: int, db: AsyncSession = Depends(get_db)):
    # Retrieve participants from DB (UserRoom table)
    # This shows everyone who has joined, not just currently online users.
    # FILTER BY STATUS = 'approved'
    # FILTER BY STATUS = 'approved'
    # Return permissions too
    stmt = select(models.User, models.UserRoom.can_create_quiz).join(models.UserRoom, models.User.id == models.UserRoom.user_id).where((models.UserRoom.room_id == room_id) & (models.UserRoom.status == 'approved'))

    res = await db.execute(stmt)
    rows = res.all()
    # Need to adjust frontend to expect this or keep it backward compatible?
    # Let's add permission info field
    return [{"id": u.id, "username": u.username, "can_create_quiz": can_create} for u, can_create in rows]


# --- Request Management ---

from pydantic import BaseModel

class RequestAction(BaseModel):
    user_id: int
    action: str # "approve" or "reject"

@router.get("/{room_id}/requests", response_model=list[schemas.UserOut]) # We need a schema for this, or just return users
async def get_room_requests(room_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if host
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get pending users
    stmt = select(models.User).join(models.UserRoom, models.User.id == models.UserRoom.user_id).where((models.UserRoom.room_id == room_id) & (models.UserRoom.status == 'pending'))
    res = await db.execute(stmt)
    users = res.scalars().all()
    return users 

@router.post("/{room_id}/requests")
async def respond_to_request(room_id: int, payload: RequestAction, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if host
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Find request
    stmt = select(models.UserRoom).where((models.UserRoom.room_id == room_id) & (models.UserRoom.user_id == payload.user_id))
    res = await db.execute(stmt)
    ur = res.scalar_one_or_none()
    
    if not ur:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if payload.action == 'approve':
        ur.status = 'approved'
    elif payload.action == 'reject':
        await db.delete(ur) # Or set to rejected
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    await db.commit()
    return {"status": "ok"}


# --- Permissions & Leaderboard ---

class PermissionUpdate(BaseModel):
    user_id: int
    can_create_quiz: bool

@router.post("/{room_id}/permissions")
async def update_permissions(room_id: int, payload: PermissionUpdate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check host
    res = await db.execute(select(models.Room).where(models.Room.id == room_id))
    room = res.scalar_one_or_none()
    if not room or room.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    res_ur = await db.execute(select(models.UserRoom).where((models.UserRoom.room_id == room_id) & (models.UserRoom.user_id == payload.user_id)))
    ur = res_ur.scalar_one_or_none()
    if not ur:
        raise HTTPException(status_code=404, detail="User not found in room")
        
    ur.can_create_quiz = payload.can_create_quiz
    await db.commit()
    return {"status": "updated"}

from sqlalchemy import func, desc

@router.get("/{room_id}/leaderboard")
async def get_room_leaderboard(room_id: int, db: AsyncSession = Depends(get_db)):
    # Sum scores for quizzes belonging to this room
    stmt = (
        select(models.User.id, models.User.username, func.sum(models.Result.score).label("total_score"))
        .join(models.Result, models.User.id == models.Result.user_id)
        .join(models.Quiz, models.Result.quiz_id == models.Quiz.id)
        .where(models.Quiz.room_id == room_id)
        .group_by(models.User.id, models.User.username)
        .order_by(desc("total_score"))
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    return [{"rank": i+1, "user_id": uid, "username": uname, "score": score} for i, (uid, uname, score) in enumerate(rows)]
