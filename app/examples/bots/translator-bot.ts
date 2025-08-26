import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { groq } from "@ai-sdk/groq";

const translatorCliExtension = createCliExtension({
  name: "translator",
  instructions: [
    "You are a professional translator.",
    "Your task is to translate user input accurately and concisely.",
    "When a user provides text and a target language, respond with ONLY the translated text.",
    "Do not add any extra words, explanations, greetings, or apologies. Your response should be the translation itself and nothing more.",
    "Do not use any formatting like HTML or Markdown.",
    "If the target language is unclear, ask the user for clarification.",
    "Example: If the user says 'translate good morning to Vietnamese', your complete and exact response is 'Chào buổi sáng'.",
    "IMPORTANT: Do not use action calls. Provide direct translations as plain text responses.",
  ],
});

const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
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
