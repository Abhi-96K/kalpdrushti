import os
import httpx
import asyncio
import glob
import random
from typing import Optional
from moviepy import ImageClip, VideoFileClip, AudioFileClip, AudioClip, concatenate_videoclips, CompositeAudioClip
import moviepy.audio.fx as afx
from models.schemas import VideoScript
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

VIDEO_FPS = int(os.environ.get("VIDEO_FPS", "30"))
VIDEO_PRESET = os.environ.get("VIDEO_PRESET", "ultrafast")
VIDEO_BITRATE = os.environ.get("VIDEO_BITRATE", "12M")
VIDEO_AUDIO_BITRATE = os.environ.get("VIDEO_AUDIO_BITRATE", "192k")
BACKGROUND_MUSIC_ENABLED = os.environ.get("BACKGROUND_MUSIC_ENABLED", "true").strip().lower() == "true"
BACKGROUND_MUSIC_SOURCE = os.environ.get("BACKGROUND_MUSIC_SOURCE", "auto").strip().lower()
BACKGROUND_MUSIC_VOLUME = float(os.environ.get("BACKGROUND_MUSIC_VOLUME", "0.11"))
BACKGROUND_MUSIC_SYNTH_FPS = int(os.environ.get("BACKGROUND_MUSIC_SYNTH_FPS", "44100"))

MUSIC_PROFILES = {
    "emotional": {
        "bpm": 72,
        "volume": 0.09,
        "chords": [(220.00, 261.63, 329.63), (174.61, 220.00, 261.63), (196.00, 246.94, 293.66), (164.81, 196.00, 246.94)],
        "arp": [440.00, 392.00, 329.63, 293.66, 261.63, 329.63],
        "bass": 55.00,
        "pulse": 0.15,
    },
    "excited": {
        "bpm": 132,
        "volume": 0.105,
        "chords": [(261.63, 329.63, 392.00), (349.23, 440.00, 523.25), (392.00, 493.88, 587.33), (329.63, 415.30, 493.88)],
        "arp": [523.25, 659.25, 783.99, 987.77, 783.99, 659.25],
        "bass": 65.41,
        "pulse": 0.75,
    },
    "inspirational": {
        "bpm": 96,
        "volume": 0.1,
        "chords": [(261.63, 329.63, 392.00), (196.00, 246.94, 329.63), (220.00, 261.63, 329.63), (174.61, 220.00, 261.63)],
        "arp": [392.00, 523.25, 659.25, 523.25, 440.00, 392.00],
        "bass": 65.41,
        "pulse": 0.35,
    },
    "suspense": {
        "bpm": 84,
        "volume": 0.085,
        "chords": [(110.00, 130.81, 155.56), (116.54, 138.59, 164.81), (98.00, 123.47, 146.83), (103.83, 130.81, 155.56)],
        "arp": [220.00, 233.08, 261.63, 246.94, 207.65],
        "bass": 41.20,
        "pulse": 0.22,
    },
    "calm": {
        "bpm": 68,
        "volume": 0.08,
        "chords": [(261.63, 329.63, 392.00), (293.66, 349.23, 440.00), (246.94, 329.63, 392.00), (220.00, 261.63, 329.63)],
        "arp": [329.63, 392.00, 493.88, 392.00, 349.23],
        "bass": 65.41,
        "pulse": 0.08,
    },
    "educational": {
        "bpm": 108,
        "volume": 0.095,
        "chords": [(196.00, 246.94, 293.66), (220.00, 261.63, 329.63), (246.94, 293.66, 369.99), (174.61, 220.00, 261.63)],
        "arp": [392.00, 493.88, 587.33, 493.88, 440.00, 392.00],
        "bass": 49.00,
        "pulse": 0.5,
    },
}

