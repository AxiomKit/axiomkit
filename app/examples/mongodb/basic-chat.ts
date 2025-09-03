import { createGroq } from "@ai-sdk/groq";
import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { createMongoMemory } from "@axiomkit/mongodb";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment validation
 */
const env = {
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  MONGODB_URI: process.env.MONGODB_URI!,
};

if (!env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

if (!env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

/**
 * Create the AI model
 */
const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Create MongoDB memory system
 */
const memorySystem = createMongoMemory({
  uri: env.MONGODB_URI,
  dbName: "basic_chat",
  collectionName: "axiom-conversations",
});

/**
 * Create CLI extension for chat
 */
const chatCliExtension = createCliExtension({
  name: "chat",
  instructions: [
    "You are a helpful and friendly AI assistant.",
    "Respond naturally to user messages.",
    "Keep responses concise but informative.",
    "Be conversational and engaging.",
    "Always respond to the specific message the user sent.",
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

/**
 * Simple Chat Interface
 */
async function startChat() {
  console.log("🚀 Starting Basic Chat with MongoDB...");

  try {
    // Initialize memory system
    await memorySystem.initialize();
    console.log("✅ Memory system initialized");

    // Start the agent
    await agent.start();
    console.log("✅ Agent started successfully");

    console.log("💡 Chat is ready! Type your messages and press Enter.");
    console.log("💡 Type 'exit' to quit.\n");

    // The CLI extension will handle the chat automatically
    // It will show "> " prompt and handle user input/output
  } catch (error) {
    console.error("❌ Failed to start chat:", error);
    process.exit(1);
  }
}

// Start the chat
startChat().catch(console.error);
