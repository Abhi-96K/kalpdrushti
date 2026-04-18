import httpx
import asyncio
import os

HF_TOKEN = os.environ.get("HF_API_KEY")
if not HF_TOKEN:
    raise RuntimeError("Set HF_API_KEY before running this script.")

async def test_api(name, url_template, is_post=False, headers=None, json_data=None):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url_template, headers=headers, json=json_data)

            print(f"[{name}] Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"[{name}] SUCCESS! Content type: {resp.headers.get('content-type')}")
                with open(f"{name.replace(' ', '_')}.jpg", "wb") as f:
                    f.write(resp.content)
                return True
            else:
                print(f"[{name}] FAILED: {resp.text[:100]}")
                return False
    except Exception as e:
        print(f"[{name}] ERROR: {e}")
        return False

async def main():
    prompt = "A beautiful cinematic image of a cat"

    # HF FLUX with parameters
    await test_api("HF FLUX with params",
        "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
        is_post=True,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json_data={
            "inputs": prompt,
            "parameters": {
                "width": 1024,
                "height": 576
            }
        }
    )

if __name__ == "__main__":
    asyncio.run(main())
