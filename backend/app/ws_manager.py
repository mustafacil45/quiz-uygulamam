import asyncio
import logging
from typing import Dict, List, Any
from fastapi import WebSocket
import redis.asyncio as redis
import os
import json

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class ConnectionManager:
    def __init__(self):
        # active connections: room_id -> list of {ws, user_info}
        self.active: Dict[str, List[Dict[str, Any]]] = {}
        self.redis = None
        self._redis_available = True  # assume available until proven otherwise
        self._redis_retry_after = 0   # timestamp after which retry is allowed

    async def init_redis(self):
        """Lazy Redis connection with graceful fallback."""
        if self.redis is not None:
            return  # already connected

        # Don't retry too frequently if Redis is down
        import time
        now = time.time()
        if not self._redis_available and now < self._redis_retry_after:
            return

        try:
            self.redis = await redis.from_url(
                REDIS_URL,
                socket_connect_timeout=3,
                socket_timeout=3,
                retry_on_timeout=False,
            )
            # Verify connection is actually alive
            await self.redis.ping()
            self._redis_available = True
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis not available ({e}), using local memory only")
            self.redis = None
            self._redis_available = False
            self._redis_retry_after = now + 60  # retry after 60 seconds

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
        # Try Redis publish (non-blocking, non-critical)
        await self.init_redis()
        
        if self.redis:
            try:
                channel = f"room:{room}"
                await self.redis.publish(channel, message)
            except Exception as e:
                # Redis went down mid-operation — reset for reconnect
                logger.warning(f"Redis publish failed ({e}), falling back to local")
                try:
                    await self.redis.close()
                except Exception:
                    pass
                self.redis = None
                self._redis_available = False
                import time
                self._redis_retry_after = time.time() + 60
        
        # Local broadcast always runs (even if Redis fails)
        if room in self.active:
            dead_connections = []
            for conn in self.active[room]:
                try:
                    await conn["ws"].send_text(message)
                except Exception:
                    dead_connections.append(conn)
            # Clean up dead connections
            for dead in dead_connections:
                self.active[room].remove(dead)
            if not self.active[room]:
                del self.active[room]

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

