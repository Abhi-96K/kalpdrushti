# Kalpdrushti AI

Kalpdrushti AI is a full-stack AI video generation app. A user writes a prompt, selects video settings, and the backend turns that prompt into a short generated video with structured scenes, cinematic images, narrated voice, subtitles, motion effects, and mood-aware background music.

The project is split into a React/Vite frontend, a FastAPI backend, and a shared `media/` workspace for generated assets.

## Main Features

- Prompt-to-video generation from the Create page.
- AI script generation with scene-by-scene structure.
- Image generation through Pollinations by default, with optional OpenAI image generation.
- Edge TTS narration with generated subtitle files.
- MoviePy/FFmpeg video rendering with movement, subtitles, voice, and music.
- Mood-aware instrumental background music for emotional, excited, calm, suspenseful, inspirational, and educational videos.
- Google and Apple login button flows on the frontend.
- Logged-in-only dashboard route on the frontend.
- Dashboard history of generated video jobs.
- Downloadable generated MP4 files.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, vanilla CSS, lucide-react |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic |
| Script generation | OpenAI-compatible chat APIs such as Groq, OpenAI, xAI/Grok, or Gemini-compatible configuration |
| Images | Pollinations by default, optional OpenAI image API |
| Voice | edge-tts |
| Video | MoviePy and FFmpeg |
| Storage | Local SQLite database and local filesystem media folders |

## Project Structure

```text
kalpdrushti/
|-- README.md                         # Main project documentation
|-- .gitignore                        # Ignores secrets, deps, generated media, caches
|-- backend/
|   |-- README.md                     # Backend-specific guide
|   |-- .env.example                  # Backend environment template
|   |-- requirements.txt              # Python dependencies
|   |-- main.py                       # FastAPI app, CORS, media mount, routers
|   |-- kalpadrushti.db               # Local SQLite DB, ignored by git
|   |-- models/
|   |   |-- database.py               # SQLAlchemy engine/session
|   |   |-- schemas.py                # DB model and Pydantic response models
|   |-- routers/
|   |   |-- generate.py               # /generate and /abort endpoints
|   |   |-- videos.py                 # /videos and /videos/{id} endpoints
|   |-- video_pipeline/
|   |   |-- orchestrator.py           # Full pipeline coordinator
|   |   |-- script_generator.py       # Prompt to structured script
|   |   |-- image_generator.py        # Scene image generation and enhancement
|   |   |-- voice_generator.py        # Narration and subtitle generation
|   |   |-- video_builder.py          # Final video render, subtitles, music
|-- frontend/
|   |-- README.md                     # Frontend-specific guide
|   |-- .env.example                  # Frontend environment template
|   |-- package.json                  # NPM scripts and dependencies
|   |-- vite.config.js                # Vite config
|   |-- vercel.json                   # Vercel SPA routing config
|   |-- public/
|   |   |-- favicon.svg
|   |-- src/
|   |   |-- App.jsx                   # Routes and layout shell
|   |   |-- main.jsx                  # React entry point
|   |   |-- index.css                 # Global design system and page styles
|   |   |-- components/
|   |   |   |-- Header.jsx            # Nav, login/logout state
|   |   |   |-- Footer.jsx
|   |   |   |-- ProtectedRoute.jsx    # Dashboard access guard
|   |   |-- pages/
|   |   |   |-- Landing.jsx
|   |   |   |-- Auth.jsx
|   |   |   |-- CreatePrompt.jsx
|   |   |   |-- Processing.jsx
|   |   |   |-- Result.jsx
|   |   |   |-- Dashboard.jsx
|   |   |   |-- About.jsx
|   |   |   |-- Premium.jsx
|   |   |   |-- Profile.jsx
|   |   |-- utils/
|   |       |-- auth.js               # Local browser auth state helpers
|   |       |-- oauth.js              # Google/Apple OAuth launch helpers
|-- media/
|   |-- images/                       # Generated scene images, ignored by git
|   |-- audio/                        # Narration/subtitles, ignored by git
|   |   |-- bg_music/                 # Optional custom background music
|   |-- videos/                       # Final MP4 files, ignored by git
```

## How The Pipeline Works

1. The frontend submits a `multipart/form-data` request to `POST /generate`.
2. The backend creates a database job row with `pending` status.
3. `orchestrator.py` updates status to `generating_script` and builds a structured script.
4. Images and narration are generated for each scene.
5. Subtitles are written beside the generated narration files.
6. `video_builder.py` renders the final MP4 with motion, subtitles, voice, and background music.
7. The database job is marked `completed` and receives a `/media/videos/{id}.mp4` URL.
8. The frontend polls `GET /videos/{id}` from the Processing page until the job finishes.

