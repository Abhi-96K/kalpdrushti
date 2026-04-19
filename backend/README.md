# Kalpdrushti AI - Backend ⚙️

The robust orchestration engine behind Kalpdrushti AI, built with FastAPI and Python. It is responsible for parsing requests, interacting with multiple AI endpoints seamlessly, and compositing final media assets.

## 🧠 AI Pipeline Modules

The `video_pipeline/` directory is the core of this service:

1. `script_generator.py`: Connects via OpenAI API format (supports OpenAI, NVIDIA, or other compatible endpoints) to generate a highly structured JSON script from a prompt.
2. `image_generator.py`: asynchronously requests Pollinations AI to render cinematic images defined in the JSON script.
3. `voice_generator.py`: Uses `edge-tts` to convert script lines into high-quality `.mp3` narrated audio, also outputting word-level `.vtt` subtitles.
4. `video_builder.py`: Uses `MoviePy` and `FFmpeg` to stitch the generated `.jpg` and `.mp3` files, overlays the `.vtt` files synced precisely to the audio, and outputs the final `.mp4` video.

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

The backend requires an LLM API key to generate scripts. Set one of these before running:

**Using OpenAI (Recommended):**

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_BASE_URL="https://api.openai.com/v1"
export LLM_MODEL="gpt-3.5-turbo"  # or gpt-4, etc.
```

**Using NVIDIA NIM (Alternative):**

```bash
export OPENAI_API_KEY="nvapi-..."
export OPENAI_BASE_URL="https://integrate.api.nvidia.com/v1"
export LLM_MODEL="meta/llama-3.3-70b-instruct"
```

### Run the Server

```bash
uvicorn main:app --reload --port 8000
```

API Documentation automatically available at `http://localhost:8000/docs`.
