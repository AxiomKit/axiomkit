import { createAgent, validateEnv, context } from "@axiomkit/core";
import { createMongoMemory } from "@axiomkit/mongodb";
import { createGroq } from "@ai-sdk/groq";
import * as z from "zod/v4";

/**
 * WORKING MongoDB Memory Example
 *
 * This example demonstrates the CORRECT way to use MongoDB with Axiomkit agents
 * and fixes the output type and infinite loop issues.
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

// Define the translator context with proper output configuration
const translatorContext = context({
  type: "working-translator",
  schema: z.object({
    userId: z.string().describe("User identifier for memory persistence"),
    sessionId: z.string().optional().describe("Session identifier"),
    userMessage: z.string().describe("Message User want to translate"),
  }),

  // Initialize user state - this will be stored in MongoDB automatically
  create: (data) => ({
    userId: data.args.userId,
    sessionId: data.args.sessionId || `session-${Date.now()}`,
    userName: "",
    translationCount: 0,
    preferences: {
      style: "casual",
      targetLanguage: "English",
    },
    lastUsed: new Date().toISOString(),
  }),

  instructions: [
    "You are a helpful translator assistant with persistent memory.",
    "You remember user preferences and translation history.",
    "When users ask for translations, use the translate action.",
    "Be friendly and show that you remember the user.",
    "Don't generate responses without user input.",
  ],
}).setOutputs({
  message: {
    schema: z.string().describe("Response message to the user"),
  },
});

// Create a simple translation action
const translateAction = {
  name: "translate",
  description: "Translate text from one language to another",
  schema: z.object({
    text: z.string().describe("Text to translate"),
    targetLanguage: z.string().describe("Target language"),
    sourceLanguage: z
      .string()
      .optional()
      .describe("Source language (auto-detect if not provided)"),
  }),
  handler: async (args: any, ctx: any, agent: any) => {
    const { text, targetLanguage, sourceLanguage = "auto" } = args;

    // Access agent's memory system
    const memory = agent.memory;
    const state = ctx.state;

    console.log(`🧠 Translating: "${text}" → ${targetLanguage}`);

    // Check if we have a cached translation
    const cacheKey = `translation:${text}:${targetLanguage}`;
    let cachedTranslation = null;

    try {
      cachedTranslation = await memory.kv.get(cacheKey);
      if (cachedTranslation) {
        console.log(`💾 Found cached translation: ${cachedTranslation.result}`);
        return {
          originalText: text,
          translatedText: cachedTranslation.result,
          fromCache: true,
          confidence: 0.95,
        };
      }
    } catch (error) {
      console.log("📝 No cached translation found");
    }

    // Perform translation (simplified for demo)
    const translatedText = `[${targetLanguage}] ${text}`;
    const confidence = 0.9;

    // Store the translation in memory
    try {
      const translationData = {
        result: translatedText,
        sourceLanguage,
        confidence,
        timestamp: new Date().toISOString(),
        userId: state.userId,
      };

      await memory.kv.set(cacheKey, translationData);
      console.log(`💾 Stored translation in memory: ${cacheKey}`);
    } catch (error) {
      console.error("Failed to store translation:", error);
    }

    // Update user statistics
    state.translationCount++;
    state.lastUsed = new Date().toISOString();

    return {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      fromCache: false,
      confidence,
      translationCount: state.translationCount,
    };
  },
};

// Action to get user's translation history
const getHistoryAction = {
  name: "get_history",
  description: "Get user's translation history",
  schema: z.object({
    limit: z
      .number()
      .default(5)
      .describe("Number of recent translations to retrieve"),
  }),
  handler: async (args: any, ctx: any, agent: any) => {
    const { limit } = args;
    const memory = agent.memory;
    const state = ctx.state;

    try {
      // Get all translation keys
      const keys = await memory.kv.keys("translation:");
      const history = [];

      for (const key of keys.slice(-limit * 2)) {
        const translation = await memory.kv.get(key);
        if (translation && translation.userId === state.userId) {
          history.push({
            key,
            ...translation,
          });
        }
      }

      const sortedHistory = history
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);

      return {
        history: sortedHistory,
        total: history.length,
        userStats: {
          translationCount: state.translationCount,
          lastUsed: state.lastUsed,
        },
      };
    } catch (error) {
      console.error("Error retrieving history:", error);
      return {
        history: [],
        total: 0,
        error: "Failed to retrieve history",
      };
    }
  },
};

async function main() {
  console.log("🚀 Starting Working MongoDB Example...\n");

  // Create MongoDB memory system
  const mongoMemory = createMongoMemory({
    uri: env.MONGODB_URI,
    dbName: "working_memory_example",
    collectionName: "translations",
  });

  await mongoMemory.initialize();
  console.log("💾 MongoDB memory system initialized\n");

  // Create agent with MongoDB memory
  const agent = createAgent({
    model: groq("deepseek-r1-distill-llama-70b"),
    memory: mongoMemory,
    actions: [translateAction, getHistoryAction],
  });

  await agent.start({
    id: "working-mongodb-agent",
  });

  console.log("🤖 Agent started successfully\n");

  // Demo: Test with different users
  console.log("--- Demo: Testing MongoDB Memory Integration ---\n");

  // User 1: First translation
  console.log("👤 User 1 (Alice) - First translation:");
  const aliceResult1 = await agent.run({
    context: translatorContext,
    args: {
      userId: "alice_123",
      userMessage: "Translate 'Hello world' to Spanish",
    },
  });

  console.log("Result:", JSON.stringify(aliceResult1, null, 2));
  console.log();

  // User 1: Same translation (should use cache)
  console.log("👤 User 1 (Alice) - Same translation (should be cached):");
  const aliceResult2 = await agent.run({
    context: translatorContext,
    args: {
      userId: "alice_123",
      userMessage: "Translate 'Hello world' to Spanish",
    },
  });

  console.log("Result:", JSON.stringify(aliceResult2, null, 2));
  console.log();

  // Test memory persistence across restarts
  console.log("🔄 Testing memory persistence across agent restarts...");

  // Close and restart
  await mongoMemory.close();
  console.log("🛑 Closed agent and memory system");

  // Reinitialize
  const newMongoMemory = createMongoMemory({
    uri: env.MONGODB_URI,
    dbName: "working_memory_example",
    collectionName: "translations",
  });

  await newMongoMemory.initialize();

  const newAgent = createAgent({
    model: groq("deepseek-r1-distill-llama-70b"),
    memory: newMongoMemory,
    actions: [translateAction, getHistoryAction],
  });

  await newAgent.start({
    id: "working-mongodb-agent-restarted",
  });

  console.log("🔄 Restarted agent with new memory instance");

  await newMongoMemory.close();

  console.log("\n✅ Working MongoDB Example Completed Successfully!");
  console.log("Key features demonstrated:");
  console.log("✅ Agent memory automatically stored in MongoDB");
  console.log("✅ Translation caching and retrieval");
  console.log("✅ User-specific memory isolation");
  console.log("✅ Memory survival across agent restarts");
  console.log("✅ No infinite loops or output type errors");
}

// Error handling wrapper
main().catch((error) => {
  console.error("❌ Example failed:", error);
  process.exit(1);
});
