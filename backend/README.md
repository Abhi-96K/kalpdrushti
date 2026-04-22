# Kalpdrushti AI Backend

This is the FastAPI service that powers script generation, image generation, voice generation, subtitle creation, video rendering, and media serving.

For the full project guide, see the root [README.md](../README.md).

## Backend Structure

```text
backend/
|-- main.py                    # FastAPI app, CORS, media mount, routers
|-- requirements.txt           # Python dependencies
|-- .env.example               # Environment template
|-- kalpadrushti.db            # Local SQLite DB, ignored by git
|-- models/
|   |-- database.py            # SQLAlchemy engine/session
|   |-- schemas.py             # DB model and response schemas
|-- routers/
|   |-- generate.py            # POST /generate and POST /abort/{id}
|   |-- payments.py            # Stripe Checkout session, verification, webhook
|   |-- videos.py              # GET /videos and GET /videos/{id}
|-- video_pipeline/
|   |-- orchestrator.py        # Pipeline coordinator and status updates
|   |-- script_generator.py    # Prompt to structured scene script
|   |-- image_generator.py     # Scene image generation and enhancement
|   |-- voice_generator.py     # Narration MP3 and subtitle generation
|   |-- video_builder.py       # MoviePy render, subtitles, scene motion, music
```

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Install FFmpeg separately and make sure it is available:

```bash
ffmpeg -version
```

## Run

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open:

- `http://localhost:8000`
- `http://localhost:8000/docs`

## Pipeline

1. `POST /generate` creates a job in SQLite.
2. `orchestrator.py` generates a script from the prompt.
3. Scene images and narration are generated.
4. Subtitle files are created beside the voice files.
5. `video_builder.py` renders the final MP4 with movement, subtitles, narration, and background music.
6. The job is marked `completed` and receives a `/media/videos/{id}.mp4` URL.

## Environment

Copy `.env.example` to `.env` and configure only the providers you need.

### Script Generation

Groq example:

```bash
LLM_PROVIDER="groq"
GROQ_API_KEY="your-groq-api-key"
LLM_MODEL="llama-3.3-70b-versatile"
```

OpenAI-compatible example:

```bash
LLM_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-4o-mini"
```

### Image Generation

Pollinations is the default free provider:

```bash
IMAGE_PROVIDER="pollinations"
IMAGE_MODEL="flux"
POLLINATIONS_MAX_CONCURRENCY="1"
POLLINATIONS_REQUEST_DELAY_SECONDS="3.5"
```

For higher-quality paid image generation:

```bash
IMAGE_PROVIDER="openai"
OPENAI_IMAGE_API_KEY="sk-..."
OPENAI_IMAGE_MODEL="gpt-image-1.5"
IMAGE_QUALITY="high"
```

### Voice

Edge TTS supports rate, pitch, and volume configuration:

```bash
EDGE_TTS_RATE="+0%"
EDGE_TTS_PITCH="+5Hz"
EDGE_TTS_VOLUME="+0%"
```

Use pitch units like `Hz`; percent pitch values such as `+5%` are invalid for Edge TTS.

### Video Quality

```bash
VIDEO_FPS="30"
VIDEO_PRESET="medium"
VIDEO_BITRATE="12M"
VIDEO_AUDIO_BITRATE="192k"
```

### Background Music

```bash
BACKGROUND_MUSIC_ENABLED="true"
BACKGROUND_MUSIC_SOURCE="auto"
BACKGROUND_MUSIC_VOLUME="0.11"
BACKGROUND_MUSIC_SYNTH_FPS="44100"
```

`BACKGROUND_MUSIC_SOURCE` options:

- `auto`: use a matching file from `media/audio/bg_music`; if none exists, synthesize music.
- `files`: only use files from `media/audio/bg_music`.
- `procedural`: always synthesize mood-aware instrumental music.
- `off`: disable background music.

Mood matching supports emotional, excited, inspirational, suspense, calm, and educational videos. Custom track names should include the mood, for example:

```text
media/audio/bg_music/emotional_piano.mp3
media/audio/bg_music/excited_tech.mp3
media/audio/bg_music/calm_soft_pad.mp3
```

### Payments

Stripe Checkout powers the Premium and Studio upgrades:

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="http://localhost:5173"
```

Optional Stripe Price IDs let you manage products/prices in Stripe Dashboard:

```bash
STRIPE_PREMIUM_PRICE_ID="price_..."
STRIPE_STUDIO_PRICE_ID="price_..."
```

If the Price IDs are blank, the backend creates monthly subscription line items from the hardcoded demo plan amounts. In production, use real Price IDs and configure a Stripe webhook endpoint pointing to:

```text
https://your-backend-domain.com/payments/webhook
```

## API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/generate` | Start a video job. |
| `POST` | `/abort/{video_id}` | Request job cancellation. |
| `POST` | `/payments/checkout` | Create a Stripe Checkout Session for Premium or Studio. |
| `GET` | `/payments/checkout-session/{session_id}` | Verify a returned Stripe Checkout Session. |
| `POST` | `/payments/webhook` | Receive Stripe payment/subscription events. |
| `GET` | `/videos` | List jobs for dashboard history. |
| `GET` | `/videos/{video_id}` | Poll one job status. |

## Generated Media

The backend writes generated files to the project-level `media/` folder:

```text
../media/images/        # Scene images
../media/audio/         # Narration and subtitle files
../media/audio/bg_music # Reusable custom music tracks
../media/videos/        # Final MP4 files
```

The folder is ignored by git. Keep reusable music in `media/audio/bg_music` and clean old generated outputs when they are no longer needed.

## Verification

```bash
cd backend
source venv/bin/activate
python -m py_compile main.py video_pipeline/*.py
```

If a render fails, first verify FFmpeg, then check the backend terminal for the failed status stage.
