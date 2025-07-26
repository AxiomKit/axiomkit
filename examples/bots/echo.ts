import { createAgent } from "@axiomkit/core";
import { echoCliExtension } from "./extension";
import { groq } from "@ai-sdk/groq";

// Create the agent with the echo CLI extension
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
