#!/usr/bin/env node

/**
 * Simple Episodic Memory Example - Axiom Framework Showcase
 *
 * This example demonstrates the core effectiveness of the Axiom framework's
 * memory system through a practical conversation scenario. It showcases:
 *
 * 🧠 EPISODIC MEMORY: How Axiom captures and stores conversation context
 * 🔍 SEMANTIC SEARCH: Finding relevant past conversations using natural language
 * 💾 PERSISTENT STORAGE: Storing and retrieving user preferences across sessions
 * 🎯 CONTEXTUAL AWARENESS: Using stored memories to provide personalized responses
 *
 * The Axiom framework excels at creating AI agents that remember and learn
 * from interactions, making conversations more natural and contextually aware.
 */

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@axiomkit/core";
import chalk from "chalk";

/**
 * 🏗️ AXIOM FRAMEWORK INITIALIZATION
 *
 * The MemorySystem is the heart of Axiom's intelligence. It combines three
 * powerful storage mechanisms:
 *
 * - KeyValueProvider: Fast lookup for structured data (user preferences, settings)
 * - VectorProvider: Semantic search for finding similar conversations and content
 * - GraphProvider: Relationship mapping between entities and concepts
 *
 * This multi-modal approach allows Axiom to handle both exact matches and
 * fuzzy, context-aware retrieval - something traditional databases can't do.
 */
const memory = new MemorySystem({
  providers: {
    kv: new InMemoryKeyValueProvider(), // Lightning-fast key-value storage
    vector: new InMemoryVectorProvider(), // Semantic similarity search
    graph: new InMemoryGraphProvider(), // Relationship and entity mapping
  },
});

