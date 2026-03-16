<div align="center">

<img width="1200" height="475" alt="AURA AI — Gemini Live Agent" src="https://github.com/Archiusx/AURA_AI-Gemini-live-agent-/blob/main/WhatsApp%20Image%202026-03-16%20at%2015.46.41.jpeg" />

<br/>
<br/>

<h1>🤖 AURA AI — Gemini Live Multimodal Agent</h1>

<p><em>Talk naturally. Interrupt anytime. Show your camera. Get instant AI responses.</em><br/>
A real-time multimodal live agent powered by <strong>Google Gemini 2.5 Flash Live API</strong>.</p>

<br/>

[![Live on AI Studio](https://img.shields.io/badge/View%20in-AI%20Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.studio/apps/e913dc76-2f80-4cad-a016-b0e8a1f36e4e)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash%20Live-34A853?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Deployed on Cloud Run](https://img.shields.io/badge/Hosted%20on-Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

<br/>

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12.10-FBBC05?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-≥20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

<br/>

[**Features**](#-features) • [**Architecture**](#-architecture) • [**Quick Start**](#-quick-start) • [**Project Structure**](#-project-structure) • [**Deploy**](#-deploy-to-google-cloud-run) • [**Troubleshooting**](#-troubleshooting)

</div>

---

## 📖 About

**AURA AI** is a next-generation real-time multimodal agent that goes far beyond a text chatbox. It uses the **Gemini Live API** to enable true bidirectional streaming — your voice goes in, Gemini's voice comes back, all in real-time with near-zero latency.

Key differentiators from a standard chatbot:
- 🎤 **Speaks and listens simultaneously** — no push-to-talk, no waiting
- 📹 **Sees through your camera** — point at anything and ask about it  
- ⚡ **True barge-in** — interrupt AURA mid-sentence and it immediately stops and listens
- 🔥 **Firebase-backed** — Google Sign-In, persistent conversation history, Firestore rules
- 🚀 **Cloud-native** — Dockerized, CI/CD-ready, deployed to Google Cloud Run

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Live Microphone** | Real-time PCM16 audio streaming at 16kHz to Gemini via WebSocket |
| 📹 **Live Camera / Video** | Continuous JPEG frame streaming (1fps) for live visual context |
| 💬 **Text Input** | Type messages as a fallback when voice isn't available |
| 🔊 **Voice Output** | PCM audio from Gemini decoded and queued via Web Audio API |
| ⚡ **Interruption Handling** | Server-side `interrupted` signal stops playback instantly |
| 🧠 **Gemini 2.5 Flash Live** | Native audio + vision streaming — no intermediate transcription |
| 🔐 **Firebase Auth** | Google OAuth sign-in with anonymous guest mode fallback |
| 📊 **Firestore Persistence** | Conversation and message history saved per user |
| 🎨 **Framer Motion UI** | Smooth animated transitions and visual feedback |
| 📱 **Responsive Design** | Mobile-friendly layout with Tailwind CSS |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (React 19 + Vite)                  │
│                                                               │
│   ┌────────────┐   ┌─────────────┐   ┌──────────────────┐   │
│   │ Microphone │   │   Camera    │   │   Text Input     │   │
│   │  16kHz     │   │  1fps JPEG  │   │ sendClientContent│   │
│   │  PCM16     │   │  base64     │   │  turnComplete    │   │
│   └─────┬──────┘   └──────┬──────┘   └────────┬─────────┘   │
│         │                 │                    │              │
│         └─────────────────┴────────────────────┘              │
│                           │                                   │
│               GeminiLiveService.ts                            │
│           (ScriptProcessorNode → base64 PCM)                  │
└───────────────────────────┬───────────────────────────────────┘
                            │  @google/genai SDK
                            │  WebSocket bidirectional stream
                            ▼
          ┌─────────────────────────────────────┐
          │    Gemini 2.5 Flash Live API         │
          │  gemini-2.5-flash-native-audio-      │
          │         preview-09-2025              │
          │                                      │
          │  ✓ Native real-time audio I/O        │
          │  ✓ Vision (live camera frames)       │
          │  ✓ Server-side barge-in signal       │
          │  ✓ AUDIO response modality           │
          └───────────────┬─────────────────────┘
                          │
          ┌───────────────▼─────────────────────┐
          │          Output Pipeline             │
          │                                      │
          │  Audio → PCM16 → Float32Array        │
          │  → AudioContext createBuffer         │
          │  → Queued BufferSource playback      │
          │                                      │
          │  Text → transcript React state       │
          │  → AnimatePresence overlay           │
          │  → Firestore addDoc persist          │
          └──────────────────────────────────────┘

         Firebase Auth ──→ Google OAuth / Guest mode
         Firestore ──→ users / conversations / messages
```

---

## 🗂️ Project Structure

```
gemini-live-multimodal-agent/
│
├── 📁 src/
│   ├── App.tsx                   # Root component — Auth, routing, LiveAgent UI
│   ├── main.tsx                  # React 19 entry point
│   ├── firebase.ts               # Firebase app init (Auth + Firestore)
│   ├── types.ts                  # TypeScript interfaces (UserProfile, Message, Conversation)
│   ├── index.css                 # Tailwind CSS base styles
│   │
│   └── 📁 services/
│       └── geminiLiveService.ts  # Gemini Live API wrapper
│                                 # — WebSocket session management
│                                 # — Mic capture → PCM16 → base64
│                                 # — Audio playback queue
│                                 # — Video frame sender
│                                 # — Interruption / barge-in handling
│
├── 📄 index.html                 # Vite HTML entry
├── 📄 vite.config.ts             # Vite config — env vars, aliases, build chunks
├── 📄 tsconfig.json              # TypeScript compiler config (ES2022, bundler)
├── 📄 package.json               # Dependencies and npm scripts
├── 📄 package-lock.json          # Lockfile
│
├── 📄 firebase-applet-config.json  # Firebase project credentials
├── 📄 firebase-blueprint.json      # Firestore data model schema
├── 📄 firestore.rules              # Firestore security rules
├── 📄 metadata.json                # App metadata + permission declarations
│
├── 📄 Dockerfile                 # Multi-stage build (Node 20 Alpine + serve)
├── 📄 .dockerignore
├── 📄 .env.example               # Environment variable template
├── 📄 .gitignore
│
└── 📁 .github/
    └── 📁 workflows/
        └── deploy.yml            # GitHub Actions CI/CD → Cloud Run
```

### Key Source Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main UI — handles auth state, mic/camera toggle, transcript display, Firestore writes |
| `src/services/geminiLiveService.ts` | Core service — wraps `@google/genai` live session, streams PCM audio, handles barge-in |
| `src/firebase.ts` | Initializes Firebase app with Firestore + Auth |
| `src/types.ts` | Shared TypeScript types for `Message`, `Conversation`, `UserProfile` |
| `firestore.rules` | Security rules — auth checks, data validation, admin role support |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **LLM** | Gemini 2.5 Flash Live (native audio) | `gemini-2.5-flash-native-audio-preview` |
| **AI SDK** | `@google/genai` | `^1.29.0` |
| **Frontend** | React | `^19.0.0` |
| **Language** | TypeScript | `~5.8.2` |
| **Build Tool** | Vite | `^6.2.0` |
| **Styling** | Tailwind CSS | `^4.1.14` |
| **Animation** | Framer Motion (`motion`) | `^12.36.0` |
| **UI Icons** | Lucide React | `^0.546.0` |
| **Utilities** | clsx + tailwind-merge | `^2.1.1` / `^3.5.0` |
| **Auth** | Firebase Authentication | `^12.10.0` |
| **Database** | Firebase Firestore | `^12.10.0` |
| **Container** | Docker (Node 20 Alpine) | Multi-stage build |
| **CI/CD** | GitHub Actions | Auto-deploy on `main` |
| **Hosting** | Google Cloud Run | Managed, HTTPS, auto-scale |

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) **≥ 20**
- A [Gemini API Key](https://aistudio.google.com/app/apikey) (free)
- A [Firebase project](https://console.firebase.google.com/) with Auth + Firestore enabled

### 1. Clone the repository

```bash
git clone https://github.com/Archiusx/AURA_AI-Gemini-live-agent-.git
cd AURA_AI-Gemini-live-agent-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your key from → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 4. Configure Firebase

Edit `firebase-applet-config.json` with your Firebase project values:

```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc...",
  "firestoreDatabaseId": "(default)"
}
```

> Get this from: Firebase Console → Project Settings → Your Apps → Web App → SDK config

### 5. Run locally

```bash
npm run dev
```

Open **http://localhost:3000** — allow microphone permissions and click **Initialize Agent**.

> 💡 Chrome allows `localhost` as a secure origin automatically — no HTTPS needed for local dev.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `localhost:3000` with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` folder |

---

## 🔥 Firebase Setup

### Enable Google Authentication

1. [Firebase Console](https://console.firebase.google.com) → your project
2. **Authentication → Sign-in method → Google → Enable**
3. Add your domain to **Authorized Domains** after deploying

### Create Firestore Database

1. **Firestore Database → Create database → Production mode**
2. Choose a region closest to your users

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` contents directly in the Firebase Console.

### Firestore Data Model

```
users/
  {userId}/                    ← UserProfile
    uid, displayName, email, photoURL, createdAt

conversations/
  {conversationId}/            ← Conversation
    id, userId, title, createdAt, lastMessageAt
    messages/
      {messageId}/             ← Message
        conversationId, role, content, timestamp, type
```

---

## 🚀 Deploy to Google Cloud Run

### Option A — Automatic via GitHub Actions (Recommended)

Every push to `main` triggers an automatic build and deploy.

#### Step 1: Enable GCP APIs

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com
```

#### Step 2: Create a Service Account

```bash
# Create the service account
gcloud iam service-accounts create github-deploy-sa \
  --display-name="GitHub Actions Deploy"

# Grant required roles
for ROLE in roles/run.admin roles/storage.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="$ROLE"
done

# Export the key
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

cat sa-key.json  # Copy this entire JSON
```

#### Step 3: Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your Google Cloud project ID |
| `GCP_SA_KEY` | Full contents of `sa-key.json` |
| `GEMINI_API_KEY` | Your Gemini API key |

#### Step 4: Push and watch it deploy

```bash
git add .
git commit -m "Deploy AURA AI"
git push origin main
# Monitor: github.com/YOUR_USERNAME/REPO/actions
```

> 🔒 **Delete `sa-key.json`** from your machine after adding it to GitHub Secrets.

---

### Option B — Manual via gcloud CLI

```bash
# Build & push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/aura-ai

# Deploy to Cloud Run
gcloud run deploy aura-ai-agent \
  --image gcr.io/YOUR_PROJECT_ID/aura-ai \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars GEMINI_API_KEY=YOUR_ACTUAL_KEY

# Get your live URL
gcloud run services describe aura-ai-agent \
  --region us-central1 \
  --format 'value(status.url)'
```

### Post-Deployment Checklist

- [ ] Add Cloud Run URL to **Firebase → Authentication → Authorized Domains**
- [ ] Test Google Sign-In in browser
- [ ] Verify Firestore reads/writes (check Firebase Console)
- [ ] Confirm microphone and camera permissions work (HTTPS required)
- [ ] Check logs: `gcloud run services logs read aura-ai-agent --region us-central1`

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey) |
| `APP_URL` | Optional | Deployed app URL (injected automatically by Cloud Run) |

> The API key is embedded at **build time** via Vite's `define` config — never exposed server-side.

---

## 🐳 Docker

The project uses a **multi-stage Docker build** for a minimal production image:

```dockerfile
# Stage 1 — Build
FROM node:20-alpine AS builder
# Installs deps, injects GEMINI_API_KEY build arg, runs vite build

# Stage 2 — Serve
FROM node:20-alpine
# Uses 'serve' to serve the static dist/ at port 8080
```

Build and run locally:

```bash
docker build \
  --build-arg GEMINI_API_KEY=your_key_here \
  -t aura-ai .

docker run -p 8080:8080 aura-ai
# Open http://localhost:8080
```

---

## 🛡️ Security

- **API Key** is passed as a Docker build argument (`ARG`) — never stored in the image layers after build
- **Firestore Rules** enforce data validation, ownership checks, and admin role gating
- **Firebase Auth** provides secure Google OAuth — guest mode uses randomized UIDs
- **HTTPS** is enforced by Cloud Run — required for WebRTC microphone and camera access
- **No API key in source code** — always use `.env.local` locally and GitHub Secrets in CI/CD

---

## ❗ Troubleshooting

| Problem | Solution |
|---------|----------|
| **Mic / Camera not working** | Cloud Run uses HTTPS automatically. Check browser permission bar and allow access. |
| **Google Sign-In fails in production** | Add your Cloud Run URL to Firebase → Authentication → Settings → Authorized Domains |
| **Container build fails in GitHub Actions** | Verify `GCP_SA_KEY` is the full JSON blob. Check `GCP_PROJECT_ID` has no spaces. |
| **Gemini API 403 error** | Ensure `GEMINI_API_KEY` is correct and the Gemini API is enabled in your GCP project. |
| **Firestore permission denied** | Confirm `firestore.rules` are deployed. Guest mode uses open rules for demo purposes. |
| **Cloud Run returns 503** | Check container logs: `gcloud run services logs read aura-ai-agent --region us-central1` |
| **No audio output** | Click anywhere on the page first — browsers require a user gesture to unlock `AudioContext`. |
| **Black screen on camera** | Grant camera permission in browser. On Cloud Run (HTTPS), browser auto-prompts. |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/my-feature
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">



<br/>

[![Open in AI Studio](https://img.shields.io/badge/Open%20in-AI%20Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.studio/apps/e913dc76-2f80-4cad-a016-b0e8a1f36e4e)

<br/>

<sub>Architecture diagram and README By Piyush Deshkar</sub>

</div>
