import { createAgent } from "@axiomkit/core";
import { cliProvider } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

// Create a simple calculator agent
const calculatorAgent = createAgent({
  model: groq("gemma2-9b-it"),
  providers: [cliProvider],
});

async function main() {
  try {
    await calculatorAgent.start();
    console.log("🧮 Calculator Agent started!");
    console.log("Try asking: 'What is 2 + 2?' or 'Calculate 15% of 200'");
  } catch (error) {
    console.error("Failed to start agent:", error);
  }
}

main();