## Requirements

- Python 3.10 or newer.
- Node.js `20.19.0+` or `22.12.0+` because the installed Vite version requires it.
- FFmpeg installed and available in your terminal path.
- At least one LLM API key for script generation.
- Internet access for hosted AI services and OAuth flows.

Check FFmpeg:

```bash
ffmpeg -version
```

## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set your preferred LLM provider.

Groq example:

```bash
LLM_PROVIDER="groq"
GROQ_API_KEY="your-groq-api-key"
LLM_MODEL="llama-3.3-70b-versatile"
```

Run the backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Backend URLs:

- API root: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Media files: `http://localhost:8000/media/...`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

For local backend development, set this in `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
VITE_APPLE_CLIENT_ID=
VITE_APPLE_REDIRECT_URI=https://your-domain.com/auth
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

To force an exact host and port:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Do not pass host and port as one value like `--host 127.0.0.1:5173`; Vite treats that as a hostname and DNS lookup fails.

## Environment Variables

### Backend

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` | Script provider selector: `groq`, `openai`, `grok`, or `gemini` depending on code support. |
| `GROQ_API_KEY` | Groq API key when using Groq. |
| `OPENAI_API_KEY` | OpenAI-compatible API key for script generation. |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible base URL. |
| `LLM_MODEL` | Chat model used by script generation. |
| `IMAGE_PROVIDER` | `pollinations` or `openai`. |
| `IMAGE_MODEL` | Pollinations model name such as `flux`. |
| `IMAGE_QUALITY` | Image quality hint used by supported providers. |
| `OPENAI_IMAGE_API_KEY` | OpenAI image key when `IMAGE_PROVIDER=openai`. |
| `OPENAI_IMAGE_MODEL` | OpenAI image model name. |
| `IMAGE_MAX_RETRIES` | Retry count for image generation failures. |
| `POLLINATIONS_MAX_CONCURRENCY` | Keeps Pollinations requests controlled to reduce 429 errors. |
| `POLLINATIONS_REQUEST_DELAY_SECONDS` | Delay between public image API calls. |
| `VIDEO_FPS` | Final MP4 frame rate. |
| `VIDEO_PRESET` | FFmpeg encoding preset. |
| `VIDEO_BITRATE` | Final video bitrate. |
| `VIDEO_AUDIO_BITRATE` | Final audio bitrate. |
| `BACKGROUND_MUSIC_ENABLED` | Enables or disables background music. |
| `BACKGROUND_MUSIC_SOURCE` | `auto`, `files`, `procedural`, or `off`. |
| `BACKGROUND_MUSIC_VOLUME` | Background music volume under narration. |
| `BACKGROUND_MUSIC_SYNTH_FPS` | Sample rate for generated instrumental music. |
| `EDGE_TTS_RATE` | Voice speed adjustment. |
| `EDGE_TTS_PITCH` | Voice pitch adjustment, for example `+5Hz`. |
| `EDGE_TTS_VOLUME` | Voice volume adjustment. |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend URL. Defaults to `http://localhost:8000` in code if unset. |
| `VITE_GOOGLE_CLIENT_ID` | Public Google OAuth web client ID. |
| `VITE_APPLE_CLIENT_ID` | Apple Services ID. |
| `VITE_APPLE_REDIRECT_URI` | HTTPS redirect URI registered with Apple. |

Never store OAuth client secrets in the frontend. Frontend environment variables are public after build. Keep secrets in backend `.env` files or hosting secret managers.

## OAuth Notes

The Google button opens a real Google account permission flow only when `VITE_GOOGLE_CLIENT_ID` is configured and the exact browser origin is authorized in Google Cloud Console.

For local testing, authorize the exact origin you use:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Apple Sign in requires an Apple Developer Services ID and an HTTPS redirect URI. Apple does not support normal `localhost` redirect URIs for production-style web flows.

The current frontend stores the signed-in profile in browser storage for UI state. Before production, verify OAuth tokens on the backend and create a real server-side session or signed application token.

## API Reference

### `POST /generate`

Starts a video generation job.

