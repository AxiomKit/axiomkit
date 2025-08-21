"use client";
import Link from "next/link";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { CodeWindow } from "@/components/terminal-steps/code-window";
import Footer from "@/components/footer";

// Utility function for combining classnames
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const tsSnippet = `import { createAgent } from "@axiomkit/core";
import { groq } from "@ai-sdk/groq";

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  modelSettings: {
    maxTokens: 1000,
    temperature: 0.7,
  },
});

// Start the agent
await agent.start();`;
  return (
    <main className="min-h-screen  font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="min-h-screen flex flex-col items-center justify-center text-center w-full">
          <p className="text-3xl font-bold mb-2">
            Build Agents That Think & Evolve
          </p>
          <CodeWindow
            filename="agent.ts"
            languageBadge="TypeScript"
            code={tsSnippet}
          />
          <p className="mb-4">
            Create intelligent agents with memory, planning, collaboration -
            andcontinuous learning.
          </p>
          <Link href={`/docs/framework`}>
            <button className="text-white px-6 py-4 text-lg glow-blue float-animation relative overflow-hidden group font-mono bg-gray-600/40 rounded-xl">
              START_BUILDING
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
