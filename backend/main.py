from dotenv import load_dotenv
load_dotenv() 

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from schemas import RoomCreate, RoomResponse
from database import engine, Base, get_db, SessionLocal
from models import Room, Entry
from connection_manager import ConnectionManager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
import secrets
import json
import os
import asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "stardrawn backend is alive!"}

@app.post("/rooms", response_model = RoomResponse)
def create_room(room: RoomCreate | None = None, db = Depends(get_db)):
    room_id = secrets.token_urlsafe(8)
    room_name = room.room_name if room else None
    new_room = Room(id = room_id, room_name = room_name)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.get("/rooms/{room_id}", response_model = RoomResponse)
def get_room(room_id: str, db = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code = 404, detail = "Room not found.")
    return room

async def redis_subscriber(id):
    pubsub = await manager.subscribe(id)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await manager.broadcast_local(message["data"], id)
    finally:
        await pubsub.unsubscribe(f"room:{id}")
def handle_disconnect(websocket, room_id):
    manager.disconnect(websocket, room_id)
    if len(manager.room[room_id]) == 0:
        if room_id in manager.subscriber_task:
            manager.subscriber_task[room_id].cancel()
            del manager.subscriber_task[room_id]

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    error_count = 0
    max_errors = 5
    db = SessionLocal()
    await manager.connect(websocket,room_id)
    if len(manager.room[room_id]) == 1:
            if room_id not in manager.subscriber_task or manager.subscriber_task[room_id].done():
                task = asyncio.create_task(redis_subscriber(room_id))
                manager.subscriber_task[room_id] = task
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                action = data["type"]
                if action == "add_entry":
                    entry = Entry(room_id = room_id, added_by = data["added_by"], value = data["value"])
                    db.add(entry)
                    db.commit()
                    db.refresh(entry)
                    await manager.publish(json.dumps({"type": action, "entry": entry.to_dict()}),room_id)
                    error_count = 0
                elif action == "delete_entry":
                    entry = db.query(Entry).filter(Entry.id == data["entry_id"]).first()
                    if not entry:
                        await websocket.send_text(json.dumps({"error": "No entries found."}))
                        continue
                    db.delete(entry)
                    db.commit()
                    await manager.publish(json.dumps({"type": action, "entry_id": data["entry_id"]}), room_id)
                    error_count = 0
                else:
                    entry = db.query(Entry).filter(Entry.room_id == room_id).order_by(func.random()).first()
                    if not entry:
                        await websocket.send_text(json.dumps({"error": "No entries found."}))
                        continue
                    await manager.publish(json.dumps({"type": action, "entry": entry.to_dict()}),room_id)
                    error_count = 0
            except Exception as e:
                error_count +=1
                await websocket.send_text(json.dumps({"error":str(e )}))
                if error_count > max_errors:
                    await websocket.close()
                    handle_disconnect(websocket, room_id)
                    break
                continue
    except WebSocketDisconnect:
        handle_disconnect(websocket, room_id)
    finally:
        db.close()