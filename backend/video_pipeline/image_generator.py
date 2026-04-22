import os
import httpx
import logging
import asyncio
import base64
import hashlib
import io
import random
import urllib.parse
from typing import Optional
from openai import AsyncOpenAI
from PIL import Image, ImageEnhance, ImageOps
from dotenv import load_dotenv
from models.schemas import VideoScript

load_dotenv()

logger = logging.getLogger(__name__)

ASPECT_RATIO_DIMENSIONS = {
    "9:16": (1440, 2560),
    "16:9": (2560, 1440),
    "1:1": (1536, 1536),
}

POLLINATIONS_REQUEST_DIMENSIONS = {
    "9:16": (1024, 1792),
    "16:9": (1792, 1024),
    "1:1": (1280, 1280),
}

OPENAI_IMAGE_SIZES = {
    "9:16": "1024x1536",
    "16:9": "1536x1024",
    "1:1": "1024x1024",
}

POLLINATIONS_IMAGE_MODEL = os.environ.get("IMAGE_MODEL", "flux")
IMAGE_PROVIDER = os.environ.get("IMAGE_PROVIDER", "pollinations").strip().lower()
IMAGE_QUALITY = os.environ.get("IMAGE_QUALITY", "high")
OPENAI_IMAGE_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1.5")
POLLINATIONS_WIDTH = os.environ.get("POLLINATIONS_WIDTH")
POLLINATIONS_HEIGHT = os.environ.get("POLLINATIONS_HEIGHT")
POLLINATIONS_QUALITY = os.environ.get("POLLINATIONS_QUALITY", "hd").strip().lower()
POLLINATIONS_SAFE = os.environ.get("POLLINATIONS_SAFE", "true").strip().lower() == "true"
POLLINATIONS_NOFEED = os.environ.get("POLLINATIONS_NOFEED", "true").strip().lower() == "true"
POLLINATIONS_SEED = os.environ.get("POLLINATIONS_SEED", "").strip()
POLLINATIONS_MAX_CONCURRENCY = max(1, int(os.environ.get("POLLINATIONS_MAX_CONCURRENCY", "1")))
POLLINATIONS_REQUEST_DELAY_SECONDS = max(0.0, float(os.environ.get("POLLINATIONS_REQUEST_DELAY_SECONDS", "3.5")))
IMAGE_MAX_RETRIES = max(1, int(os.environ.get("IMAGE_MAX_RETRIES", "6")))
IMAGE_PROMPT_MAX_CHARS = max(400, int(os.environ.get("IMAGE_PROMPT_MAX_CHARS", "1400")))

NEGATIVE_IMAGE_PROMPT = os.environ.get(
    "NEGATIVE_IMAGE_PROMPT",
    (
        "low quality, blurry, soft focus, pixelated, noisy, jpeg artifacts, warped geometry, "
        "bad anatomy, distorted face, extra fingers, missing fingers, deformed hands, duplicated people, "
        "messy composition, unreadable text, gibberish letters, watermark, logo, signature, "
        "cartoon, anime, plastic CGI, oversaturated colors, flat lighting"
    ),
)


def _get_target_dimensions(aspect_ratio: str) -> tuple[int, int]:
    return ASPECT_RATIO_DIMENSIONS.get(aspect_ratio, ASPECT_RATIO_DIMENSIONS["9:16"])


def _get_pollinations_request_dimensions(aspect_ratio: str) -> tuple[int, int]:
    if POLLINATIONS_WIDTH and POLLINATIONS_HEIGHT:
        return int(POLLINATIONS_WIDTH), int(POLLINATIONS_HEIGHT)
    return POLLINATIONS_REQUEST_DIMENSIONS.get(aspect_ratio, POLLINATIONS_REQUEST_DIMENSIONS["9:16"])


