#!/usr/bin/env tsx

import { createAgent } from "@axiomkit/core";
import { MemorySystem, InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from "@axiomkit/core";
import { anthropic } from "@ai-sdk/anthropic";
import chalk from "chalk";

/**
 * Working Memory Example - Conversation Context
 * 
 * This example demonstrates how working memory maintains conversation context
 * during a chat session. The agent remembers the current topic and can
 * reference previous parts of the conversation.
 */

// Configure memory system
const memoryConfig = {
  providers: {
    kv: new InMemoryKeyValueProvider(),
    vector: new InMemoryVectorProvider(),
    graph: new InMemoryGraphProvider(),
  },
  logger: console,
};

const memory = new MemorySystem(memoryConfig);



async function main() {
  await memory.initialize();

  console.log(chalk.blue("🧠 Working Memory Example - Conversation Context"));
  console.log(chalk.gray("The agent will remember conversation context and topics.\n"));

  // Simulate a conversation with working memory
  const conversation = [
    "Hello! I'm interested in learning about TypeScript.",
    "What are the main benefits of TypeScript over JavaScript?",
    "Can you give me some examples of TypeScript features?",
    "What about interfaces and types?",
    "Now let's talk about React instead.",
    "What are React hooks?",
    "Can you remind me what we were discussing before React?",
  ];

  console.log(chalk.yellow("Starting conversation simulation...\n"));

  for (let i = 0; i < conversation.length; i++) {
    const message = conversation[i];
    console.log(chalk.cyan(`User (${i + 1}): ${message}`));

    // Store current topic in conversation context (using KV memory)
    await memory.kv.set("conversation.current_topic", message);
    await memory.kv.set("conversation.step", i + 1);

    // Simulate AI response based on context
    const currentTopic = await memory.kv.get("conversation.current_topic");
    const step = await memory.kv.get("conversation.step");
    
    let response = "I understand you're asking about programming topics.";
    if (currentTopic.includes("TypeScript")) {
      response = "TypeScript is a great language! It adds static typing to JavaScript.";
    } else if (currentTopic.includes("React")) {
      response = "React is a powerful library for building user interfaces.";
    } else if (currentTopic.includes("before React")) {
      response = "Earlier we were discussing TypeScript and its benefits over JavaScript.";
    }
    
    console.log(chalk.green(`Assistant: ${response}\n`));

    // Small delay for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show conversation context contents
  console.log(chalk.yellow("📊 Conversation Context Contents:"));
  const currentTopic = await memory.kv.get("conversation.current_topic");
  const conversationStep = await memory.kv.get("conversation.step");
  
  console.log(chalk.gray(`Current Topic: ${currentTopic}`));
  console.log(chalk.gray(`Conversation Step: ${conversationStep}`));

  await memory.close();
  console.log(chalk.green("\n✅ Working memory example completed!"));
}

main().catch(console.error);
