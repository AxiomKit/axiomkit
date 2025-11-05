/**
 * {{MODEL_NAME}} template for a Axiomkit agent
 * This template includes context for goals and tasks, and actions for managing them
 */
import { {{MODEL_IMPORT_FUNCTION}} } from "{{MODEL_IMPORT_PATH}}";
import {
    createAgent,
   LogLevel,
    validateEnv,
} from "@axiomkit/core";
import { createCliProvider } from "@axiomkit/cli";
import {  z } from "zod";

// Initialize {{MODEL_NAME}} client
const env = validateEnv(
    z.object({
        {{ENV_VAR_KEY}}: z.string().min(1, "{{ENV_VAR_KEY}} is required"),
    })
);

// Initialize {{MODEL_NAME}} client
const {{MODEL_VARIABLE}} = {{MODEL_IMPORT_FUNCTION}}({
    apiKey: env.{{ENV_VAR_KEY}}!,
});


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
  model: {{MODEL_VARIABLE}}("{{MODEL_VERSION}}"),
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