import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

// Create a custom CLI extension with specific instructions
const customCliExtension = createCliExtension({
  name: "code-reviewer",
  instructions: [
    "You are an expert code reviewer.",
    "Review code for best practices, bugs, and improvements.",
    "Provide constructive feedback with specific suggestions.",
    "Focus on readability, performance, and security.",
    "Be thorough but concise in your reviews.",
  ],
});

// Create the agent with the custom CLI extension
const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [customCliExtension],
});

// Start the agent
async function main() {
  await agent.start();
  console.log("Code Reviewer bot started. Type 'exit' to quit.");
  console.log("I will review your code and provide feedback.");

  // The CLI extension will handle the input/output loop
  // It will use the code reviewer instructions we defined
}

main();
