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

class PaymentSessionDB(Base):
    __tablename__ = "payment_sessions"

    id = Column(String, primary_key=True, index=True)
    stripe_session_id = Column(String, unique=True, index=True, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, index=True, nullable=True)
    plan = Column(String, nullable=False)
    status = Column(String, default="created", index=True)
    customer_email = Column(String, nullable=True, index=True)
    amount_total = Column(Integer, nullable=True)
    currency = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

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

class PaymentCheckoutRequest(BaseModel):
    plan: str
    customer_email: Optional[str] = None

class PaymentCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class PaymentSessionResponse(BaseModel):
    session_id: str
    plan: str
    plan_label: str
    status: str
    customer_email: Optional[str] = None
    amount_total: Optional[int] = None
    currency: Optional[str] = None
