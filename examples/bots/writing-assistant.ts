import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "./extension";
import { groq } from "@ai-sdk/groq";

// Create a writing assistant CLI extension
const writingAssistantCliExtension = createCliExtension({
  name: "writing-assistant",
  instructions: [
    "You are a professional writing assistant.",
    "Help users improve their writing, generate content, and provide creative suggestions.",
    "When asked to write something, create engaging and well-structured content.",
    "When reviewing text, provide constructive feedback on grammar, style, and clarity.",
    "Offer suggestions for better word choices, sentence structure, and flow.",
    "Be encouraging and supportive while maintaining high standards.",
    "Ask clarifying questions if the user's request is unclear.",
  ],
});

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [writingAssistantCliExtension],
});

async function main() {
  await agent.start();
  console.log("✍️ Writing Assistant started. Type 'exit' to quit.");
  console.log("I can help you with writing tasks!");
  console.log("Examples:");
  console.log("- 'Write a short story about a robot'");
  console.log("- 'Help me improve this sentence: The weather is nice today'");
  console.log("- 'Generate a blog post about AI'");
  console.log("- 'Check my grammar in this paragraph'");
}

main();
