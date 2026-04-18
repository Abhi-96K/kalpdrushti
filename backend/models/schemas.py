from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from models.database import Base

# --- SQLAlchemy Models ---

class VideoRequestDB(Base):
    __tablename__ = "video_requests"

    id = Column(String, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    status = Column(String, default="pending") # pending, generating_script, generating_images, generating_audio, rendering_video, completed, failed, aborted
    video_url = Column(String, nullable=True)
    uploaded_file_path = Column(String, nullable=True)
    series_name = Column(String, nullable=True, index=True)
    script_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)

# --- Pydantic Schemas ---

class VideoGenerateRequest(BaseModel):
    prompt: str

class VideoStatusResponse(BaseModel):
    id: str
    status: str
    prompt: str
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

class Scene(BaseModel):
    setting: str
    characters: str
    action: str
    narration: str

class VideoScript(BaseModel):
    scenes: List[Scene]
