# Kalpdrushti AI Frontend

This is the React/Vite web app for Kalpdrushti AI. It provides the landing page, authentication screen, prompt creation flow, processing screen, result playback, dashboard history, profile, premium page, and about page.

For the full project guide, see the root [README.md](../README.md).

## Frontend Structure

```text
frontend/
|-- package.json               # NPM scripts and dependencies
|-- vite.config.js             # Vite config
|-- vercel.json                # SPA fallback routing for Vercel
|-- .env.example               # Frontend environment template
|-- public/
|   |-- favicon.svg
|-- src/
|   |-- main.jsx               # React entry point
|   |-- App.jsx                # Route definitions and layout shell
|   |-- index.css              # Global styling and responsive UI
|   |-- components/
|   |   |-- Header.jsx         # Navigation, login/logout state
|   |   |-- Footer.jsx
|   |   |-- ProtectedRoute.jsx # Login guard for dashboard
|   |-- pages/
|   |   |-- Landing.jsx        # Home page
|   |   |-- Auth.jsx           # Login page
|   |   |-- CreatePrompt.jsx   # Prompt form and generation request
|   |   |-- Processing.jsx     # Job polling and progress UI
|   |   |-- Result.jsx         # Generated video player and download
|   |   |-- Dashboard.jsx      # Video history, protected in frontend
|   |   |-- About.jsx
|   |   |-- Premium.jsx
|   |   |-- Profile.jsx
|   |-- utils/
|       |-- auth.js            # Local auth state helpers
|       |-- oauth.js           # Google and Apple OAuth helpers
```

## Requirements

- Node.js `20.19.0+` or `22.12.0+`.
- Running backend at `http://localhost:8000` or a configured deployed API URL.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

For local development:

```bash
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
VITE_APPLE_CLIENT_ID=
VITE_APPLE_REDIRECT_URI=https://your-domain.com/auth
```

## Run

```bash
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

To use an exact host and port:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Host and port must be separate flags. Do not use `--host 127.0.0.1:5173`.

## Build

```bash
npm run build
npm run preview
```

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Landing | Main entry page. |
| `/auth` | Auth | Google, Apple, and local demo login UI. |
| `/create` | CreatePrompt | Sends `POST /generate` to backend. |
| `/processing/:id` | Processing | Polls `GET /videos/{id}`. |
| `/result/:id` | Result | Plays final MP4 from backend media URL. |
| `/dashboard` | Dashboard | Protected by `ProtectedRoute`. |
| `/profile` | Profile | Signed-in user profile UI. |
| `/premium` | Premium | Pricing/upgrade page. |
| `/about` | About | Product information page. |

## Backend Connection

The app reads `VITE_API_URL` at build time.

- If unset, page code falls back to `http://localhost:8000`.
- For deployment, set `VITE_API_URL` to your hosted backend, for example `https://your-api.example.com`.

Pages that call the backend:

- `CreatePrompt.jsx`: `POST /generate`
- `Processing.jsx`: `GET /videos/{id}`, `POST /abort/{id}`
- `Result.jsx`: `GET /videos/{id}`
- `Dashboard.jsx`: `GET /videos`
- `Premium.jsx`: `POST /payments/checkout`, `GET /payments/checkout-session/{session_id}`

## Authentication Notes

The frontend currently stores signed-in user state locally for the UI and protects the dashboard route on the client side. This is enough for local testing, but not enough for real production security.

Before production:

- Verify Google/Apple OAuth tokens on the backend.
- Create real backend sessions or signed app tokens.
- Add per-user ownership checks to video history APIs.
- Keep client secrets out of frontend code.

## OAuth Setup

### Google

Set:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

In Google Cloud Console, authorize the exact origin you open in the browser:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Restart Vite after changing `.env`.

### Apple

Set:

```bash
VITE_APPLE_CLIENT_ID=your-apple-services-id
VITE_APPLE_REDIRECT_URI=https://your-domain.com/auth
```

Apple web sign-in requires a registered HTTPS redirect URI. Normal localhost redirect URIs are not accepted for production-style Apple web login.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Vite server. |
| `npm run build` | Build production frontend. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
