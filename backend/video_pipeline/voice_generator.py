import os
import asyncio
import edge_tts
import logging
import re
from models.schemas import VideoScript

logger = logging.getLogger(__name__)

def _get_tts_setting(env_name: str, default: str) -> str:
    value = os.getenv(env_name, default).strip()
    return value or default

def _normalize_pitch(pitch: str) -> str:
    """
    edge-tts 7.x accepts pitch in Hz (for example +5Hz), not percent.
    Convert the older local value format so generation does not fail at runtime.
    """
    if re.fullmatch(r"[+-]\d+%", pitch):
        return f"{pitch[:-1]}Hz"
    return pitch

async def generate_single_voice(text: str, audio_path: str, subtitle_path: str, voice: str = "en-US-ChristopherNeural"):
    """
    Generates an audio file from text using edge-tts,
    and also generates a raw VTT subtitle file to sync with it.
    """
    rate = _get_tts_setting("EDGE_TTS_RATE", "+10%")
    pitch = _normalize_pitch(_get_tts_setting("EDGE_TTS_PITCH", "+5Hz"))
    volume = _get_tts_setting("EDGE_TTS_VOLUME", "+0%")

    # Adding rate and pitch parameters to simulate higher energy/emotion.
    communicate = edge_tts.Communicate(
        text,
        voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
        boundary="WordBoundary",
    )

    # We use a submaker to grab word-level timestamps natively
    submaker = edge_tts.SubMaker()

    try:
        with open(audio_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    submaker.feed(chunk)

        # Write SRT subtitles
        with open(subtitle_path, "w", encoding="utf-8") as f:
            f.write(submaker.get_srt())

        logger.info(f"Successfully generated audio: {audio_path}")
    except Exception as e:
        logger.error(f"Failed generating voice for text '{text}': {str(e)}")
        raise e

async def generate_voices(video_id: str, script_data: VideoScript, voice: str = "en-US-ChristopherNeural") -> dict:
    """
    Generates audio narrations and subtitle files for each scene.
    Returns dictionaries of scene indexes mapped to their audio and subtitle file paths.
    """
    results = {"audio_paths": [], "subtitle_paths": []}
    tasks = []

    for i, scene in enumerate(script_data.scenes):
        audio_path = f"../media/audio/{video_id}_scene_{i}.mp3"
        subtitle_path = f"../media/audio/{video_id}_scene_{i}.srt"

        tasks.append(generate_single_voice(scene.narration, audio_path, subtitle_path, voice))

        results["audio_paths"].append(audio_path)
        results["subtitle_paths"].append(subtitle_path)

    await asyncio.gather(*tasks)
    return results
