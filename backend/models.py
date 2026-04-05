from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    histories = relationship("History", back_populates="owner")

class History(Base):
    __tablename__ = "histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    severity = Column(String)
    confidence = Column(Float)
    image_path = Column(String) # Will store the URL/Path to the saved image

    owner = relationship("User", back_populates="histories")
