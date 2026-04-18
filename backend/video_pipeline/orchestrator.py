from sqlalchemy.orm import Session
from models.schemas import VideoRequestDB
import logging
import asyncio

from video_pipeline.script_generator import generate_script
from video_pipeline.image_generator import generate_images
from video_pipeline.voice_generator import generate_voices
from video_pipeline.video_builder import build_video

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_abort(db: Session, video_id: str):
    """Helper to check if the job was aborted."""
    db_obj = db.query(VideoRequestDB).filter(VideoRequestDB.id == video_id).first()
    if db_obj and db_obj.status == "abort_requested":
        db_obj.status = "aborted"
        db.commit()
        return True
    return False

def update_status(db: Session, video_id: str, status: str, error: str = None, video_url: str = None):
    """Helper to update job status in DB."""
    db_obj = db.query(VideoRequestDB).filter(VideoRequestDB.id == video_id).first()
    if db_obj:
        if db_obj.status in ["aborted", "failed"]:
            return # Don't overwrite terminal states
        db_obj.status = status
        if error:
            db_obj.error_message = error
        if video_url:
            db_obj.video_url = video_url
        db.commit()

async def run_pipeline(video_id: str, prompt: str, db: Session, file_path: str = None, voice: str = "en-US-ChristopherNeural", series_name: str = None, aspect_ratio: str = "9:16"):
    """
    Main asynchronous pipeline orchestrator.
    Executes: Script -> Images -> Voice -> Final Video Assembly
    """
    try:
        if check_abort(db, video_id): return

        # --- 1. Script Generation ---
        update_status(db, video_id, "generating_script")
        logger.info(f"[{video_id}] Generating script for prompt: {prompt}")

        previous_context = None
        if series_name:
            prev_video = db.query(VideoRequestDB).filter(
                VideoRequestDB.series_name == series_name,
                VideoRequestDB.status == "completed",
                VideoRequestDB.id != video_id
            ).order_by(VideoRequestDB.created_at.desc()).first()
            if prev_video and prev_video.script_content:
                previous_context = prev_video.script_content
                logger.info(f"[{video_id}] Found previous context for series '{series_name}'")

        # Determine target language from voice identity
        voice_lower = voice.lower()
        if "hi-in" in voice_lower:
            target_lang = "Hindi"
        elif "mr-in" in voice_lower:
            target_lang = "Marathi"
        else:
            target_lang = "English"

        script_data = await generate_script(prompt, previous_context, language=target_lang)

        # Save script_content to DB for future memory
        db_obj = db.query(VideoRequestDB).filter(VideoRequestDB.id == video_id).first()
        if db_obj:
            if hasattr(script_data, 'model_dump_json'):
                db_obj.script_content = script_data.model_dump_json() # Pydantic v2
            else:
                db_obj.script_content = script_data.json() # Pydantic v1
            db.commit()

        if check_abort(db, video_id): return

        # --- 2. & 3. Media Generation (Images + Voice) ---
        update_status(db, video_id, "generating_images")
        logger.info(f"[{video_id}] Generating images and voices concurrently...")

        async def get_images():
            if file_path:
                import shutil
                paths = []
                for i in range(len(script_data.scenes)):
                    scene_path = f"../media/images/{video_id}_scene_{i}.jpg"
                    shutil.copy2(file_path, scene_path)
                    paths.append(scene_path)
                return paths
            else:
                return await generate_images(video_id, script_data, aspect_ratio)

        # Fire both heavy AI tasks simultaneously
        image_paths, voice_data = await asyncio.gather(
            get_images(),
            generate_voices(video_id, script_data, voice)
        )

        # Flash the audio state for UI flow completeness
        update_status(db, video_id, "generating_audio")

        if check_abort(db, video_id): return

        # --- 4. Final Video Assembly ---
        update_status(db, video_id, "rendering_video")
        logger.info(f"[{video_id}] Assembling final MP4 with cinematic motion...")
        # MoviePy can block the async event loop if run directly, so we use asyncio.to_thread
        final_video_path = await asyncio.to_thread(
            build_video, video_id, script_data, image_paths, voice_data
        )

        # --- Finalize ---
        update_status(db, video_id, "completed", video_url=f"/media/videos/{video_id}.mp4")
        logger.info(f"[{video_id}] Pipeline complete!")

    except Exception as e:
        logger.error(f"[{video_id}] Pipeline failed: {str(e)}")
        update_status(db, video_id, "failed", error=str(e))
