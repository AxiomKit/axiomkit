// components/CodeWindow.tsx
"use client";

import * as React from "react";

import { Copy, Check } from "lucide-react";
import { Badge } from "../badge";

type CodeWindowProps = {
  filename?: string;
  languageBadge?: string;
  code: string;
  className?: string;
};

export function CodeWindow({
  filename = "agent.ts",
  languageBadge = "TypeScript",
  code,
  className = "",
}: CodeWindowProps) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div
      className={[
        "bg-black/90 border border-slate-700/50 rounded-2xl p-4 md:p-6 mb-8",
        "w-full mx-auto backdrop-blur-sm group transition-all duration-300",
        "hover:border-slate-600 hover:shadow-2xl",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-xs text-slate-400 font-mono ml-3">
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-mono">
            {languageBadge}
          </Badge>
          <button
            aria-label="Copy code"
            onClick={onCopy}
            className="h-8 w-8 text-slate-300 hover:text-white"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <pre className="text-left text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto rounded-lg bg-[#0a0a0a] p-4 ring-1 ring-slate-800/60">
        <code className="group-hover:text-slate-200 transition-colors duration-300 whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
