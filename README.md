# Kalpdrushti AI 🎨🎥

Kalpdrushti is a full-stack AI web platform that converts a text prompt into a short animated video complete with generated scenes, AI voice narration, and synchronized subtitles.

## 🚀 Features
- **Prompt to Video:** Generate full videos from a single text prompt.
- **AI Scripting:** Uses Groq/Llama-3 to automatically break your prompt into structured scenes.
- **AI Image Generation:** Seamlessly integrates with Pollinations AI to generate high-quality visual frames.
- **Voice & Subtitles:** Automates voiceovers with perfectly synced VTT subtitles using `edge-tts`.
- **Beautiful UI:** A premium, glassmorphism-inspired React frontend for creating and managing your generated content.

## 🛠 Technology Stack
- **Frontend**: React (Vite), Vanilla CSS (Custom Design System, Glassmorphism), `lucide-react`
- **Backend**: FastAPI, SQLAlchemy (SQLite3), Python `asyncio`
- **AI Pipeline**:
  - **Scripting**: OpenAI API Client pointing to **Groq** endpoints (`llama-3.3-70b-versatile`).
  - **Images**: **Pollinations AI** (Free, fast, no auth token needed).
  - **Voice & Subtitles**: `edge-tts` (Free, Open-Source Microsoft Edge TTS interface).
  - **Video Assembly**: `MoviePy` with structured FFmpeg processing.

## 📁 Project Structure
```text
kalpdrushti/
├── backend/                    # FastAPI python server & AI pipeline
│   ├── main.py                 # API Entry point
│   ├── models/                 # SQLAlchemy DB & Pydantic Schemas
│   ├── routers/                # API Endpoints
│   └── video_pipeline/         # Core AI Orchestration (Script, Image, Voice, Assembly)
├── frontend/                   # Vite + React Web App
│   ├── src/                    # React UI components, pages, global CSS
│   └── package.json
└── media/                      # Generated Assets Directory (Auto-created by backend)
    ├── images/
    ├── audio/
    └── videos/
```

## 🚀 Installation & Setup

### 1. Requirements
Ensure you have installed:
- Node.js (v18+)
- Python 3.9+ 
- **FFmpeg** (Required by MoviePy for video rendering). Must be accessible in your system path.

### 2. Backend Setup
```bash
cd backend

# Create Virtual Environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install fastapi uvicorn moviepy edge-tts httpx openai sqlalchemy huggingface_hub

# Export necessary environment variables (Use a free Groq API Key)
export OPENAI_API_KEY="your-groq-api-key"
export OPENAI_BASE_URL="https://api.groq.com/openai/v1"
export LLM_MODEL="llama-3.3-70b-versatile"
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
```

## 🏃 Running the Application locally

Open two terminal windows.

**Terminal 1 (Backend - FastAPI)**:
```bash
cd backend
source venv/bin/activate
# Ensure environment variables are loaded
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend - Vite/React)**:
```bash
c
```

Navigate to `http://localhost:5173` in your browser. Enter a creative prompt, and watch your video get generated!







generate the video of a boy named as abhirath who is very smart looking & curious about his future & writing a story of sambhaji maharaj on paper the boy is handsome good loooking attractive & telling about the story which is going to be uploaded on youtube other platformi 
