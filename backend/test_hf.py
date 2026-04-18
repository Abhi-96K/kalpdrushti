from huggingface_hub import InferenceClient
import os

HF_API_KEY = os.environ.get("HF_API_KEY")
if not HF_API_KEY:
    raise RuntimeError("Set HF_API_KEY before running this script.")

client = InferenceClient(token=HF_API_KEY)

try:
    print("Generating...")
    image = client.text_to_image("A futuristic robot", model="runwayml/stable-diffusion-v1-5")
    image.save("test_robot.png")
    print("Success!")
except Exception as e:
    print("Error:", repr(e))