Form fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `prompt` | string | yes | User prompt for the video. |
| `voice` | string | no | Edge TTS voice, default `en-US-ChristopherNeural`. |
| `series_name` | string | no | Reuses prior completed script context for the same series. |
| `file` | upload | no | Optional uploaded image used for all scenes. |
| `aspect_ratio` | string | no | Example: `9:16`, `16:9`, `1:1`. |
| `duration` | string | no | UI label such as `Medium (~30s)`. |
| `use_real_video` | boolean | no | Passed into the renderer for real-video behavior. |

Returns a job object with `id`, `status`, `prompt`, and `created_at`.

### `GET /videos`

Returns all video jobs for the dashboard, newest first.

### `GET /videos/{video_id}`

Returns one job status, including `video_url` when complete.

### `POST /abort/{video_id}`

Requests cancellation for a running job.

## Job Status Values

- `pending`
- `generating_script`
- `generating_images`
- `generating_audio`
- `rendering_video`
- `completed`
- `failed`
- `abort_requested`
- `aborted`

## Background Music

The renderer detects the mood from the generated script text and chooses a matching instrumental style. Supported moods are:

- `emotional`
- `excited`
- `inspirational`
- `suspense`
- `calm`
- `educational`

With `BACKGROUND_MUSIC_SOURCE="auto"`, the backend first searches `media/audio/bg_music` for a matching music file. If no good match is found, it generates a procedural instrumental track and syncs it to the video duration and scene boundaries.

Recommended custom music names:

```text
media/audio/bg_music/emotional_piano.mp3
media/audio/bg_music/excited_tech.mp3
media/audio/bg_music/calm_soft_pad.mp3
media/audio/bg_music/inspirational_cinematic.mp3
media/audio/bg_music/suspense_dark_pulse.mp3
media/audio/bg_music/educational_clean.mp3
```

## Generated Files

Generated assets are stored outside the app source:

```text
media/images/        # Scene JPG files
media/audio/         # Narration MP3 and subtitle files
media/audio/bg_music # Custom reusable background tracks
media/videos/        # Final MP4 files
```

These files are ignored by git so local generations do not pollute commits. Keep reusable music in `media/audio/bg_music`; clean old generated files manually when you no longer need them.

## Common Commands

Backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
python -m py_compile main.py video_pipeline/*.py
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Cleanup local caches:

```bash
find backend frontend media \( -path 'backend/venv' -o -path 'frontend/node_modules' \) -prune -o -type d -name '__pycache__' -exec rm -rf {} +
find backend frontend media -name '.DS_Store' -delete
```

## Deployment Notes

Frontend:

- Build with `npm run build`.
- Set `VITE_API_URL` to your deployed backend URL.
- Set the production OAuth origin in Google Cloud Console.
- Use `frontend/vercel.json` for SPA fallback routing on Vercel.

Backend:

- Install `requirements.txt`.
- Install FFmpeg on the host.
- Configure `.env` values as hosting secrets.
- Make sure the host has writable storage for `media/` and the SQLite database, or migrate to managed storage/database before serious production use.
- Restrict CORS origins in `backend/main.py` before public deployment.

## Production Security Checklist

- Do not commit `.env` files or API secrets.
- Do not put client secrets in frontend code.
- Verify Google/Apple tokens on the backend.
- Replace local browser auth with backend sessions or signed tokens.
- Restrict CORS to your real frontend domain.
- Move from local SQLite/filesystem storage to production storage if multiple users need reliable history.
- Add per-user ownership checks to `/videos` and `/videos/{id}` before exposing real user data.

## Troubleshooting

### Vite says `getaddrinfo ENOTFOUND 127.0.0.1:5173`

Use separate host and port flags:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

### Google login does not open the account permission screen

Check that `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env`, then restart Vite. Also make sure the exact local origin is authorized in Google Cloud Console.

### Apple login does not work on localhost

Apple web sign-in needs a registered HTTPS redirect URI. Use a real HTTPS domain or a secure tunnel configured in Apple Developer.

### Image generation returns HTTP 429

The public Pollinations endpoint is rate-limited. Keep concurrency low, increase `POLLINATIONS_REQUEST_DELAY_SECONDS`, retry later, or switch to `IMAGE_PROVIDER="openai"` for a paid provider.

### Voice generation fails with invalid pitch

Use Edge TTS pitch units like `+5Hz`, not percent values like `+5%`.

### Video render fails

Confirm FFmpeg is installed and available:

```bash
ffmpeg -version
```

Then check the backend terminal logs for the exact pipeline stage that failed.
