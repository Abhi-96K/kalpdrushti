# Kalpdrushti AI - Frontend 🎨

The user interface for Kalpdrushti AI, built with React and Vite. It provides a premium, glassmorphism-styled experience for users to interact with the underlying AI video generation pipeline.

## 🌟 Key Views

- **Landing Page:** Animated mesh gradient and introduction.
- **Create Page:** Input area for the creative text prompt.
- **Processing Page:** Real-time polling to dynamically show the progress of AI processing (Scripting → Audio/Images → Video Assembly).
- **Video Result Page:** Native HTML5 player with immediate download capability.
- **Dashboard:** Tracking of historical and previously generated videos.

## 🛠 Tech Stack

- **Framework:** React 18, Vite
- **Routing:** React Router DOM
- **Styling:** Vanilla CSS (`index.css` for a global custom design system without Tailwind bloat)
- **Icons:** `lucide-react`

## 🚀 Quick Start

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Run Development Server:**

   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## 🔗 Connection to Backend

The frontend reads the backend address from `VITE_API_URL` at build time.

- Local development: leave `VITE_API_URL` unset and the frontend will use `http://localhost:8000`.
- Production deployment: set `VITE_API_URL=https://kalpdrushti.onrender.com` in Vercel or your hosting environment.

To use this locally, copy `frontend/.env.example` to `frontend/.env` and update the backend URL if needed.
