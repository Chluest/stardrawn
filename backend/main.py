from fastapi import Depends, FastAPI, HTTPException
from schemas import RoomCreate, RoomResponse
from database import engine, Base, get_db
from models import Room
import secrets

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "stardrawn backend is alive!"}

@app.post("/rooms", response_model = RoomResponse)
def create_room(room: RoomCreate, db = Depends(get_db)):
    room_id = secrets.token_urlsafe(8)
    new_room = Room(id = room_id, room_name = room.room_name)
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

