import uuid
from database import Base
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String(255), primary_key=True, index=True)
    room_name = Column(String(255), index=True) 
    timestamp = Column(DateTime, default=datetime.utcnow)
    entries = relationship("Entry", back_populates="room")

    def to_dict(self):
        return {
            "id": self.id,
            "room_name": self.room_name
        }

class Entry(Base):
    __tablename__ = "entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(String(255), ForeignKey("rooms.id"), index=True)
    added_by = Column(String(255))
    value = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    room = relationship("Room", back_populates="entries")

    def to_dict(self):
        return {
            "id": str(self.id),
            "value": self.value,
            "added_by": self.added_by,
            "room_id": self.room_id
        }
