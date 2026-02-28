from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from schemas import RoomCreate, RoomResponse
from database import engine, Base, get_db, SessionLocal
from models import Room, Entry
from connection_manager import ConnectionManager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
import secrets
import json

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    error_count = 0
    max_errors = 5
    db = SessionLocal()
    await manager.connect(websocket,room_id)
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
                    await manager.broadcast(json.dumps({"type": action, "entry": entry.to_dict()}),room_id)
                    error_count = 0
                elif action == "delete_entry":
                    entry = db.query(Entry).filter(Entry.id == data["entry_id"]).first()
                    if not entry:
                        await websocket.send_text(json.dumps({"error": "No entries found."}))
                        continue
                    db.delete(entry)
                    db.commit()
                    await manager.broadcast(json.dumps({"type": action, "entry_id": data["entry_id"]}), room_id)
                    error_count = 0
                else:
                    entry = db.query(Entry).filter(Entry.room_id == room_id).order_by(func.random()).first()
                    if not entry:
                        await websocket.send_text(json.dumps({"error": "No entries found."}))
                        continue
                    await manager.broadcast(json.dumps({"type": action, "entry": entry.to_dict()}),room_id)
                    error_count = 0
            except Exception as e:
                error_count +=1
                await websocket.send_text(json.dumps({"error":str(e )}))
                if error_count > max_errors:
                    manager.disconnect(websocket, room_id)
                    await websocket.close()
                    break
                continue
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    finally:
        db.close()