MOOD_KEYWORDS = {
    "emotional": ("emotional", "sad", "heart", "love", "loss", "pain", "memory", "tears", "hope", "inspiring story", "struggle"),
    "excited": ("excited", "energetic", "fast", "hype", "powerful", "dynamic", "thrilling", "action", "adventure", "celebration", "wow"),
    "suspense": ("mystery", "dark", "danger", "fear", "tense", "suspense", "secret", "dramatic", "warning", "unknown"),
    "calm": ("calm", "peace", "relax", "soft", "gentle", "meditation", "nature", "quiet", "soothing"),
    "inspirational": ("inspire", "motivation", "dream", "success", "future", "growth", "achieve", "journey", "vision"),
    "educational": ("learn", "lesson", "education", "programming", "java", "python", "coding", "tutorial", "student", "beginner", "explain"),
}


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

def _detect_music_mood(script_data: VideoScript) -> str:
    text_parts = []
    for scene in script_data.scenes:
        text_parts.extend([scene.setting, scene.characters, scene.action, scene.narration])
    text = " ".join(text_parts).lower()

    scores = {}
    for mood, keywords in MOOD_KEYWORDS.items():
        scores[mood] = sum(text.count(keyword) for keyword in keywords)

    selected_mood = max(scores, key=scores.get)
    if scores[selected_mood] == 0:
        return "educational"
    return selected_mood

def _find_mood_music_file(mood: str, bg_music_dir: str) -> Optional[str]:
    if not os.path.exists(bg_music_dir):
        return None

    music_files = []
    for extension in ("*.mp3", "*.wav", "*.m4a", "*.aac", "*.ogg"):
        music_files.extend(glob.glob(os.path.join(bg_music_dir, "**", extension), recursive=True))

    if not music_files:
        return None

    mood_matches = [
        path for path in music_files
        if mood in os.path.basename(path).lower() or mood in os.path.dirname(path).lower()
    ]
    if mood_matches:
        return random.choice(mood_matches)

    return random.choice(music_files) if BACKGROUND_MUSIC_SOURCE == "files" else None

def _fade_envelope(t, duration: float, fade_seconds: float = 1.8):
    import numpy as np

    fade_in = np.clip(t / fade_seconds, 0.0, 1.0)
    fade_out = np.clip((duration - t) / fade_seconds, 0.0, 1.0)
    return np.minimum(fade_in, fade_out)

def _create_procedural_music(mood: str, duration: float, scene_start_times: list[float]):
    import numpy as np

    profile = MUSIC_PROFILES.get(mood, MUSIC_PROFILES["educational"])
    bpm = profile["bpm"]
    chords = profile["chords"]
    arp = profile["arp"]
    bass = profile["bass"]
    pulse_amount = profile["pulse"]
    volume = BACKGROUND_MUSIC_VOLUME * profile["volume"] / MUSIC_PROFILES["educational"]["volume"]

    def frame_function(t):
        times = np.atleast_1d(np.asarray(t, dtype=float))
        beats = times * bpm / 60.0
        bars = np.floor(beats / 4).astype(int)
        chord_index = bars % len(chords)

        audio = np.zeros_like(times, dtype=float)
        for index, chord in enumerate(chords):
            mask = chord_index == index
            if not np.any(mask):
                continue
            masked_times = times[mask]
            chord_wave = np.zeros_like(masked_times)
            for freq in chord:
                chord_wave += np.sin(2 * np.pi * freq * masked_times) / len(chord)
            audio[mask] += 0.34 * chord_wave

        arp_index = np.floor(beats * 2).astype(int) % len(arp)
        arp_freqs = np.asarray(arp, dtype=float)[arp_index]
        arp_gate = (np.sin(2 * np.pi * (bpm / 60.0) * times) > -0.25).astype(float)
        audio += 0.18 * arp_gate * np.sin(2 * np.pi * arp_freqs * times)

        beat_phase = beats % 1.0
        pulse = np.exp(-beat_phase * 9.0)
        audio += pulse_amount * 0.16 * pulse * np.sin(2 * np.pi * bass * times)

        for start_time in scene_start_times[1:]:
            distance = times - start_time
            accent_mask = (distance >= 0) & (distance <= 0.55)
            if np.any(accent_mask):
                accent = np.exp(-distance[accent_mask] * 8.0)
                audio[accent_mask] += 0.12 * accent * np.sin(2 * np.pi * 880.0 * times[accent_mask])

        envelope = _fade_envelope(times, duration)
        audio = np.tanh(audio * 0.9) * envelope * volume

        left = audio * 0.96
        right = audio * 0.90 + 0.04 * np.sin(2 * np.pi * 0.25 * times) * audio
        stereo = np.column_stack([left, right])

        if np.isscalar(t):
            return stereo[0]
        return stereo

    return AudioClip(frame_function=frame_function, duration=duration, fps=BACKGROUND_MUSIC_SYNTH_FPS)