def _get_layout_hint(aspect_ratio: str) -> str:
    if aspect_ratio == "16:9":
        return "horizontal 16:9 landscape frame, wide cinematic composition"
    if aspect_ratio == "1:1":
        return "square 1:1 frame, balanced centered composition"
    return "vertical 9:16 portrait frame for short-form video, strong top-to-bottom composition"


def _compact_prompt(prompt: str, max_chars: int = IMAGE_PROMPT_MAX_CHARS) -> str:
    compacted = " ".join(prompt.split())
    if len(compacted) <= max_chars:
        return compacted
    return compacted[:max_chars].rsplit(" ", 1)[0]


def _build_enhanced_prompt(prompt: str, aspect_ratio: str) -> str:
    layout_hint = _get_layout_hint(aspect_ratio)
    prompt = _compact_prompt(prompt)
    return _compact_prompt(
        (
            "Ultra high quality cinematic still frame for a professional short-form video. "
            "Photorealistic editorial photography, crisp subject detail, realistic lens rendering, "
            "natural depth of field, film-quality lighting, balanced contrast, premium color grading, "
            "rich but controlled shadows, realistic materials, detailed textures, clean production design. "
            "Shot on a 35mm cinema lens, high dynamic range, sharp focal subject, layered foreground and background. "
            f"Composition: {layout_hint}; leave clean lower-safe-area space for subtitles, no crowded edges. "
            "Single coherent scene, not a collage, not a poster, not a UI mockup. "
            "Do not render decorative words or labels unless the scene explicitly requires real programming code on a screen. "
            f"Scene details: {prompt}"
        ),
        max_chars=1800,
    )


def _save_image_bytes(image_bytes: bytes, output_path: str, aspect_ratio: str) -> str:
    width, height = _get_target_dimensions(aspect_ratio)
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with Image.open(io.BytesIO(image_bytes)) as image:
        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")

        image = ImageOps.fit(
            image,
            (width, height),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        image = ImageOps.autocontrast(image, cutoff=0.2)
        image = ImageEnhance.Color(image).enhance(1.04)
        image = ImageEnhance.Sharpness(image).enhance(1.12)
        image = ImageEnhance.Contrast(image).enhance(1.06)
        image.save(
            output_path,
            format="JPEG",
            quality=98,
            subsampling=0,
            optimize=True,
            progressive=True,
        )

    return output_path


def _selected_provider() -> str:
    if IMAGE_PROVIDER == "auto":
        return "openai" if os.environ.get("OPENAI_IMAGE_API_KEY") else "pollinations"
    if IMAGE_PROVIDER in {"pollinations", "openai"}:
        return IMAGE_PROVIDER
    raise ValueError("IMAGE_PROVIDER must be one of: pollinations, openai, auto")


def _pollinations_seed(enhanced_prompt: str, output_path: str) -> Optional[int]:
    if not POLLINATIONS_SEED:
        seed_material = f"{output_path}:{enhanced_prompt}".encode("utf-8")
        return int(hashlib.sha256(seed_material).hexdigest()[:12], 16) % 2_147_483_647
    if POLLINATIONS_SEED.lower() == "random":
        return None
    return int(POLLINATIONS_SEED)


async def _generate_with_openai(enhanced_prompt: str, output_path: str, aspect_ratio: str) -> str:
    api_key = os.environ.get("OPENAI_IMAGE_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OpenAI image generation requires OPENAI_IMAGE_API_KEY or OPENAI_API_KEY")

    size = OPENAI_IMAGE_SIZES.get(aspect_ratio, OPENAI_IMAGE_SIZES["9:16"])
    client = AsyncOpenAI(api_key=api_key)
    result = await client.images.generate(
        model=OPENAI_IMAGE_MODEL,
        prompt=enhanced_prompt,
        size=size,
        quality=IMAGE_QUALITY,
        output_format="jpeg",
        output_compression=95,
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    return _save_image_bytes(image_bytes, output_path, aspect_ratio)


async def _generate_with_pollinations(enhanced_prompt: str, output_path: str, aspect_ratio: str) -> str:
    width, height = _get_pollinations_request_dimensions(aspect_ratio)
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    query = {
        "width": width,
        "height": height,
        "nologo": "true",
        "nofeed": str(POLLINATIONS_NOFEED).lower(),
        "safe": str(POLLINATIONS_SAFE).lower(),
        "model": POLLINATIONS_IMAGE_MODEL,
        "quality": POLLINATIONS_QUALITY,
        "enhance": "true",
        "negative_prompt": NEGATIVE_IMAGE_PROMPT,
    }
    seed = _pollinations_seed(enhanced_prompt, output_path)
    if seed is not None:
        query["seed"] = seed

    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?{urllib.parse.urlencode(query)}"
    )

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.get(url)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "").lower()
    if not content_type.startswith("image/"):
        preview = response.text[:200].replace("\n", " ")
        raise ValueError(f"Image provider returned non-image response: {preview}")

    return _save_image_bytes(response.content, output_path, aspect_ratio)


