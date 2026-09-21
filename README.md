s# SkillPath – AI Skill Gap Analyzer

A modern, full-stack **MERN + Google OAuth + Socket.io** career-tech platform:

**Profile → Resume → Skills → Target Job → AI Analysis → Skill Gap → Roadmap → Learn → Track Progress → Job Ready**

## ✨ What's included

| Area | Features 
|---|---|
| Public pages | Home, Features, How It Works, About + 404 |
| Auth (double-box UI) | Email/password login with **email 2FA (OTP)**, real **Google Sign-In** (Google Identity Services), OTP-based forgot/reset password, logout |
| User dashboard | Readiness score, total skills, gaps, learning progress, completed courses, XP, target role, charts, AI insights, recommendations |
| Sidebar (10) | Dashboard, Profile, Skills, Skill Gap Analysis, Learning Roadmap, Courses, Projects, Certifications, Progress, Settings |
| Skills | Add/edit tech + soft skills with levels, resume upload (PDF/TXT) with AI skill extraction |
| Gap analysis | Current vs required, missing / weak / strong, gap %, readiness score, history chart, re-analyze with improvement delta |
| Roadmap | Foundation → Frontend → Backend → Database → Advanced → Deployment (adapts per track), difficulty, est. hours, mark complete → XP + auto skill-up |
| Learning | Courses, Projects, Certifications catalogs with search + completion tracking |
| Realtime | Socket.io notifications (analysis done, XP, roadmap, admin broadcasts) + bell, unread badge, toasts |
| Extras | Light/dark/system **theme changer**, avatar upload, URL routing + protected + admin routes, loaders, empty states, validation |
| Admin panel | Admin-only sidebar, users, job roles, skills, courses, projects, certifications, resources and announcements; no user dashboard is shown in admin mode |
| AI service | Offline weighted engine (aliases, partial credit, prioritized roadmap, matched recommendations) + optional Gemini/OpenAI insights — keys stay on backend |

## 🗂 Project structure

```
skillpath/
├── backend/                    # Express + Mongoose + Socket.io
│   ├── server.js               # app + realtime wiring
│   ├── .env                    # config (see .env.example)
│   ├── uploads/                # avatars + resumes (served statically)
│   └── src/
│       ├── config/  db.js  google.js
│       ├── models/  index.js            # User Skill JobRole Course Project Certification Resource Analysis Roadmap Progress Notification
│       ├── middleware/  auth.js (app JWT, adminOnly)  upload.js
│       ├── services/  aiService.js  notify.js  mailer.js  (OTP emails)
│       ├── controllers/  auth (login 2FA, Google, OTP reset), catalog, learning, admin
│       ├── routes/  index.js
│       └── utils/  seed.js  memstore.js
└── frontend/                   # React 18 + Vite + Router
    └── src/
        ├── config/google.js    # Google Identity Services loader
        ├── services/api.js     # axios + token interceptor
        ├── context/  AuthContext  ThemeContext  SocketContext
        ├── components/  layout  ui (charts)  ProtectedRoute  GoogleSignInButton
        └── pages/  Public  Legal (Privacy/Terms, downloadable PDF)  Auth  Dashboard
                    Profile  Skills  GapAnalysis  Roadmap  Catalog  Progress  Settings  Admin
```

## 🚀 Quick start (already running in this workspace)

```bash
# Terminal 1 — backend (http://localhost:5000)
cd skillpath/backend
npm install
npm start            # or: npm run dev (auto-reload)

# Terminal 2 — frontend (http://localhost:5173)
cd skillpath/frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Admin login (seeded automatically):

- Admin credentials are controlled by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` (or the seeded defaults in `src/utils/seed.js`). Visit `/admin`.

Sign up for a regular account from the **Sign Up** page, or use **Continue with Google** once Google Sign-In is configured (below). Manual (email/password) logins always require a 6-digit code emailed to you — see **Email & 2FA** below.

> No MongoDB running? The backend auto-falls back to an in-memory store (seeded with 8 roles, 35 skills, 16 courses…) so everything works. Start MongoDB to persist — see below.

