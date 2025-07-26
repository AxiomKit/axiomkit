import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "./extension";
import { groq } from "@ai-sdk/groq";

// Create a debugging assistant CLI extension
const debuggingAssistantCliExtension = createCliExtension({
  name: "debugging-assistant",
  instructions: [
    "You are an expert programming and debugging assistant.",
    "Help users debug code, find bugs, and suggest improvements.",
    "When analyzing code, look for common issues like syntax errors, logic errors, and performance problems.",
    "Provide step-by-step debugging guidance.",
    "Suggest best practices and code improvements.",
    "Explain what the code does and why it might be failing.",
    "Be patient and thorough in your explanations.",
    "Ask for more context if needed to provide better help.",
  ],
});

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [debuggingAssistantCliExtension],
});

async function main() {
  await agent.start();
  console.log("🐛 Debugging Assistant started. Type 'exit' to quit.");
  console.log("I can help you debug code and solve programming problems!");
  console.log("Examples:");
  console.log("- 'Why is this code not working?' (paste your code)");
  console.log("- 'Help me fix this bug'");
  console.log("- 'What's wrong with this function?'");
  console.log("- 'How can I improve this code?'");
  console.log("- 'Explain what this code does'");
}

main();
