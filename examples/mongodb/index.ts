import { createCliExtension } from "@axiomkit/cli";
import { createGroq } from "@ai-sdk/groq";
import * as z from "zod/v4";
import {
  createAgent,
  createMemory,
  validateEnv,
  createVectorStore,
  context,
  type MemoryStore,
} from "@axiomkit/core";
import { createMongoMemoryStore } from "@axiomkit/mongodb";

/**
 *
 * Example Build AI SDK
 */
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  })
);

const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

// Custom memory store that only stores final translation results
class TranslationMemoryStore implements MemoryStore {
  private mongoStore: MemoryStore;
  private translationResults: Map<string, any> = new Map();

  constructor(mongoStore: MemoryStore) {
    this.mongoStore = mongoStore;
  }

  async get<T>(key: string): Promise<T | null> {
    // First check our local translation results
    if (this.translationResults.has(key)) {
      return this.translationResults.get(key) as T;
    }

    // Fall back to MongoDB store
    return this.mongoStore.get<T>(key);
  }

  async set(key: string, value: any): Promise<void> {
    // Store in MongoDB for persistence
    await this.mongoStore.set(key, value);

    // If this is a translation result, store it locally for quick access
    if (key.includes("translation") || key.includes("translator")) {
      this.translationResults.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    this.translationResults.delete(key);
    await this.mongoStore.delete(key);
  }

  async clear(): Promise<void> {
    this.translationResults.clear();
    await this.mongoStore.clear();
  }

  async keys(base?: string): Promise<string[]> {
    return this.mongoStore.keys(base);
  }

  // Custom method to get only translation results
  getTranslationResults(): Map<string, any> {
    return new Map(this.translationResults);
  }

  // Custom method to store final translation result
  async storeTranslationResult(
    input: string,
    output: string,
    sourceLang?: string,
    targetLang?: string
  ): Promise<void> {
    const translationKey = `translation:${Date.now()}`;
    const result = {
      input,
      output,
      sourceLanguage: sourceLang || "auto",
      targetLanguage: targetLang || "auto",
      timestamp: Date.now(),
      type: "translation",
    };

    await this.set(translationKey, result);
    console.log(`✅ Translation stored: "${input}" → "${output}"`);
  }
}

// Create a context for the translator
const translatorContext = context({
  type: "translator",
  schema: z.object({
    sourceLanguage: z.string().optional(),
    targetLanguage: z.string().optional(),
  }),
  instructions: [
    "You are a professional translator.",
    "Your task is to translate user input accurately and concisely.",
    "When a user provides text and a target language, you must respond with ONLY the translated text.",
    "Do not add any extra words, explanations, greetings, or apologies. Your response should be the translation itself and nothing more.",
    "Do not use any formatting like HTML or Markdown.",
    "If the target language is unclear, ask the user for clarification.",
    "Example: If the user says 'translate good morning to Vietnamese', your complete and exact response is 'Chào buổi sáng'.",
  ],
});

// Create CLI extension with proper configuration
const translatorCliExtension = createCliExtension({
  name: "translator",
  instructions: [
    "You are a professional translator.",
    "Your task is to translate user input accurately and concisely.",
    "When a user provides text and a target language, you must respond with ONLY the translated text.",
    "Do not add any extra words, explanations, greetings, or apologies. Your response should be the translation itself and nothing more.",
    "Do not use any formatting like HTML or Markdown.",
    "If the target language is unclear, ask the user for clarification.",
    "Example: If the user says 'translate good morning to Vietnamese', your complete and exact response is 'Chào buổi sáng'.",
  ],
});

async function main() {
  // Create the MongoDB memory store
  const mongoMemoryStore = await createMongoMemoryStore({
    uri: env.MONGODB_URI,
    dbName: "translator_bot",
    collectionName: "conversations",
  });

  // Create our custom translation memory store
  const translationMemoryStore = new TranslationMemoryStore(mongoMemoryStore);

  const agent = createAgent({
    model: groq("deepseek-r1-distill-llama-70b"),
    extensions: [translatorCliExtension],
    memory: createMemory(
      await createMongoMemoryStore({ uri: env.MONGODB_URI }),
      createVectorStore()
    ),
    exportTrainingData: true,
    trainingDataPath: "./train/data.json",
  });

  await agent.start();
  console.log("🌍 Translator Bot started. Type 'exit' to quit.");
  console.log("I can translate between many languages!");
  console.log("Examples:");
  console.log("- 'Hello' (translate to Spanish)");
  console.log("- 'Bonjour' (translate to English)");
  console.log("- 'Translate this to German: Good morning'");

  // Example usage with custom handlers to capture final results
  console.log("\n--- Testing Translation Memory Storage ---");

  // Test the agent with a translation
  const result = await agent.run({
    context: translatorContext,
    args: { sourceLanguage: "English", targetLanguage: "Vietnamese" },
    handlers: {
      onLogStream: (log, done) => {
        // Only show final outputs, not intermediate thoughts
        if (log.ref === "output" && log.type === "cli:message") {
          console.log(`🎯 Final Translation: "${log.content}"`);

          // Store the translation result
          const input = "hello"; // This would come from the actual input
          translationMemoryStore.storeTranslationResult(
            input,
            log.content.trim(),
            "English",
            "Vietnamese"
          );
        }
      },
    },
  });

  console.log("Agent run completed. Check MongoDB for stored memory.");
  console.log(
    "Translation results stored:",
    translationMemoryStore.getTranslationResults()
  );

  process.stdin.resume();
}

main().catch(console.error);