async function simpleExample() {
  console.log(chalk.blue.bold("🧠 Episodic Memory Example"));
  console.log(chalk.gray("=====================================\n"));

  /**
   * 🚀 AXIOM MEMORY INITIALIZATION
   *
   * This single call sets up the entire memory infrastructure. Axiom handles
   * all the complexity of initializing vector embeddings, graph connections,
   * and storage systems behind the scenes. No configuration needed!
   */
  await memory.initialize();

  const contextId = "simple-conversation";
  const userId = "user-123";

  /**
   * 💬 CONVERSATION SIMULATION
   *
   * This represents a real conversation between a user and an AI agent.
   * Notice how Axiom captures the natural flow of dialogue with timestamps
   * and proper attribution (input/output). This structure allows Axiom to:
   *
   * - Understand conversation context and flow
   * - Track user preferences and patterns
   * - Build a comprehensive memory of interactions
   * - Enable context-aware responses in future conversations
   */
  const conversationLogs = [
    {
      id: `input-${Date.now()}-1`,
      ref: "input",
      content: "Hi! I love pizza and Italian food.",
      timestamp: Date.now() - 10000,
    },
    {
      id: `output-${Date.now()}-1`,
      ref: "output",
      content: "That's great! What's your favorite type of pizza?",
      timestamp: Date.now() - 8000,
    },
    {
      id: `input-${Date.now()}-2`,
      ref: "input",
      content:
        "I really like margherita and pepperoni. I'm not a fan of seafood though.",
      timestamp: Date.now() - 6000,
    },
    {
      id: `output-${Date.now()}-2`,
      ref: "output",
      content:
        "Perfect! I'll remember your preferences for future recommendations.",
      timestamp: Date.now() - 4000,
    },
  ];

  /**
   * 🧠 EPISODIC MEMORY CREATION - AXIOM'S INTELLIGENCE IN ACTION
   *
   * This is where Axiom's magic happens! The createFromLogs method:
   *
   * 1. Analyzes the conversation flow and context
   * 2. Extracts key information and relationships
   * 3. Generates a semantic summary automatically
   * 4. Creates embeddings for similarity search
   * 5. Builds graph connections between entities
   *
   * The metadata (userId, sessionId, topic, mood) helps Axiom understand
   * the context and enables sophisticated querying later. This is what
   * makes Axiom different from simple chat logs - it creates intelligent,
   * searchable memories.
   */
  const episode = await memory.episodes.createFromLogs(
    contextId,
    conversationLogs,
    {
      userId,
      sessionId: "session-1",
      topic: "food-preferences",
      mood: "happy",
    },
    {} as any // Mock agent
  );

  /**
   * 💾 EPISODE STORAGE - PERSISTENT INTELLIGENCE
   *
   * Axiom stores the episode across multiple storage systems:
   * - Vector store: For semantic similarity search
   * - Graph store: For relationship mapping
   * - Key-value store: For fast metadata access
   *
   * The unique episode ID allows Axiom to retrieve and reference this
   * conversation in future interactions, creating continuity.
   */
  const episodeId = await memory.episodes.store(episode);
  console.log(chalk.green(`✅ Stored episode: ${episodeId}`));
  console.log(chalk.cyan(`📝 Summary: ${episode.summary}\n`));

  /**
   * 🎯 STRUCTURED DATA STORAGE - USER PREFERENCES
   *
   * Axiom's key-value provider excels at storing structured user data.
   * This approach allows for:
   * - Fast retrieval of user preferences
   * - Easy updates and modifications
   * - Cross-session persistence
   * - Integration with other Axiom memory types
   *
   * The hierarchical key structure (user:userId:preferences) enables
   * efficient organization and querying of user-specific data.
   */
  const userPreferences = {
    name: "User 123",
    favoriteFoods: ["pizza", "margherita", "pepperoni", "italian food"],
    dislikes: ["seafood"],
  };

  await memory.kv.set(`user:${userId}:preferences`, userPreferences);
  console.log(chalk.green(`✅ Stored user preferences\n`));

  /**
   * 🔍 SEMANTIC SEARCH - AXIOM'S INTELLIGENT RETRIEVAL
   *
   * This demonstrates Axiom's most powerful feature: semantic similarity search.
   * When a user asks "What should I eat for dinner?", Axiom:
   *
   * 1. Converts the query into vector embeddings
   * 2. Searches through all stored episodes for semantic similarity
   * 3. Finds conversations about food preferences (even if worded differently)
   * 4. Returns the most relevant past conversations
   *
   * This is what makes Axiom revolutionary - it understands MEANING, not just
   * keywords. Traditional databases would miss this connection entirely.
   */
  const newQuery = "What should I eat for dinner?";
  const similarEpisodes = await memory.episodes.findSimilar(
    contextId,
    newQuery,
    1
  );

  console.log(chalk.blue(`🔍 Query: "${newQuery}"`));
  if (similarEpisodes.length > 0) {
    console.log(chalk.green(`📋 Found relevant episode:`));
    console.log(chalk.gray(`   Summary: ${similarEpisodes[0].summary}`));
  }

  /**
   * ⚡ LIGHTNING-FAST PREFERENCE RETRIEVAL
   *
   * Axiom's key-value store provides instant access to user preferences.
   * This enables AI agents to:
   * - Provide personalized recommendations immediately
   * - Remember user preferences across sessions
   * - Adapt responses based on stored knowledge
   * - Create truly personalized experiences
   *
   * The combination of semantic search (for context) and key-value storage
   * (for facts) gives Axiom-powered agents both intelligence and speed.
   */
  const preferences = await memory.kv.get(`user:${userId}:preferences`);
  if (preferences) {
    console.log(chalk.green(`\n👤 User preferences:`));
    console.log(
      chalk.gray(`   Favorite foods: ${preferences.favoriteFoods.join(", ")}`)
    );
    console.log(chalk.gray(`   Dislikes: ${preferences.dislikes.join(", ")}`));
  }

  /**
   * 🧹 GRACEFUL CLEANUP - AXIOM'S RELIABILITY
   *
   * Axiom handles resource cleanup automatically, ensuring:
   * - No memory leaks
   * - Proper connection closure
   * - Clean shutdown procedures
   * - Production-ready reliability
   *
   * This attention to detail makes Axiom suitable for both development
   * and production environments.
   */
  await memory.close();
  console.log(chalk.gray("\n🧹 Memory system closed"));
}

/**
 * 🎯 AXIOM FRAMEWORK EFFECTIVENESS SUMMARY
 *
 * This simple example demonstrates why Axiom is revolutionary for AI development:
 *
 * ✅ SIMPLICITY: Just a few lines of code to create intelligent, memory-enabled agents
 * ✅ INTELLIGENCE: Semantic understanding that goes beyond keyword matching
 * ✅ PERSISTENCE: Memories that survive across sessions and interactions
 * ✅ PERSONALIZATION: Context-aware responses based on user history
 * ✅ PERFORMANCE: Multi-modal storage optimized for different use cases
 * ✅ RELIABILITY: Production-ready with proper resource management
 *
 * Traditional AI systems require complex database schemas, manual embedding
 * management, and custom similarity search implementations. Axiom handles
 * all of this automatically, letting developers focus on building great
 * user experiences instead of infrastructure.
 *
 */

simpleExample();
