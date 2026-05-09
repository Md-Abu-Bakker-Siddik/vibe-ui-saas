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

    if (!hasGemini && !hasOpenAI) {
      return NextResponse.json(
        {
          error:
            "No AI key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your environment.",
        },
        { status: 500 }
      );
    }

    const jsx = await generateWithFallback(prompt);
    return NextResponse.json({ jsx });
  } catch (e) {
    console.error("Generate API error:", e);
    const { message, status } = normalizeProviderError(e);
    return NextResponse.json({ error: message }, { status });
  }
}
