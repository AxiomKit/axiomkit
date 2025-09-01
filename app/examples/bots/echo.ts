import { createAgent, LogLevel } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

// Pre-configured extensions for common use cases
export const echoCliExtension = createCliExtension({
  name: "echo",
  instructions: [
    "You are a simple echo bot.",
    "Your ONLY job is to repeat EXACTLY what the user says back to them.",
    "Do NOT add any additional words, greetings, or explanations.",
    "Just echo the user's message verbatim.",
    "If user says 'hi', you say 'hi'.",
    "Nothing more, nothing less.",
  ],
});

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [echoCliExtension],
});

// Start the agent
async function main() {
  await agent.start();
  console.log("Echo bot started. Type 'exit' to quit.");
  console.log("I will repeat exactly what you say.");

  // The CLI extension will handle the input/output loop
  // It will use the echo instructions we defined in the extension
}

main();
