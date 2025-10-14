import { createGroq } from "@ai-sdk/groq";
import { createAgent, validateEnv } from "@axiomkit/core";
import { createCliProvider } from "@axiomkit/cli";
import dotenv from "dotenv";
import { createSupabaseMemory } from "@axiomkit/supabase";
import { z } from "zod";

dotenv.config();

const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
    SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  })
);

/**
 * Create the AI model
 */
const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Create Supabase memory system with automatic setup
 */
const memorySystem = createSupabaseMemory({
  url: env.SUPABASE_URL,
  key: env.SUPABASE_ANON_KEY,
  // Use a custom namespace to avoid conflicts
  namespace: "axiomkit-example",
  // Enable automatic database setup
  autoSetup: true,
  setupOptions: {
    createTables: true,
    createFunctions: true,
    schema: "public",
  },
});

const chatCliProvider = createCliProvider({
  name: "chat",
  instructions: [
    "You are a helpful and friendly AI assistant.",
    "Respond naturally to user messages.",
    "Keep responses concise but informative.",
    "Be conversational and engaging.",
    "Always respond to the specific message the user sent.",
    "You can access the database to answer questions about stored data.",
  ],
});

/**
 * Create the AI agent
 */
const agent = createAgent({
  model: groq("qwen/qwen3-32b"),
  memory: memorySystem,
  providers: [chatCliProvider],
});

async function startChat() {
  console.log("🚀 Starting Enhanced Chat with Supabase...");
  console.log("📦 Using improved Supabase package with automatic setup");

  try {
    console.log("🔧 Initializing memory system...");
    await memorySystem.initialize();
    console.log("✅ Memory system initialized successfully");

    console.log("🚀 Starting agent...");
    await agent.start({
      id: "supabase-example",
    });
    console.log("✅ Agent started successfully");

    console.log("💡 Chat is ready! Type your messages and press Enter.");
    console.log("💡 Try asking about the database or stored data.");
    console.log("💡 Type 'exit' to quit.\n");
  } catch (error) {
    console.error("❌ Failed to start chat:", error);
    process.exit(1);
  }
}

startChat().catch(console.error);
