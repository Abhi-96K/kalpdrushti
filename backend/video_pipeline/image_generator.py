import os
import httpx
import logging
import asyncio
from models.schemas import VideoScript

logger = logging.getLogger(__name__)

async def generate_single_image(prompt: str, output_path: str, aspect_ratio: str = "9:16"):
    """
    Calls Pollinations AI to generate an image.
    """
    import urllib.parse

    layout_hint = "vertical portrait format framing" if aspect_ratio == "9:16" else "horizontal landscape format framing" if aspect_ratio == "16:9" else "square format framing"
    enhanced_prompt = f"hyper-realistic, photorealistic photography, highly detailed, professional lighting, {layout_hint}. {prompt}"
    encoded_prompt = urllib.parse.quote(enhanced_prompt)

    if aspect_ratio == "16:9":
        width, height = 1920, 1080
    elif aspect_ratio == "1:1":
        width, height = 1080, 1080
    else: # 9:16
        width, height = 1080, 1920

    # Use Pollinations AI for reliable, free generation as per architecture doc
    # Force use of a realistic base model like flux to avoid cartoonish generations and respect aspect ratios properly
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&model=flux"

    # Retry loop in case of transient API issues
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(url)
                response.raise_for_status()

                with open(output_path, "wb") as f:
                    f.write(response.content)

            logger.info(f"Successfully generated image: {output_path}")
            return output_path

        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed for image '{output_path}': {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"Generate image ultimately failed for prompt '{prompt}' after {max_retries} attempts.")
                raise Exception(f"Image generation failed: {str(e)}")

            # Exponential backoff sleep before retrying
            await asyncio.sleep(4 ** attempt)

async def generate_images(video_id: str, script_data: VideoScript, aspect_ratio: str = "9:16") -> list[str]:
    """
    Generates images sequentially to avoid HuggingFace free tier rate limits.
    """
    image_paths = []

    for i, scene in enumerate(script_data.scenes):
        image_prompt = f"Setting: {scene.setting}. Characters: {scene.characters}. Action: {scene.action}."
        output_path = f"../media/images/{video_id}_scene_{i}.jpg" # FLUX outputs JPEG

        await generate_single_image(image_prompt, output_path, aspect_ratio)
        image_paths.append(output_path)

        # Short artificial delay to prevent 429 Too Many Requests from Pollinations AI
        await asyncio.sleep(2.0)

    return image_paths
