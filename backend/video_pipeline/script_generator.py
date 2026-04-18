import os
import json
from openai import AsyncOpenAI
from models.schemas import VideoScript

# Default NIM Llama 3 API endpoint
OPENAI_API_KEY = os.environ.get("NVIDIA_API_KEY_LLM") or os.environ.get("OPENAI_API_KEY")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1")
MODEL_NAME = os.environ.get("LLM_MODEL", "meta/llama-3.3-70b-instruct")

client = AsyncOpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL) if OPENAI_API_KEY else None

SYSTEM_PROMPT = """
You are a highly creative writer and director for short videos.
The user will give you a prompt. You must convert it into a structured sequence of scenes. Keep the story tight: use 4-7 scenes for most short videos, and only use more when the prompt genuinely needs it.

YOUR INSTRUCTIONS:
1. AUDIO TARGET LANGUAGE: The narration *MUST ENTIRELY BE WRITTEN* in the '{language}' language! The image settings/actions MUST REMAIN IN ENGLISH.
2. EDUCATIONAL/CODING TOPICS: If the prompt is teaching programming (e.g. Java, Python) or tech concepts, YOU MUST:
   - Ensure the 'setting' and 'action' explicitly describe computer screens, IDEs, code editors, and terminal windows in a realistic, non-animated photography style.
   - Include real code snippets in the 'action' or 'setting' for context, but do not depend on the image model to render tiny readable text.
   - Visualize expected output as large, simple screens or presenter gestures. Put exact explanations and wording in narration.
3. Create highly engaging, cinematic scene flows.

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

async def generate_script(prompt: str, previous_context: str = None, language: str = "English") -> VideoScript:
    """
    Calls the LLM to generate a structured script from a text prompt.
    Returns a Pydantic VideoScript object.
    """
    if client is None:
        raise RuntimeError(
            "Missing LLM API key. Set NVIDIA_API_KEY_LLM or OPENAI_API_KEY before starting the backend."
        )

    system_prompt = SYSTEM_PROMPT.replace("{language}", language)
    if previous_context:
        system_prompt += f"\n\nIMPORTANT CONTEXT:\nThe user is creating this video as part of an ongoing series. The PREVIOUS video's script was exactly this: {previous_context}\nEnsure this new video logically continues the concepts or story without heavily repeating the previous video."

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Create a video script for this prompt: {prompt}"}
        ],
        response_format={ "type": "json_object" },
        temperature=0.65,
        max_tokens=3000
    )


    content = response.choices[0].message.content
    try:
        script_dict = json.loads(content)
        return VideoScript(**script_dict)
    except Exception as e:
        raise Exception(f"Failed to parse LLM structured output: {str(e)}\nRaw Output: {content}")
