# Kalpdrushti AI - Backend ⚙️

The robust orchestration engine behind Kalpdrushti AI, built with FastAPI and Python. It is responsible for parsing requests, interacting with multiple AI endpoints seamlessly, and compositing final media assets.

## 🧠 AI Pipeline Modules
The `video_pipeline/` directory is the core of this service:
1. `script_generator.py`: Connects to an OpenAI-compatible LLM endpoint to generate a highly structured JSON script from a prompt.
2. `image_generator.py`: asynchronously requests Pollinations AI to render cinematic images defined in the JSON script.
3. `voice_generator.py`: Uses `edge-tts` to convert script lines into high-quality `.mp3` narrated audio, also outputting synchronized `.srt` subtitles.
4. `video_builder.py`: Uses `MoviePy` and `FFmpeg` to stitch generated images and audio, burn readable subtitles into the video, mix background music, and output the final `.mp4` file.

## 📦 Requirements & Database
- The application uses `SQLAlchemy` with a local `SQLite` (`kalpadrushti.db`) for tracking user job statuses asynchronously.
- Ensure `FFmpeg` is globally installed on your host system as MoviePy relies heavily on it.

## 🚀 Setup & Execution

### Virtual Environment & Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn moviepy edge-tts httpx openai sqlalchemy huggingface_hub
```

### Environment Configuration
The backend needs an OpenAI-compatible LLM endpoint for text processing. You must export one of these configurations before running:
```bash
# Option A: NVIDIA NIM
export NVIDIA_API_KEY_LLM="your-nvidia-api-key"
export OPENAI_BASE_URL="https://integrate.api.nvidia.com/v1"
export LLM_MODEL="meta/llama-3.3-70b-instruct"

# Option B: Groq or another OpenAI-compatible provider
# export OPENAI_API_KEY="your-provider-api-key"
# export OPENAI_BASE_URL="https://api.groq.com/openai/v1"
# export LLM_MODEL="llama-3.3-70b-versatile"
```

### Run the Server
```bash
uvicorn main:app --reload --port 8000
```
API Documentation automatically available at `http://localhost:8000/docs`.
