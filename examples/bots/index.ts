// Example with a chat context - cli
import { groq } from "@ai-sdk/groq";
import { context, createAgent, validateEnv } from "@axiomkit/core";
import * as z from "zod/v4";
import { cliExtension } from "./extension";
// Validation install .env
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);
const echoContext = context({
  type: "echo",
  // No specific arguments needed for this simple context
  schema: z.object({}),
  // Instructions that guide the LLM's behavior
  instructions:
    "You are a simple echo bot. Repeat the user's message back to them.",
});

// 2. Create the agent instance
const agent = createAgent({
  // Configure the LLM model to use
  model: groq("gemma2-9b-it"),
  // Include the CLI extension for input/output handling
  extensions: [cliExtension],
  // Register our custom context
  contexts: [echoContext],
});

// 3. Start the agent and run the context
async function main() {
  // Initialize the agent (sets up services like readline)
  await agent.start();

  console.log("Echo agent started. Type 'exit' to quit.");

  // Run our echo context
  // The cliExtension automatically handles console input/output
  await agent.run({
    context: echoContext,
    args: {}, // Empty object since our schema requires no arguments
  });

  // Agent stops when the input loop breaks (e.g., user types "exit")
  console.log("Agent stopped.");
}

// Start the application
main();