## 🍃 MongoDB with Compass (recommended)

1. Install **MongoDB Community Server** + **MongoDB Compass**.
2. Start the server (default `mongodb://127.0.0.1:27017`).
3. In `backend/.env`, keep `MONGO_URI=mongodb://127.0.0.1:27017/skillpath`.
4. Restart backend → collections auto-seed on first boot (`SEED_ON_BOOT=true`).
5. Open Compass → connect to `mongodb://127.0.0.1:27017` → browse the `skillpath` database.

Atlas alternative: set `MONGO_URI=mongodb+srv://<user>:<pass>@cluster…/skillpath`.

## 🔑 Google Sign-In (Google Identity Services)

No Firebase involved — the frontend renders Google's own button and the backend verifies the resulting ID token directly with Google.

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth client ID** → Application type **Web application**.
2. Add `http://localhost:5173` under **Authorized JavaScript origins** (and your production domain later).
3. Copy the **Client ID** and set it in **both**:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...` (must be the same value)
4. Restart both servers — you'll see `✅ Google Sign-In configured` in the backend logs, and a real "Sign in with Google" button on the Login/Signup pages.

Without this, the Google button shows a small "not configured yet" note and manual email/password signup still works fully.

## ✉️ Email & Two-Factor Login (OTP)

Manual (email/password) login always requires a 6-digit code emailed to the user, and Forgot Password also sends a 6-digit code instead of a link.

1. Set SMTP credentials in `backend/.env` — either `SMTP_SERVICE` (e.g. `gmail`, with an **app password**, not your normal password) or generic `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`.
2. Restart the backend. Codes are now delivered by real email.
3. If SMTP isn't set up yet, codes are printed to the backend console **and** returned in the API response (`devOtp`) so login/reset keep working end-to-end during development — the login/OTP screens will show the code on-screen in that case. Set `EXPOSE_OTP_IN_RESPONSE=false` once SMTP is live (recommended before deploying).

## 📄 Privacy Policy & Terms (footer)

`/privacy-policy` and `/terms-and-conditions` are real pages linked from the footer's **Legal** column. Each has a **Download PDF** button (generated client-side with `jsPDF`) so visitors can save a copy.

## 🤖 AI keys (optional)

The analyzer works fully offline. For LLM-generated tips add to `backend/.env`:

```
GEMINI_API_KEY=…   # and/or
OPENAI_API_KEY=…
```

## 🔌 REST API map

```
POST /api/auth/register|login|google|sync|forgot|reset   GET /api/auth/me
PUT  /api/auth/profile   POST /api/auth/avatar   POST /api/auth/resume
GET  /api/auth/notifications ...
POST /api/skills   DELETE /api/skills/:name
POST /api/analysis   GET /api/analysis/latest|history
GET|POST /api/roadmap   PATCH /api/roadmap/task
GET /api/progress   POST /api/progress/complete   GET /api/dashboard
GET /api/skills|job-roles|courses|projects|certifications|resources (+ /:id)
GET /api/admin/stats|users   PATCH|DELETE /api/admin/users/:id
POST /api/admin/announce   + CRUD /api/admin/<entity>[/:id]
```

Realtime: client `socket.emit('join', email)` → server emits `notification`.

## 🌐 Deploy notes

- **Frontend**: `npm run build` → Vercel/Netlify (`VITE_API_URL=https://your-api…/api`, `VITE_SOCKET_URL=https://your-api…`).
- **Backend**: Render/Railway/VPS (`MONGO_URI` = Atlas, `CLIENT_URL` = frontend URL, strong `APP_JWT_SECRET`).
- Serve `uploads/` via object storage (S3/Cloudinary) in production.

## 🧪 Try the full loop

1. Sign up → upload avatar → set target role (Profile).
2. Upload resume or add skills (Skills).
3. Run AI Analysis → see score, gaps, recommendations (Gap Analysis).
4. Generate roadmap → complete tasks → earn XP (Roadmap).
5. Finish a course/project (Catalog) → watch timeline (Progress).
6. Re-analyze → readiness climbs ▲. Login as admin → `/admin` → broadcast to all users live.
