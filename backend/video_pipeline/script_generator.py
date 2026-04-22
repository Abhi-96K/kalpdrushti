import os
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
from models.schemas import VideoScript

# LLM configuration through OpenAI-compatible endpoints.
PROVIDER_ALIASES = {
    "xai": "grok",
    "grok": "grok",
    "groq": "groq",
    "gemini": "gemini",
    "google": "gemini",
    "openai": "openai",
    "custom": "custom",
}

PROVIDER_DEFAULTS = {
    "openai": {
        "api_key_envs": ("LLM_API_KEY", "OPENAI_API_KEY"),
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-3.5-turbo",
    },
    "grok": {
        "api_key_envs": ("LLM_API_KEY", "XAI_API_KEY", "GROK_API_KEY", "OPENAI_API_KEY"),
        "base_url": "https://api.x.ai/v1",
        "model": "grok-4-1-fast-reasoning",
    },
    "groq": {
        "api_key_envs": ("LLM_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"),
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "gemini": {
        "api_key_envs": ("LLM_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"),
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-2.5-flash",
    },
    "custom": {
        "api_key_envs": ("LLM_API_KEY", "OPENAI_API_KEY"),
        "base_url": None,
        "model": None,
    },
}


def _first_env(env_names):
    for env_name in env_names:
        value = os.environ.get(env_name)
        if value:
            return value
    return None


LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai").strip().lower()
LLM_PROVIDER = PROVIDER_ALIASES.get(LLM_PROVIDER, LLM_PROVIDER)
if LLM_PROVIDER not in PROVIDER_DEFAULTS:
    valid_providers = ", ".join(sorted(PROVIDER_DEFAULTS))
    raise ValueError(f"Unsupported LLM_PROVIDER '{LLM_PROVIDER}'. Use one of: {valid_providers}")

provider_config = PROVIDER_DEFAULTS[LLM_PROVIDER]
API_KEY = _first_env(provider_config["api_key_envs"])
if not API_KEY:
    env_names = ", ".join(provider_config["api_key_envs"])
    raise ValueError(f"LLM provider '{LLM_PROVIDER}' requires one of these environment variables: {env_names}")

OPENAI_BASE_URL = os.environ.get("LLM_BASE_URL")
if not OPENAI_BASE_URL and LLM_PROVIDER in ("openai", "custom"):
    OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
OPENAI_BASE_URL = OPENAI_BASE_URL or provider_config["base_url"]
if not OPENAI_BASE_URL:
    raise ValueError("Custom LLM provider requires LLM_BASE_URL or OPENAI_BASE_URL")

MODEL_NAME = os.environ.get("LLM_MODEL") or provider_config["model"]
if not MODEL_NAME:
    raise ValueError("Custom LLM provider requires LLM_MODEL")

client = AsyncOpenAI(
    api_key=API_KEY,
    base_url=OPENAI_BASE_URL
)

SYSTEM_PROMPT = """
You are a highly creative writer and director for short videos.
The user will give you a prompt. You must convert it into a structured sequence of scenes. Generate as many scenes as needed to fully cover the topic comprehensively (usually between 3 and 12 scenes depending on the topic length).

YOUR INSTRUCTIONS:
1. AUDIO TARGET LANGUAGE: The narration *MUST ENTIRELY BE WRITTEN* in the '{language}' language! The image settings/actions MUST REMAIN IN ENGLISH.
2. VIDEO DURATION & PACING: The user requested a target duration of: {duration}. 
   - You MUST ensure the amount of narration and number of scenes generated logically fills this time.
   - For 'Short (~15s)', generate ~2-3 scenes and approx 35-40 words total.
   - For 'Medium (~30s)', generate ~4-6 scenes and approx 70-80 words total.
   - For 'Long (~60s)', generate ~8-12 scenes and approx 140-160 words total.
3. EDUCATIONAL/CODING TOPICS: If the prompt is teaching programming (e.g. Java, Python) or tech concepts, YOU MUST:
   - Ensure the 'setting' and 'action' explicitly describe computer screens, IDEs, code editors, and terminal windows in a realistic, non-animated photography style.
   - You MUST include actual real code snippets in the 'action' or 'setting' (e.g. "Screen showing Java code: 'public class Main...'").
   - You MUST visualize the expected output (e.g. "Terminal output displays 'Hello World'").
   - Do NOT ask the image model to render long title cards, bullet lists, or marketing text overlays. Put educational text in narration unless it is short code visible on a realistic screen.
3. IMAGE QUALITY DIRECTION: Every scene's setting/characters/action fields are used directly as image-generation prompts. Make them concrete, visual, and production-ready:
   - Include camera framing, lens feel, lighting, mood, color palette, materials/textures, depth, and foreground/background details.
   - Describe one clear cinematic frame per scene instead of abstract concepts or generic adjectives.
   - Keep the same characters and visual style consistent across scenes unless the story intentionally changes.
   - Avoid asking for text, labels, signs, or UI text inside the image unless the prompt is about coding or the text is essential.
   - Do not include words like "low quality", "blurry", "cartoon", or "AI generated" except as things to avoid.
5. Create highly engaging, cinematic scene flows.

Respond ONLY with valid JSON using the exact following schema:
{
  "scenes": [
    {
      "setting": "Detailed description of the background/location in English for the image AI",
      "characters": "Description of characters in the scene in English",
      "action": "What is happening visually in English, including specific Code syntax on screens if coding related",
      "narration": "The exact script spoken by the voiceover. MUST BE IN {language}. Keep it engaging and 1-2 sentences."
    }
  ]
}
"""

async def generate_script(prompt: str, previous_context: str = None, language: str = "English", duration: str = "Medium (~30s)") -> VideoScript:
    """
    Calls the LLM to generate a structured script from a text prompt.
    Returns a Pydantic VideoScript object.
    """

    system_prompt = SYSTEM_PROMPT.replace("{language}", language).replace("{duration}", duration)
    if previous_context:
        system_prompt += f"\n\nIMPORTANT CONTEXT:\nThe user is creating this video as part of an ongoing series. The PREVIOUS video's script was exactly this: {previous_context}\nEnsure this new video logically continues the concepts or story without heavily repeating the previous video."

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Create a video script for this prompt: {prompt}"}
        ],
        response_format={ "type": "json_object" },
        temperature=0.7,
        max_tokens=1500
    )


    content = response.choices[0].message.content
    try:
        script_dict = json.loads(content)
        return VideoScript(**script_dict)
    except Exception as e:
        raise Exception(f"Failed to parse LLM structured output: {str(e)}\nRaw Output: {content}")
