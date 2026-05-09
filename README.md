# Vibe UI

AI-powered component generation platform that converts plain-English prompts into Tailwind CSS React UI blocks.

---

## Overview

Vibe UI is a full-stack Next.js application designed as a SaaS MVP. Users describe a UI component (for example, "dark hero section with CTA"), and the app returns generated JSX, renders a live preview, and supports one-click code copy.

The project is built for real-world reliability:

- Works with **Gemini** and **OpenAI**
- Supports **provider fallback**
- Includes a **free local fallback mode** when no API key is configured or provider limits are reached

This ensures the product remains usable for demos, client reviews, and hiring evaluations even under API quota constraints.

---

## Key Features

- Prompt-based UI generation from natural language
- Tailwind CSS + React JSX output
- Live preview rendering in-browser
- "Copy Code" action for quick reuse
- Provider-aware backend (`Gemini` / `OpenAI`)
- Graceful error handling (quota, auth, model issues)
- Free-mode local fallback templates for uninterrupted UX

---

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **AI Providers:** Google Gemini, OpenAI Chat Completions API
- **Rendering:** Client-side JSX compilation for preview
- **Deployment:** Vercel

---

## Architecture (Vertical Slice)

1. User writes a prompt in the frontend.
2. Frontend sends `POST /api/generate`.
3. Backend calls the selected AI provider.
4. On success, backend returns generated JSX.
5. On provider failure/quota issues, backend returns local fallback JSX (if enabled).
6. Frontend renders preview and exposes raw JSX for copy.

---

## Runtime Modes

### 1) Free Local Fallback Mode (Default-safe)

- No API key required
- Uses local prompt-aware templates
- Best for zero-cost demos and first-time onboarding

### 2) Gemini Mode

- Set `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL`

### 3) OpenAI Mode

- Set `OPENAI_API_KEY`
- Set `AI_PROVIDER=openai`

### 4) Hybrid Mode

- Configure both keys
- Primary provider is tried first, secondary provider acts as fallback

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ALLOW_DEMO_FALLBACK=true
```

Notes:

- Keep `ALLOW_DEMO_FALLBACK=true` for best resilience.
- If keys are missing, free fallback mode still works.

---

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs at: `http://localhost:3000`

Production checks:

```bash
npm run lint
npm run build
```

---

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variables in **Project Settings -> Environment Variables**.
4. Redeploy after any environment change.

---

## Reliability and UX Strategy

- Provider quota/auth errors are normalized to user-friendly messages.
- Raw provider error dumps are not shown to end users.
- Fallback mode protects product perception ("always returns something usable").

---

## Security Notes

- Never commit real API keys.
- Rotate exposed keys immediately.
- Use Vercel Environment Variables for production secrets.

---

## Roadmap Ideas

- More fallback templates (dashboard, navbar, footer, testimonials)
- Mode badge in UI (`AI` vs `Free Local`)
- Generation history and saved snippets
- Team workspaces and prompt analytics

---

## Authoring Goal

This MVP demonstrates product thinking, full-stack delivery, graceful degradation, and deployment readiness for client demos and hiring evaluation.
