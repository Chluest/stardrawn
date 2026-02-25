from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.room = defaultdict(list)
    async def connect(self, connection: WebSocket, id: str):
        await connection.accept()
        self.room[id].append(connection)

    def disconnect(self, connection: WebSocket, id: str):
        self.room[id].remove(connection)

    async def broadcast(self, msg: str, id: str):
        for connection in self.room[id]:
            await connection.send_text(msg)
        
        
