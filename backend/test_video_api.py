import httpx
import asyncio
import os

HF_TOKEN = os.environ.get("HF_API_KEY")
if not HF_TOKEN:
    raise RuntimeError("Set HF_API_KEY before running this script.")

async def test_video_api(name, model_id, prompt):
    url = f"https://router.huggingface.co/hf-inference/models/{model_id}"
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {"inputs": prompt}

    try:
        print(f"[{name}] Starting generation...")
        async with httpx.AsyncClient(timeout=180.0) as client: # Video takes longer
            resp = await client.post(url, headers=headers, json=payload)

            print(f"[{name}] Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"[{name}] SUCCESS! Content type: {resp.headers.get('content-type')}")
                ext = "mp4" if "mp4" in resp.headers.get('content-type', '') else "gif"
                with open(f"test_video_{name.replace(' ', '_')}.{ext}", "wb") as f:
                    f.write(resp.content)
                return True
            else:
                print(f"[{name}] FAILED: {resp.text[:200]}")
                return False
    except Exception as e:
        print(f"[{name}] ERROR: {e}")
        return False

async def main():
    prompt = "A robot walking down a futuristic street, highly detailed, smooth motion"

    # Test common HF video models
    models_to_test = {
        "Zeroscope": "cerspense/zeroscope_v2_576w",
        "MS Text2Video": "ali-vilab/text-to-video-ms-1.7b",
        "AnimateDiff": "ByteDance/AnimateDiff-Lightning"
    }

    for name, model_id in models_to_test.items():
        await test_video_api(name, model_id, prompt)

if __name__ == "__main__":
    asyncio.run(main())
