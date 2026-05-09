# Vibe UI

AI-powered Tailwind component generator that converts plain-English prompts into React JSX with live preview.

## Links

- **Live Demo:** [https://vibe-ui-saas.vercel.app/](https://vibe-ui-saas.vercel.app/)
- **GitHub Repository:** [https://github.com/Md-Abu-Bakker-Siddik/vibe-ui-saas](https://github.com/Md-Abu-Bakker-Siddik/vibe-ui-saas)

---

## What This Product Does

Vibe UI lets users:

1. Describe a UI block in natural language.
2. Generate Tailwind-based React JSX.
3. See a live preview instantly.
4. Copy raw JSX and paste it into their project.

The app is designed to stay usable even when API quota is exhausted by using local fallback templates.

---

## Core Features

- Prompt-to-UI generation (`/api/generate`)
- Gemini and OpenAI provider support
- Provider fallback chain
- Free local fallback mode when providers fail
- Clean preview with Desktop/Tablet/Mobile viewport toggles
- Copy-to-clipboard for generated JSX
- Friendly error messages for quota/auth/model issues

---

## Tech Stack

- **Frontend:** Next.js App Router + React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js Route Handler (`app/api/generate/route.ts`)
- **AI Providers:** Gemini (`@google/generative-ai`) and OpenAI Chat Completions API
- **Deployment:** Vercel

---

## Runtime Modes (Free + Premium)

### Free Local Fallback Mode

- No API key required
- Uses built-in template generation
- Best for demo, offline practice, and zero-cost testing

### Gemini Mode

- Requires `GEMINI_API_KEY`
- Optional model override via `GEMINI_MODEL`

### OpenAI Mode

- Requires `OPENAI_API_KEY`
- Set `AI_PROVIDER=openai`

### Hybrid Mode

- Configure both Gemini and OpenAI keys
- Primary provider is used first, secondary provider is fallback

### Important API Note

- Free-tier APIs are good for testing but often hit strict quota/rate limits.
- For consistent production-quality output, use a paid/premium API plan.
- Fallback mode keeps the app running, but fallback output is intentionally simpler than full AI output.

---

## API Setup (Step-by-Step)

### Option A: Gemini

1. Create key from Google AI Studio.
2. Copy key.
3. Add to env as `GEMINI_API_KEY`.
4. Optional: set `GEMINI_MODEL=gemini-1.5-flash`.

### Option B: OpenAI

1. Create secret key from OpenAI platform.
2. Ensure billing is active.
3. Add to env as `OPENAI_API_KEY`.
4. Set `AI_PROVIDER=openai`.

### Recommended for stability

Configure both providers so one can fallback to the other.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```env
# Primary provider preference: gemini | openai
AI_PROVIDER=gemini

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Keep app usable when provider fails
ALLOW_DEMO_FALLBACK=true
```

---

## Local Run (Developer Guide)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: `http://localhost:3000`

Quality checks:

```bash
npm run lint
npm run build
```

---

## Vercel Deployment Guide

1. Push code to GitHub.
2. Import repo in Vercel.
3. Add env vars in **Settings -> Environment Variables**:
   - `GEMINI_API_KEY` (optional)
   - `OPENAI_API_KEY` (optional)
   - `AI_PROVIDER`
   - `ALLOW_DEMO_FALLBACK=true`
4. Select environments: **Production + Preview**
5. Save and **Redeploy** after every env change.
6. Hard refresh live app (`Ctrl + F5`) before testing.

---

## How Client/End User Uses the App

1. Open the app.
2. Write prompt (example: "Create a pricing section with 3 plans").
3. Click **Generate component**.
4. Review preview in Desktop/Tablet/Mobile modes.
5. Expand **Raw JSX**.
6. Click **Copy code**.
7. Paste into their React project and customize.

---

## Troubleshooting

### "AI provider unavailable" warning

- Provider key missing, invalid, or quota exceeded.
- If fallback is enabled, app will still return a local component.

### Free tier not generating rich output

- Free tiers have request/token limits.
- Upgrade billing plan for stable production output.

### Live and local look different

- Latest local commit not pushed, or Vercel not redeployed.
- Push -> redeploy -> hard refresh.

### Env looks correct but still failing

- Recheck exact key names (e.g., `AI_PROVIDER`, `ALLOW_DEMO_FALLBACK`).
- Ensure env scope is `Production + Preview`.

---

## Security Best Practices

- Never commit real API keys.
- Rotate any exposed key immediately.
- Keep secrets only in `.env.local` and Vercel env settings.

---

## Product Positioning

This MVP demonstrates:

- Full-stack implementation
- AI integration patterns
- Fallback-first reliability design
- Deployment and client-demo readiness
