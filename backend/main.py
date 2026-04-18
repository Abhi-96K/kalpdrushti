from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routers import generate, videos

app = FastAPI(title="Kalpadrushti AI: Video Generator API")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure media directories exist
os.makedirs("../media/images", exist_ok=True)
os.makedirs("../media/audio", exist_ok=True)
os.makedirs("../media/videos", exist_ok=True)

# Mount media directory so frontend can play finalized videos directly
app.mount("/media", StaticFiles(directory="../media"), name="media")

# Include Routers
app.include_router(generate.router)
app.include_router(videos.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Kalpadrushti AI API!"}
