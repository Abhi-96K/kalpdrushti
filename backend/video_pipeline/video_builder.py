import os
import httpx
import asyncio
from moviepy import ImageClip, VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, concatenate_videoclips, CompositeAudioClip
import moviepy.video.fx as vfx
import moviepy.audio.fx as afx
from models.schemas import VideoScript
import logging

logger = logging.getLogger(__name__)

async def generate_scene_video(prompt: str, output_path: str, duration: float = 3.0):
    """
    Generate a video scene using Pollinations AI free video API.
    """
    import urllib.parse

    # Enhance prompt for video generation
    video_prompt = f"cinematic video scene: {prompt}. Smooth camera movements, professional cinematography, high quality motion."

    # Encode the prompt
    encoded_prompt = urllib.parse.quote(video_prompt)

    # Use Pollinations AI video endpoint (free, no auth required)
    url = f"https://gen.pollinations.ai/video/{encoded_prompt}?duration={duration}&width=1080&height=1920"

    # Retry loop for reliability
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minute timeout for video generation
                response = await client.get(url)
                response.raise_for_status()

                with open(output_path, "wb") as f:
                    f.write(response.content)

            logger.info(f"Successfully generated video scene: {output_path}")
            return output_path

        except Exception as e:
            logger.warning(f"Video generation attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"Video generation failed after {max_retries} attempts")
                raise Exception(f"Video generation failed: {str(e)}")
            await asyncio.sleep(2 ** attempt)  # Exponential backoff



def create_scene_clip(image_path: str, audio_path: str, subtitle_path: str, scene_index: int = 0, use_real_video: bool = False, scene_prompt: str = ""):
    """
    Takes an input image/video, audio, and subtitle file and compiles them into a single VideoClip.
    Can use real AI-generated video or synthetic cinematic camera movements.
    """
    from moviepy import VideoClip
    import numpy as np
    from PIL import Image

    # Load audio to get duration
    audio = AudioFileClip(audio_path)
    duration = audio.duration

    if use_real_video and scene_prompt:
        # Try to generate real video using Pollinations AI
        try:
            video_path = image_path.replace('.jpg', '.mp4')
            asyncio.run(generate_scene_video(scene_prompt, video_path, duration))

            # Load the generated video
            video_clip = VideoFileClip(video_path)

            # Resize if needed to match aspect ratio
            if video_clip.size != (1080, 1920):
                video_clip = video_clip.resize(height=1920)

            # Attach audio
            video_clip = video_clip.with_audio(audio)
            return video_clip

        except Exception as e:
            logger.warning(f"Real video generation failed, falling back to synthetic motion: {str(e)}")
            # Fall back to synthetic motion

    # Original synthetic motion code
    image_clip = ImageClip(image_path)
    frame_0 = image_clip.get_frame(0)
    img_h, img_w = frame_0.shape[:2]

    base_img = Image.fromarray(frame_0)

    # Deterministic effect type based on scene index for consistency
    effect_type = scene_index % 4
    # 0 = Zoom in, 1 = Pan right, 2 = Zoom out, 3 = Pan left

    def make_frame(t):
        if duration == 0: duration_val = 0.1
        else: duration_val = duration
        
        progress = t / duration_val
        
        # Calculate scale (20% motion intensity for dramatic effect)
        intensity = 0.20 
        
        if effect_type == 0:
            scale = 1.0 + (intensity * progress) # Zoom in to 1.20x
        elif effect_type == 2:
            scale = (1.0 + intensity) - (intensity * progress) # Zoom out from 1.20x to 1.0x
        else:
            scale = 1.0 + intensity # Fixed max scale for panning to give maximum room
            
        new_w, new_h = int(img_w * scale), int(img_h * scale)
        img_res = base_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        if effect_type == 1:
            # Pan Right (camera sweeps across the scene)
            left = int((new_w - img_w) * progress)
        elif effect_type == 3:
            # Pan Left (camera sweep)
            left = int((new_w - img_w) * (1.0 - progress))
        else:
            # Center for Zoom in/out
            left = (new_w - img_w) // 2
            
        top = (new_h - img_h) // 2
        
        img_cropped = img_res.crop((left, top, left + img_w, top + img_h))
        return np.array(img_cropped)

    # Generate the moving video clip
    video_clip = VideoClip(make_frame, duration=duration)
    
    # Attach audio directly since there are no subtitles
    video = video_clip.with_audio(audio)
    return video

def build_video(video_id: str, script_data: VideoScript, image_paths: list[str], voice_data: dict, use_real_video: bool = False) -> str:
    """
    Assembles the final video by applying cinematic camera movements to static images or using AI-generated videos.
    """
    scene_clips = []
    
    audio_paths = voice_data["audio_paths"]
    subtitle_paths = voice_data["subtitle_paths"]
    
    for i in range(len(script_data.scenes)):
        # Verify assets exist
        if not os.path.exists(image_paths[i]) or not os.path.exists(audio_paths[i]):
            raise Exception(f"Missing assets for scene {i}")
        
        # Create scene prompt for video generation
        scene = script_data.scenes[i]
        scene_prompt = f"Setting: {scene.setting}. Characters: {scene.characters}. Action: {scene.action}"
            
        clip = create_scene_clip(image_paths[i], audio_paths[i], subtitle_paths[i], scene_index=i, use_real_video=use_real_video, scene_prompt=scene_prompt)
        scene_clips.append(clip)
        
    final_video = concatenate_videoclips(scene_clips, method="compose")
    
    # Add Background Music Mixed with Narrator Voice
    bg_music_dir = "../media/audio/bg_music"
    import glob, random
    if os.path.exists(bg_music_dir):
        music_files = glob.glob(os.path.join(bg_music_dir, "*.mp3"))
        if music_files:
            bg_music_path = random.choice(music_files)
            try:
                bg_music = AudioFileClip(bg_music_path)
                # Loop background music for the video duration and drop volume to 10%
                bg_music = bg_music.with_effects([afx.AudioLoop(duration=final_video.duration)])
                bg_music = bg_music.with_effects([afx.MultiplyVolume(0.1)])
                
                # Combine the original stitched audio with the background music
                final_audio = CompositeAudioClip([final_video.audio, bg_music])
                final_video = final_video.with_audio(final_audio)
                logger.info(f"Successfully added random background music: {bg_music_path}")
            except Exception as e:
                logger.warning(f"Failed to layer background music. Ignoring error: {str(e)}")
    
    output_path = f"../media/videos/{video_id}.mp4"
    
    # Write to file. 
    # Use libx264 for maximum compatibility, aac for audio.
    # Set high preset and adequate bitrate to ensure quality.
    # Using 24 fps as standard for web animation.
    logger.info(f"Writing final video to {output_path}")
    final_video.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac",
        preset="ultrafast",  # good for dev, can be 'medium' for prod
        threads=max(1, os.cpu_count() or 4), # Parallel CPU encoding
        logger=None # Disable moviepy terminal spam in prod logs
    )
    
    return output_path
