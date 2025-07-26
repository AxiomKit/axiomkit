import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "./extension";
import { groq } from "@ai-sdk/groq";

// Create a translator CLI extension
const translatorCliExtension = createCliExtension({
  name: "translator",
  instructions: [
    "You are a professional translator.",
    "Translate user input between different languages.",
    "If the user doesn't specify a target language, ask them which language they want to translate to.",
    "Provide accurate and natural translations.",
    "If the user asks to translate to a specific language, respond with ONLY the translation.",
    "Support common languages like English, Spanish, French, German, Chinese, Japanese, Korean, etc.",
  ],
});

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [translatorCliExtension],
});

async function main() {
  await agent.start();
  console.log("🌍 Translator Bot started. Type 'exit' to quit.");
  console.log("I can translate between many languages!");
  console.log("Examples:");
  console.log("- 'Hello' (translate to Spanish)");
  console.log("- 'Bonjour' (translate to English)");
  console.log("- 'Translate this to German: Good morning'");
}

main();
