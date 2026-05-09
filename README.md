# Vibe UI SaaS MVP

Generate Tailwind CSS React components from natural language prompts.

## Modes (Free + Premium)

- **Free local fallback mode (default):** no API key required. The app returns a local JSX template from your prompt when providers are unavailable.
- **Gemini mode (free-tier cloud):** set `GEMINI_API_KEY` and optional `GEMINI_MODEL`.
- **OpenAI mode (usually paid):** set `OPENAI_API_KEY` and `AI_PROVIDER=openai`.
- **Hybrid mode:** set both keys and let one provider fallback to the other.

## Setup

1. Install deps:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env.local
```

3. Optional env vars:

- `AI_PROVIDER=gemini` or `openai`
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-1.5-flash` (or available model)
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o-mini`
- `ALLOW_DEMO_FALLBACK=true` (default behavior)

4. Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel

Add the same env vars in Project Settings -> Environment Variables, then redeploy.
