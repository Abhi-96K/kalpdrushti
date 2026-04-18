from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, File, UploadFile, Form
import os
import shutil
from sqlalchemy.orm import Session
import uuid

from models.schemas import VideoGenerateRequest, VideoStatusResponse
from models.database import get_db, engine, Base
from models.schemas import VideoRequestDB
from video_pipeline.orchestrator import run_pipeline

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.post("/generate", response_model=VideoStatusResponse)
async def generate_video(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    voice: str = Form("en-US-ChristopherNeural"),
    series_name: str = Form(None),
    file: UploadFile = File(None),
    aspect_ratio: str = Form("9:16"),
    db: Session = Depends(get_db)
):
    """
    Endpoint to receive a prompt (and optional file) and start the async background generation pipeline.
    """
    video_id = str(uuid.uuid4())

    file_path = None
    if file:
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are supported as visual references.")

        os.makedirs("../media/uploads", exist_ok=True)
        # get extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            ext = ".png" # default
        file_path = f"../media/uploads/{video_id}{ext}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Create DB Record
    db_request = VideoRequestDB(
        id=video_id,
        prompt=prompt,
        status="pending",
        series_name=series_name,
        uploaded_file_path=file_path
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    # Start background generation job
    background_tasks.add_task(run_pipeline, video_id, prompt, db, file_path, voice, series_name, aspect_ratio)

    return VideoStatusResponse(
        id=db_request.id,
        status=db_request.status,
        prompt=db_request.prompt,
        created_at=db_request.created_at
    )

@router.post("/abort/{video_id}")
async def abort_job(
    video_id: str,
    db: Session = Depends(get_db)
):
    db_obj = db.query(VideoRequestDB).filter(VideoRequestDB.id == video_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Job not found")

    db_obj.status = "abort_requested"
    db.commit()
    return {"message": "Abort requested"}
