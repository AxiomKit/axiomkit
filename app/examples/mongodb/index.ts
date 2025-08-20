import { createCliExtension } from "@axiomkit/cli";

import { createGroq } from "@ai-sdk/groq";
import * as z from "zod/v4";
import { createAgent, validateEnv, context } from "@axiomkit/core";
import { createMongoMemory } from "@axiomkit/mongodb";

/**
 * MongoDB Memory Example with Translation Bot
 *
 * This example demonstrates how to use MongoDB as a persistent memory store
 * for an AI agent. The agent is configured as a translator that stores
 * conversation history and translation results in MongoDB.
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

// Translation service that works with MongoDB memory
class TranslationService {
  private memorySystem: any;
  private translationResults: Map<string, any> = new Map();

  constructor(memorySystem: any) {
    this.memorySystem = memorySystem;
    this.translationResults = new Map();
  }

  // Store conversation in MongoDB
  async storeConversation(
    input: string,
    output: string,
    metadata?: any
  ): Promise<void> {
    const conversationKey = `conversation:${Date.now()}`;
    const conversation = {
      input,
      output,
      timestamp: Date.now(),
      type: "conversation",
      metadata: metadata || {},
    };

    await this.memorySystem.kv.set(conversationKey, conversation);
    console.log(`✅ Conversation stored: "${input}" → "${output}"`);
  }

  // Custom method to store final translation result with metadata
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

    await this.memorySystem.kv.set(translationKey, result);

    // Store locally for quick access
    this.translationResults.set(translationKey, result);

    console.log(`✅ Translation stored: "${input}" → "${output}"`);
  }

  // Method to get translation history
  async getTranslationHistory(limit: number = 10): Promise<any[]> {
    const keys = await this.memorySystem.kv.keys("translation:");
    const history = [];

    for (const key of keys.slice(-limit)) {
      const result = await this.memorySystem.kv.get(key);
      if (result) {
        history.push(result);
      }
    }

    return history.sort((a: any, b: any) => b.timestamp - a.timestamp);
  }

  // Method to get conversation history
  async getConversationHistory(limit: number = 10): Promise<any[]> {
    const keys = await this.memorySystem.kv.keys("conversation:");
    const history = [];

    for (const key of keys.slice(-limit)) {
      const result = await this.memorySystem.kv.get(key);
      if (result) {
        history.push(result);
      }
    }

    return history.sort((a: any, b: any) => b.timestamp - a.timestamp);
  }

  // Custom method to get only translation results
  getTranslationResults(): Map<string, any> {
    return new Map(this.translationResults);
  }
}

// Create a translation action
const translateAction = {
  name: "translate",
  description: "Translate text from one language to another",
  schema: z.object({
    text: z.string().describe("The text to translate"),
    sourceLanguage: z
      .string()
      .optional()
      .describe("Source language (auto-detect if not specified)"),
    targetLanguage: z.string().describe("Target language for translation"),
  }),
  handler: async (args: any, ctx: any, agent: any) => {
    const { text, sourceLanguage, targetLanguage } = args;

    // Store the translation request
    const translationService = new TranslationService(agent.memory);

    // For now, we'll use a simple translation approach
    // In a real implementation, you might use a translation API
    const translation = `[${targetLanguage}] ${text}`;

    // Store the translation result
    await translationService.storeTranslationResult(
      text,
      translation,
      sourceLanguage,
      targetLanguage
    );

    // Store the conversation
    await translationService.storeConversation(
      `Translate "${text}" to ${targetLanguage}`,
      translation,
      { sourceLanguage, targetLanguage }
    );

    return {
      originalText: text,
      translatedText: translation,
      sourceLanguage: sourceLanguage || "auto",
      targetLanguage,
    };
  },
};

// // Create CLI extension with proper configuration
const translatorCliExtension = createCliExtension({
  name: "translator",
  instructions: [
    "You are a professional translator assistant.",
    "Your task is to help users translate text between different languages.",
    "When users provide text and a target language, use the translate action to perform the translation.",
    "Always be helpful and provide clear explanations when needed.",
    "If the target language is unclear, ask the user for clarification.",
    "You can translate between many languages including English, Spanish, French, German, Vietnamese, Chinese, Japanese, and more.",
  ],
});

// Create a context for the translator
const translatorContext = context({
  type: "translator",
  schema: z.object({
    sourceLanguage: z.string().optional(),
    targetLanguage: z.string().optional(),
  }),
  instructions: [
    "You are a professional translator assistant.",
    "Your task is to help users translate text between different languages.",
    "When users provide text and a target language, use the translate action to perform the translation.",
    "After calling the translate action, respond with ONLY the translated text from the action result.",
    "Do not use any template variables like {{calls[0].result.translatedText}} in your response.",
    "Do not add any extra formatting, explanations, or greetings.",
    "If the target language is unclear, ask the user for clarification.",
    "You can translate between many languages including English, Spanish, French, German, Vietnamese, Chinese, Japanese, and more.",
  ],
  extension: [translatorCliExtension],
  maxSteps: 1,
});

async function main() {
  console.log("🚀 Initializing MongoDB Translation Bot...");

  // Create the MongoDB memory system with proper configuration
  const mongoMemorySystem = createMongoMemory({
    uri: env.MONGODB_URI,
    dbName: "translator_bot",
    collectionName: "conversations",
  });

  // Initialize the memory system
  await mongoMemorySystem.initialize();

  // Create our translation service
  const translationService = new TranslationService(mongoMemorySystem);

  // Create the agent with MongoDB memory and translation action
  const agent = createAgent({
    model: groq("deepseek-r1-distill-llama-70b"),
    actions: [translateAction],
    memory: mongoMemorySystem,
  });

  await agent.start({
    id: "test-mongodb",
  });
  console.log("🌍 Translator Bot started. Type 'exit' to quit.");
  console.log("I can translate between many languages!");
  console.log("Examples:");
  console.log("- 'translate hello to Spanish'");
  console.log("- 'translate bonjour to English'");
  console.log("- 'translate this to German: Good morning'");

  // Example usage with custom handlers to capture final results
  console.log("\n--- Testing Translation Memory Storage ---");

  // Test the agent with a translation
  const result = await agent.run({
    context: translatorContext,
    args: { sourceLanguage: "English", targetLanguage: "Vietnamese" },
  });

  console.log("Agent run completed. Check MongoDB for stored memory.");
  console.log("Result:", result);

  // Demonstrate getting translation history
  console.log("\n--- Translation History ---");
  const history = await translationService.getTranslationHistory(5);
  console.log("Recent translations:", history);

  // Demonstrate getting conversation history
  console.log("\n--- Conversation History ---");
  const conversations = await translationService.getConversationHistory(5);
  console.log("Recent conversations:", conversations);

  // Health check for MongoDB connection
  console.log("\n--- MongoDB Health Check ---");
  try {
    await mongoMemorySystem.kv.get("health:test");
    console.log("MongoDB Status: Connected and operational");
  } catch (error) {
    console.log("MongoDB Status: Connection error", error);
  }

  process.stdin.resume();
}

main().catch(console.error);
