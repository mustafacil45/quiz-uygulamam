from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import models
from app.ws_manager import manager
from sqlalchemy import select

router = APIRouter()


@router.post("/create")
async def create_duel(room_id: int, quiz_id: int, db: AsyncSession = Depends(get_db)):
    duel = models.Duel(room_id=room_id, quiz_id=quiz_id)
    db.add(duel)
    await db.commit()
    await db.refresh(duel)
    return duel


@router.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    username = websocket.query_params.get("username", "Guest")
    user_id = websocket.query_params.get("user_id")
    user_info = {"username": username, "id": user_id}
    
    await manager.connect(websocket, room_name, user_info)
    try:
        while True:
            data = await websocket.receive_text()
            # broadcast to room
            await manager.broadcast(room_name, data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_name)