async def generate_single_image(prompt: str, output_path: str, aspect_ratio: str = "9:16"):
    """
    Generates a high-quality scene image for the video pipeline.
    """
    enhanced_prompt = _build_enhanced_prompt(prompt, aspect_ratio)
    provider = _selected_provider()

    for attempt in range(IMAGE_MAX_RETRIES):
        try:
            if provider == "openai":
                await _generate_with_openai(enhanced_prompt, output_path, aspect_ratio)
            else:
                await _generate_with_pollinations(enhanced_prompt, output_path, aspect_ratio)

            logger.info(f"Successfully generated image with {provider}: {output_path}")
            return output_path

        except Exception as e:
            retry_after = None
            status_code = None
            if isinstance(e, httpx.HTTPStatusError):
                status_code = e.response.status_code
                retry_after = e.response.headers.get("retry-after")

            logger.warning(f"Attempt {attempt + 1} failed for image '{output_path}': {str(e)}")
            if attempt == IMAGE_MAX_RETRIES - 1:
                logger.error(f"Generate image ultimately failed for prompt '{prompt}' after {IMAGE_MAX_RETRIES} attempts.")
                raise Exception(f"Image generation failed: {str(e)}")

            if retry_after and retry_after.isdigit():
                delay = int(retry_after)
            elif status_code == 429:
                delay = min(90, 12 * (attempt + 1))
            else:
                delay = min(30, 2 ** attempt)

            delay += random.uniform(0.5, 2.0)
            logger.info(f"Retrying image '{output_path}' in {delay:.1f}s...")
            await asyncio.sleep(delay)


async def generate_images(video_id: str, script_data: VideoScript, aspect_ratio: str = "9:16") -> list[str]:
    """
    Generates images concurrently using a semaphore to avoid 429 Too Many Requests errors.
    """
    provider = _selected_provider()
    max_concurrency = POLLINATIONS_MAX_CONCURRENCY if provider == "pollinations" else 3
    sem = asyncio.Semaphore(max_concurrency)

    async def _generate_scene_image(scene_index: int, scene) -> str:
        async with sem:
            image_prompt = f"Setting: {scene.setting}. Characters: {scene.characters}. Action: {scene.action}."
            output_path = f"../media/images/{video_id}_scene_{scene_index}.jpg" # FLUX outputs JPEG
            
            # Pollinations is a free public endpoint and throttles bursts aggressively.
            if scene_index > 0:
                await asyncio.sleep(POLLINATIONS_REQUEST_DELAY_SECONDS * scene_index)

            await generate_single_image(image_prompt, output_path, aspect_ratio)
            return output_path

    tasks = [
        _generate_scene_image(i, scene)
        for i, scene in enumerate(script_data.scenes)
    ]
    
    image_paths = await asyncio.gather(*tasks)
    return list(image_paths)
