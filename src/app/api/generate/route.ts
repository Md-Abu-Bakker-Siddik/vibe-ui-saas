import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { COMPONENT_SYSTEM_INSTRUCTION } from "@/lib/generate-prompt";

export const maxDuration = 60;

function normalizeProviderError(error: unknown): { message: string; status: number } {
  const raw =
    error instanceof Error ? error.message : "Generation failed due to provider error.";
  const lower = raw.toLowerCase();

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return {
      message:
        "AI provider quota/rate limit exceeded. Please try again later or switch provider (for example OpenAI).",
      status: 429,
    };
  }

  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("invalid api key") ||
    lower.includes("api key is not set")
  ) {
    return {
      message:
        "AI provider authentication failed. Please verify your API key in environment variables.",
      status: 401,
    };
  }

  if (lower.includes("model") && (lower.includes("not found") || lower.includes("unsupported"))) {
    return {
      message:
        "Configured AI model is unavailable. Update GEMINI_MODEL or OPENAI_MODEL and redeploy.",
      status: 400,
    };
  }

  return {
    message: "Could not generate component right now. Please try again shortly.",
    status: 500,
  };
}

function buildTemplateFromPrompt(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("login") || p.includes("sign in") || p.includes("signin")) {
    return `<div className="flex min-h-[420px] items-center justify-center bg-zinc-100 p-6">
  <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-semibold text-zinc-900">Welcome back</h2>
    <p className="mt-1 text-sm text-zinc-500">Sign in to continue to your workspace.</p>
    <form className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
        <input type="email" placeholder="you@example.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
        <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-zinc-600"><input type="checkbox" />Remember me</label>
        <a className="text-violet-600 hover:text-violet-500" href="#">Forgot password?</a>
      </div>
      <button type="button" className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500">Sign in</button>
    </form>
  </div>
</div>`;
  }

  if (p.includes("pricing")) {
    return `<div className="bg-zinc-50 p-8">
  <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-zinc-900">Starter</h3>
      <p className="mt-2 text-3xl font-bold text-zinc-900">$9<span className="text-sm font-normal text-zinc-500">/mo</span></p>
    </div>
    <div className="rounded-2xl border-2 border-violet-500 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">Pro</h3>
      <p className="mt-2 text-3xl font-bold text-zinc-900">$29<span className="text-sm font-normal text-zinc-500">/mo</span></p>
    </div>
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-zinc-900">Enterprise</h3>
      <p className="mt-2 text-3xl font-bold text-zinc-900">$99<span className="text-sm font-normal text-zinc-500">/mo</span></p>
    </div>
  </div>
</div>`;
  }

  if (p.includes("hero")) {
    return `<div className="overflow-hidden rounded-2xl bg-zinc-900 p-10 text-white">
  <div className="grid items-center gap-8 md:grid-cols-2">
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-violet-300">New launch</p>
      <h1 className="text-4xl font-semibold leading-tight">Build beautiful UI in minutes</h1>
      <p className="mt-4 max-w-md text-zinc-300">Generate clean Tailwind components instantly from plain English prompts.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white">Get started</button>
        <button type="button" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Learn more</button>
      </div>
    </div>
    <div className="h-52 rounded-xl border border-zinc-700 bg-zinc-800/70" />
  </div>
</div>`;
  }

  return `<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold text-zinc-900">Generated component</h2>
  <p className="mt-2 text-sm text-zinc-600">Prompt: ${prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
  <button type="button" className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">Primary action</button>
</div>`;
}

function stripGeneratedJsx(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:jsx|tsx|javascript|js)?\s*\n?/i, "");
    s = s.replace(/\n?```\s*$/i, "");
  }
  return s.trim();
}

async function generateWithGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(key);
  const modelName =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: COMPONENT_SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini");
  return stripGeneratedJsx(text);
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: COMPONENT_SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return stripGeneratedJsx(content);
}

async function generateWithFallback(prompt: string): Promise<string> {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const providerPref = process.env.AI_PROVIDER?.toLowerCase();

  const order: Array<"gemini" | "openai"> =
    providerPref === "openai"
      ? ["openai", "gemini"]
      : ["gemini", "openai"];

  let lastError: Error | null = null;

  for (const name of order) {
    if (name === "gemini" && !hasGemini) continue;
    if (name === "openai" && !hasOpenAI) continue;

    try {
      if (name === "gemini") return await generateWithGemini(prompt);
      return await generateWithOpenAI(prompt);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("No AI provider succeeded.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: unknown };
    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing or empty prompt." },
        { status: 400 }
      );
    }

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const allowDemoFallback =
      process.env.ALLOW_DEMO_FALLBACK?.toLowerCase() !== "false";

    if (!hasGemini && !hasOpenAI) {
      if (allowDemoFallback) {
        const jsx = buildTemplateFromPrompt(prompt);
        return NextResponse.json({
          jsx,
          source: "fallback",
          warning:
            "No API key configured. Running in free local fallback mode.",
        });
      }

      return NextResponse.json(
        {
          error:
            "No AI key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your environment.",
        },
        { status: 500 }
      );
    }

    try {
      const jsx = await generateWithFallback(prompt);
      return NextResponse.json({ jsx, source: "ai" });
    } catch (providerError) {
      if (allowDemoFallback) {
        const jsx = buildTemplateFromPrompt(prompt);
        return NextResponse.json({
          jsx,
          source: "fallback",
          warning:
            "AI provider unavailable right now. Showing a local fallback component.",
        });
      }
      throw providerError;
    }
  } catch (e) {
    console.error("Generate API error:", e);
    const { message, status } = normalizeProviderError(e);
    return NextResponse.json({ error: message }, { status });
  }
}
