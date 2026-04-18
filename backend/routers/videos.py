from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.schemas import VideoStatusResponse
from models.database import get_db
from models.schemas import VideoRequestDB

router = APIRouter()

@router.get("/videos", response_model=List[VideoStatusResponse])
def get_all_videos(db: Session = Depends(get_db)):
    """Fetch all video requests for the dashboard history."""
    videos = db.query(VideoRequestDB).order_by(VideoRequestDB.created_at.desc()).all()
    return videos

@router.get("/videos/{video_id}", response_model=VideoStatusResponse)
def get_video_status(video_id: str, db: Session = Depends(get_db)):
    """Fetch specific status for a running job (for polling progress)."""
    video = db.query(VideoRequestDB).filter(VideoRequestDB.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video request not found")
    return video