def _build_background_music(script_data: VideoScript, duration: float, scene_start_times: list[float]):
    if not BACKGROUND_MUSIC_ENABLED or duration <= 0:
        return None, "disabled"

    mood = _detect_music_mood(script_data)
    bg_music_dir = "../media/audio/bg_music"

    if BACKGROUND_MUSIC_SOURCE in {"auto", "files"}:
        bg_music_path = _find_mood_music_file(mood, bg_music_dir)
        if bg_music_path:
            bg_music = AudioFileClip(bg_music_path)
            bg_music = bg_music.with_effects([
                afx.AudioLoop(duration=duration),
                afx.MultiplyVolume(BACKGROUND_MUSIC_VOLUME),
                afx.AudioFadeIn(1.2),
                afx.AudioFadeOut(2.0),
            ])
            return bg_music, f"{mood} file: {bg_music_path}"

    if BACKGROUND_MUSIC_SOURCE in {"auto", "procedural"}:
        bg_music = _create_procedural_music(mood, duration, scene_start_times)
        return bg_music, f"{mood} procedural"

    return None, "no matching background music source"

def _layer_background_music(final_video, script_data: VideoScript, scene_start_times: list[float]):
    try:
        bg_music, music_label = _build_background_music(script_data, final_video.duration, scene_start_times)
        if not bg_music:
            logger.info(f"Background music skipped: {music_label}")
            return final_video

        final_audio = CompositeAudioClip([final_video.audio, bg_music])
        logger.info(f"Added mood-aware background music: {music_label}")
        return final_video.with_audio(final_audio)
    except Exception as e:
        logger.warning(f"Failed to layer background music. Ignoring error: {str(e)}")
        return final_video

def build_video(video_id: str, script_data: VideoScript, image_paths: list[str], voice_data: dict, use_real_video: bool = False) -> str:
    """
    Assembles the final video by applying cinematic camera movements to static images or using AI-generated videos.
    """
    scene_clips = []
    
    audio_paths = voice_data["audio_paths"]
    subtitle_paths = voice_data["subtitle_paths"]
    scene_start_times = []
    elapsed_time = 0.0
    
    for i in range(len(script_data.scenes)):
        # Verify assets exist
        if not os.path.exists(image_paths[i]) or not os.path.exists(audio_paths[i]):
            raise Exception(f"Missing assets for scene {i}")
        
        # Create scene prompt for video generation
        scene = script_data.scenes[i]
        scene_prompt = f"Setting: {scene.setting}. Characters: {scene.characters}. Action: {scene.action}"
            
        clip = create_scene_clip(image_paths[i], audio_paths[i], subtitle_paths[i], scene_index=i, use_real_video=use_real_video, scene_prompt=scene_prompt)
        scene_start_times.append(elapsed_time)
        elapsed_time += clip.duration
        scene_clips.append(clip)
        
    final_video = concatenate_videoclips(scene_clips, method="compose")

    final_video = _layer_background_music(final_video, script_data, scene_start_times)
    
    output_path = f"../media/videos/{video_id}.mp4"
    
    # Write to file. 
    # Use libx264 for maximum compatibility, aac for audio.
    # Prefer quality over speed here because image detail is otherwise lost in the final MP4.
    logger.info(f"Writing final video to {output_path}")
    final_video.write_videofile(
        output_path, 
        fps=VIDEO_FPS,
        codec="libx264", 
        audio_codec="aac",
        audio_bitrate=VIDEO_AUDIO_BITRATE,
        bitrate=VIDEO_BITRATE,
        preset=VIDEO_PRESET,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        threads=max(1, os.cpu_count() or 4), # Parallel CPU encoding
        logger=None # Disable moviepy terminal spam in prod logs
    )
    
    return output_path
