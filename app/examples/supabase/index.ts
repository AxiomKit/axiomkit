import { createGroq } from "@ai-sdk/groq";
import { createAgent, validateEnv } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";

import dotenv from "dotenv";
import { createSupabaseMemory } from "@axiomkit/supabase";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment validation
 */
const env = {
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
};

if (!env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY environment variable is required");
}

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
  namespace: "karas",
  // Enable automatic database setup
  autoSetup: true,
  setupOptions: {
    createTables: true,
    createFunctions: true,
    schema: "public",
  },
});

const chatCliExtension = createCliExtension({
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
  model: groq("deepseek-r1-distill-llama-70b"),
  memory: memorySystem,
  extensions: [chatCliExtension],
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
