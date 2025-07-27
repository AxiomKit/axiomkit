import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

// Create a calculator CLI extension
const calculatorCliExtension = createCliExtension({
  name: "calculator",
  instructions: [
    "You are a mathematical calculator.",
    "When users provide mathematical expressions or problems, calculate the result.",
    "Show your work step by step when solving complex problems.",
    "Support basic operations: +, -, *, /, ^, sqrt, etc.",
    "For word problems, extract the mathematical operations and solve them.",
    "Always provide the final answer clearly.",
    "If the input is not mathematical, politely ask for a math problem.",
  ],
});

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  modelSettings: {
    maxTokens: 600,
  },
  extensions: [calculatorCliExtension],
});

async function main() {
  await agent.start();
  console.log("🧮 Calculator Bot started. Type 'exit' to quit.");
  console.log("I can solve mathematical problems!");
  console.log("Examples:");
  console.log("- '2 + 2'");
  console.log("- 'What is 15% of 200?'");
  console.log("- 'Solve: 3x + 5 = 20'");
  console.log("- 'Calculate the area of a circle with radius 5'");
}

main();
