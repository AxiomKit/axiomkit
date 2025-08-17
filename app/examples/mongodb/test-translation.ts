import { createGroq } from "@ai-sdk/groq";
import * as z from "zod/v4";
import {
  createAgent,
  validateEnv,
  context,
} from "@axiomkit/core";
import { createMongoMemory } from "@axiomkit/mongodb";

/**
 * Test script to verify translation action works
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

// Translation action
const translateAction = {
  name: "translate",
  description: "Translate text from one language to another",
  schema: z.object({
    text: z.string().describe("The text to translate"),
    sourceLanguage: z.string().optional().describe("Source language (auto-detect if not specified)"),
    targetLanguage: z.string().describe("Target language for translation"),
  }),
  handler: async (args: any, ctx: any, agent: any) => {
    const { text, sourceLanguage, targetLanguage } = args;
    
    console.log(`🔧 Translating: "${text}" from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
    
    // Simple translation logic (in real app, use a translation API)
    const translations: Record<string, Record<string, string>> = {
      "hello": {
        "Spanish": "hola",
        "French": "bonjour",
        "German": "hallo",
        "Vietnamese": "xin chào",
        "Chinese": "你好",
        "Japanese": "こんにちは"
      },
      "good morning": {
        "Spanish": "buenos días",
        "French": "bonjour",
        "German": "guten morgen",
        "Vietnamese": "chào buổi sáng",
        "Chinese": "早上好",
        "Japanese": "おはようございます"
      }
    };
    
    const translation = translations[text.toLowerCase()]?.[targetLanguage] || `[${targetLanguage}] ${text}`;
    
    // Store in memory
    await agent.memory.kv.set(`translation:${Date.now()}`, {
      input: text,
      output: translation,
      sourceLanguage: sourceLanguage || "auto",
      targetLanguage,
      timestamp: Date.now(),
    });
    
    return {
      originalText: text,
      translatedText: translation,
      sourceLanguage: sourceLanguage || "auto",
      targetLanguage,
    };
  },
};

// Test context
const testContext = context({
  type: "test",
  schema: z.object({}),
  instructions: [
    "You are a helpful translation assistant.",
    "Use the translate action to translate text when users request it.",
    "Be friendly and helpful in your responses.",
  ],
});

async function testTranslation() {
  console.log("🧪 Testing Translation Action...");
  
  try {
    // Create MongoDB memory system
    const memorySystem = createMongoMemory({
      uri: env.MONGODB_URI,
      dbName: "test_translation",
      collectionName: "translations",
    });

    await memorySystem.initialize();

    // Create agent with translation action
    const agent = createAgent({
      model: groq("deepseek-r1-distill-llama-70b"),
      actions: [translateAction],
      memory: memorySystem,
    });

    await agent.start();

    // Test translations
    const testCases = [
      "translate hello to Spanish",
      "translate good morning to Vietnamese",
      "translate hello to French",
    ];

    for (const testCase of testCases) {
      console.log(`\n📝 Testing: "${testCase}"`);
      
      const result = await agent.run({
        context: testContext,
        args: {},
        input: testCase,
      });
      
      console.log("✅ Result:", result);
    }

    // Show stored translations
    console.log("\n📊 Stored Translations:");
    const keys = await memorySystem.kv.keys("translation:*");
    for (const key of keys) {
      const translation = await memorySystem.kv.get(key);
      console.log(`  ${key}:`, translation);
    }

    await memorySystem.close();
    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testTranslation().catch(console.error);
