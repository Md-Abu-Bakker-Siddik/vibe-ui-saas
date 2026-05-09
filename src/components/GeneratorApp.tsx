"use client";

import { useCallback, useState } from "react";
import { ComponentPreview } from "@/components/ComponentPreview";

export function GeneratorApp() {
  const [prompt, setPrompt] = useState("");
  const [jsx, setJsx] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const generate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) {
      setError("Describe the component you want to build.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await res.json()) as {
        jsx?: string;
        error?: string;
        warning?: string;
        source?: "ai" | "fallback";
      };

      if (!res.ok) {
        setError(data.error || "Request failed.");
        setJsx(null);
        return;
      }

      if (!data.jsx) {
        setError("No JSX returned.");
        setJsx(null);
        return;
      }

      setJsx(data.jsx);
      if (data.source === "fallback" && data.warning) {
        setNotice(data.warning);
      }
    } catch {
      setError("Network error. Try again.");
      setJsx(null);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const copyCode = useCallback(async () => {
    if (!jsx) return;
    try {
      await navigator.clipboard.writeText(jsx);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access denied.");
    }
  }, [jsx]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Vibe UI
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Tailwind components from a sentence
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Describe a UI block. We call an AI model and render a live preview
          with your Tailwind setup—then copy the JSX into your app.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <label htmlFor="prompt" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Prompt
          </label>
          <textarea
            id="prompt"
            rows={8}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g. Build a dark theme hero section with a headline, subtext, and primary CTA button.'
            className="min-h-[180px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none ring-violet-500/0 transition-[box-shadow,border-color] placeholder:text-zinc-400 focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/15 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}
          {notice && !error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
              {notice}
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate component"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Preview
            </h2>
            <button
              type="button"
              onClick={copyCode}
              disabled={!jsx}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:border-zinc-700 dark:bg-zinc-900/50 dark:shadow-none">
            <ComponentPreview jsxSource={jsx} />
          </div>

          {jsx && (
            <details className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/80">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-zinc-600 marker:hidden dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Raw JSX
                  <span className="text-zinc-400 transition group-open:rotate-180 dark:text-zinc-500">
                    ▼
                  </span>
                </span>
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-zinc-100 bg-zinc-50/90 p-4 text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
                <code>{jsx}</code>
              </pre>
            </details>
          )}
        </div>
      </section>
    </div>
  );
}
