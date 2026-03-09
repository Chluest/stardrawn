from fastapi import WebSocket
from collections import defaultdict
import redis.asyncio as aioredis
import redis
import os

class ConnectionManager:
    def __init__(self):
        self.room = defaultdict(list)
        self.subscriber_task = {}
        self.redis = aioredis.from_url(
            os.getenv("REDIS_URL"),
            encoding="utf-8",
            decode_responses=True,
            ssl_cert_reqs=None
        )

        self.redis_sync = redis.from_url(
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

    def get_cache(self,room_key: str):
        return self.redis_sync.get(room_key)

    def set_cache(self, room_key:str, room_data: str):
        expiration = 3600
        self.redis_sync.set(room_key,room_data,ex = expiration)

    def delete_cache(self, room_key:str):
        self.redis_sync.delete(room_key)
        
        
