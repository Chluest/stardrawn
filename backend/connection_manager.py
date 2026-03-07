from fastapi import WebSocket
from collections import defaultdict
import redis.asyncio as aioredis
import os

class ConnectionManager:
    def __init__(self):
        self.room = defaultdict(list)
        self.subscriber_task = defaultdict(list)
        self.redis = aioredis.from_url(
            os.getenv("REDIS_URL"),
            encoding="utf-8",
            decode_responses=True,
            ssl_cert_reqs=None
        )
    async def connect(self, connection: WebSocket, id: str):
        await connection.accept()
        self.room[id].append(connection)

    def disconnect(self, connection: WebSocket, id: str):
        self.room[id].remove(connection)

    async def publish(self, msg: str, id: str):
        await self.redis.publish(f"room:{id}",msg)
    
    async def broadcast_local(self, msg: str, id: str):
        for connection in self.room[id]:
            await connection.send_text(msg)

    async def subscribe(self, id: str):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"room:{id}")
        return pubsub
        
        
