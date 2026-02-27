from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RoomCreate(BaseModel):
    room_name: str | None = None

class EntryCreate(BaseModel):
    room_id: str
    added_by: str | None = None
    value: str

class EntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    room_id: str
    added_by: str
    value: str
    timestamp: datetime

class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    room_name: str | None = None
    timestamp: datetime
    entries: list[EntryResponse] = []