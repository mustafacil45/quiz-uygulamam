import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket
import redis.asyncio as redis
import os
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class ConnectionManager:
    def __init__(self):
        # active connections: room_id -> list of {ws, user_info}
        self.active: Dict[str, List[Dict[str, Any]]] = {}
        self.redis = None

    async def init_redis(self):
        if not self.redis:
            try:
                self.redis = await redis.from_url(REDIS_URL)
            except Exception:
                # If Redis is not available (e.g. running locally without Docker),
                # we will fall back to local memory broadcast only.
                print("Warning: Redis not available, using local memory only.")
                self.redis = None

    async def connect(self, websocket: WebSocket, room: str, user_info: dict = None):
        await websocket.accept()
        if room not in self.active:
            self.active[room] = []
        
        # user_info defaults to anonymous if not provided
        if not user_info:
            user_info = {"username": "Anonymous", "id": None}
            
        self.active[room].append({"ws": websocket, "user": user_info})

    async def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active:
            # find and remove the connection wrapper
            self.active[room] = [c for c in self.active[room] if c["ws"] != websocket]
            if not self.active[room]:
                del self.active[room]

    async def broadcast(self, room: str, message: str):
        # publish to redis channel if available
        await self.init_redis()
        
        # Only try to publish to Redis if connection exists
        if self.redis:
            try:
                channel = f"room:{room}"
                await self.redis.publish(channel, message)
            except Exception:
                pass
        
        # local broadcast
        if room in self.active:
            for conn in self.active[room]:
                try:
                    await conn["ws"].send_text(message)
                except Exception:
                    pass

    def get_participants(self, room: str):
        if room not in self.active:
            return []
        # Return unique users based on username or id to avoid duplicates if multiple tabs/sockets
        users = []
        seen = set()
        for conn in self.active[room]:
            u = conn["user"]
            uid = u.get("id") or u.get("username")
            if uid and uid not in seen:
                users.append(u)
                seen.add(uid)
        return users


manager = ConnectionManager()
