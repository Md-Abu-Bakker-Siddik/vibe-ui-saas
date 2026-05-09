"use client";

import * as Babel from "@babel/standalone";
import React, { useMemo } from "react";

type Props = {
  jsxSource: string | null;
};

/**
 * Renders AI-returned JSX by compiling it with Babel in the browser so
 * `className` and Tailwind utilities apply like normal React.
 * (Raw `dangerouslySetInnerHTML` only accepts HTML strings with `class`,
 * not JSX with `className`, so compilation is required for a faithful preview.)
 */
export function ComponentPreview({ jsxSource }: Props) {
  const trimmed = jsxSource?.trim() ?? "";

  const compiled = useMemo(() => {
    if (!trimmed) {
      return { status: "idle" as const };
    }

    try {
      const wrapped = `const __preview = (${trimmed});`;
      const out = Babel.transform(wrapped, {
        presets: ["react"],
        filename: "preview.jsx",
      }).code;

      if (!out?.trim()) {
        throw new Error("Compilation produced empty output.");
      }

      const run = new Function(
        "React",
        `${out}\nreturn typeof __preview === "undefined" ? null : __preview;`
      ) as (
        R: typeof React
      ) => React.ReactNode;
      const node = run(React);
      return { status: "ok" as const, node };
    } catch (e) {
      return {
        status: "error" as const,
        message:
          e instanceof Error ? e.message : "Could not compile preview.",
      };
    }
  }, [trimmed]);

  if (!trimmed) {
    return (
      <p className="text-sm text-zinc-500">
        Generated UI will appear here after you run a prompt.
      </p>
    );
  }

  if (compiled.status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-medium">Preview could not compile this JSX.</p>
        <p className="mt-1 opacity-90">{compiled.message}</p>
        <p className="mt-2 text-xs opacity-80">
          You can still copy the raw code and fix it in your project.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[120px] w-full [&_*]:max-w-none">{compiled.node}</div>
  );
}
