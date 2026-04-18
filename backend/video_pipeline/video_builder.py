import os
import re
from moviepy import AudioFileClip, CompositeAudioClip, ImageClip, concatenate_videoclips
import moviepy.audio.fx as afx
from models.schemas import VideoScript
import logging

logger = logging.getLogger(__name__)

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def parse_srt_timestamp(value: str) -> float:
    """Convert an SRT timestamp into seconds."""
    hours, minutes, seconds, millis = re.split("[:,]", value)
    return (
        int(hours) * 3600
        + int(minutes) * 60
        + int(seconds)
        + int(millis) / 1000
    )


def load_subtitle_cues(subtitle_path: str) -> list[tuple[float, float, str]]:
    """Load SRT cues as (start_seconds, end_seconds, text)."""
    if not subtitle_path or not os.path.exists(subtitle_path):
        return []

    with open(subtitle_path, "r", encoding="utf-8") as file:
        content = file.read().strip()

    cues = []
    for block in re.split(r"\n\s*\n", content):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) < 2:
            continue

        timing_line = lines[1] if lines[0].isdigit() else lines[0]
        if "-->" not in timing_line:
            continue

        start_raw, end_raw = [part.strip() for part in timing_line.split("-->", 1)]
        text_start_index = 2 if lines[0].isdigit() else 1
        text = " ".join(lines[text_start_index:]).strip()
        if not text:
            continue

        try:
            cues.append((parse_srt_timestamp(start_raw), parse_srt_timestamp(end_raw), text))
        except ValueError:
            logger.warning(f"Skipping malformed subtitle cue in {subtitle_path}: {timing_line}")

    return cues


def get_caption_font(size: int):
    from PIL import ImageFont

    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                continue

    return ImageFont.load_default()


def text_size(draw, text: str, font) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=2)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if text_size(draw, candidate, font)[0] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def draw_subtitle(frame, cues: list[tuple[float, float, str]], t: float):
    from PIL import Image, ImageDraw
    import numpy as np

    subtitle = next((text for start, end, text in cues if start <= t <= end), None)
    if not subtitle:
        return frame

    image = Image.fromarray(frame).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    width, height = image.size
    font_size = max(28, min(64, int(width * 0.058)))
    font = get_caption_font(font_size)
    line_spacing = max(8, int(font_size * 0.25))
    max_text_width = int(width * 0.84)
    lines = wrap_text(draw, subtitle, font, max_text_width)

    if len(lines) > 3:
        lines = lines[:3]
        lines[-1] = f"{lines[-1].rstrip('.')}..."

    line_sizes = [text_size(draw, line, font) for line in lines]
    text_width = max((size[0] for size in line_sizes), default=0)
    text_height = sum(size[1] for size in line_sizes) + line_spacing * max(0, len(lines) - 1)
    pad_x = max(24, int(width * 0.045))
    pad_y = max(18, int(height * 0.018))
    box_width = min(width - 32, text_width + pad_x * 2)
    box_height = text_height + pad_y * 2
    box_left = (width - box_width) // 2
    box_bottom = height - max(36, int(height * 0.055))
    box_top = box_bottom - box_height
    radius = max(12, int(width * 0.025))

    draw.rounded_rectangle(
        (box_left, box_top, box_left + box_width, box_bottom),
        radius=radius,
        fill=(5, 8, 18, 210),
        outline=(255, 255, 255, 42),
        width=1,
    )

    y = box_top + pad_y
    for line, (_, line_height) in zip(lines, line_sizes):
        line_width, _ = text_size(draw, line, font)
        x = box_left + (box_width - line_width) // 2
        draw.text(
            (x, y),
            line,
            font=font,
            fill=(255, 255, 255, 255),
            stroke_width=2,
            stroke_fill=(0, 0, 0, 185),
        )
        y += line_height + line_spacing

    return np.array(Image.alpha_composite(image, overlay).convert("RGB"))

def create_scene_clip(image_path: str, audio_path: str, subtitle_path: str, scene_index: int = 0):
    """
    Takes an input image, audio, and subtitle file and compiles them into a single motion VideoClip.
    Applies synthetic cinematic camera movements to bypass external video generation limits.
    """
    from moviepy import VideoClip
    import numpy as np
    from PIL import Image

    # Load audio to get duration
    audio = AudioFileClip(audio_path)
    duration = audio.duration

    # Load Image
    image_clip = ImageClip(image_path)
    frame_0 = image_clip.get_frame(0)
    img_h, img_w = frame_0.shape[:2]

    base_img = Image.fromarray(frame_0)
    subtitle_cues = load_subtitle_cues(subtitle_path)

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
        frame = np.array(img_cropped)
        return draw_subtitle(frame, subtitle_cues, t)

    # Generate the moving video clip
    video_clip = VideoClip(make_frame, duration=duration)

    video = video_clip.with_audio(audio)
    return video

def build_video(video_id: str, script_data: VideoScript, image_paths: list[str], voice_data: dict) -> str:
    """
    Assembles the final video by applying cinematic camera movements to static images and concatenating them.
    """
    scene_clips = []

    audio_paths = voice_data["audio_paths"]
    subtitle_paths = voice_data["subtitle_paths"]

    for i in range(len(script_data.scenes)):
        # Verify assets exist
        if not os.path.exists(image_paths[i]) or not os.path.exists(audio_paths[i]):
            raise Exception(f"Missing assets for scene {i}")

        clip = create_scene_clip(image_paths[i], audio_paths[i], subtitle_paths[i], scene_index=i)
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
    # Set a production-oriented preset and bitrate so generated clips stay crisp.
    # Using 24 fps as standard for web animation.
    logger.info(f"Writing final video to {output_path}")
    try:
        final_video.write_videofile(
            output_path,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            preset="medium",
            bitrate="6000k",
            audio_bitrate="192k",
            threads=max(1, os.cpu_count() or 4), # Parallel CPU encoding
            logger=None # Disable moviepy terminal spam in prod logs
        )
    finally:
        final_video.close()
        for clip in scene_clips:
            clip.close()

    return output_path
