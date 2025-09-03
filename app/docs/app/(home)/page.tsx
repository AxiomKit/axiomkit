"use client";
import Link from "next/link";

import { CodeWindow } from "@/components/terminal-steps/code-window";
import Footer from "@/components/footer";

export default function Home() {
  const tsSnippet = `import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

export const echoCliExtension = createCliExtension({
  name: "echo",
  instructions: [
    "You are a simple echo bot.",
  ],
});
const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [echoCliExtension],
});
async function main() {
  await agent.start({
    id: "echo-handle",
  });
}
main();
`;
  return (
    <main className="min-h-screen  font-mono">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="min-h-screen flex flex-col items-center  text-center w-full">
          <CodeWindow
            filename="agent.ts"
            languageBadge="TypeScript"
            code={tsSnippet}
          />
          <p className="mb-2 font-bold text-lg">
            Build Complex Autonomous Agent
          </p>
          <p className="mb-4">
            Create intelligent agents with memory, planning, collaboration - and
            continuous learning.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/docs/framework`}>
              <button
                className="px-4 py-3 font-bold text-white bg-red-400 font-mono hover:opacity-75 shadow-lg"
                style={{
                  borderRadius: "6px",
                }}
              >
                Get Started
              </button>
            </Link>
            <Link href={`/docs/framework/getting-started/quick-start`}>
              <button
                className="px-4 py-3 font-bold  relative overflow-hidden group font-mono border rounded-md hover:opacity-75"
                style={{
                  borderRadius: "6px",
                }}
              >
                {`Quick Start >`}
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
