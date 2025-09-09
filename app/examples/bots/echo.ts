import { createAgent, LogLevel } from "@axiomkit/core";
import { createCliProvider } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

export const echoCliProvider = createCliProvider({
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
  logLevel: LogLevel.DISABLED,
  providers: [echoCliProvider],
});

// Start the agent
async function main() {
  await agent.start({
    id: "echo-handle",
  });
  console.log("Echo bot started. Type 'exit' to quit.");
  console.log("I will repeat exactly what you say.");
}

main();
