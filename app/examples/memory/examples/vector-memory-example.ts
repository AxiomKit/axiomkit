#!/usr/bin/env tsx

import { createAgent } from "@axiomkit/core";
import { MemorySystem, InMemoryKeyValueProvider, InMemoryVectorProvider, InMemoryGraphProvider } from "@axiomkit/core";
import { anthropic } from "@ai-sdk/anthropic";
import chalk from "chalk";

/**
 * Vector Memory Example - Knowledge Base Search
 * 
 * This example demonstrates how vector memory enables semantic search
 * through a knowledge base of documents and information.
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

  console.log(chalk.blue("🔍 Vector Memory Example - Knowledge Base Search"));
  console.log(chalk.gray("Semantic search through a knowledge base of documents.\n"));

  // Create a knowledge base with various documents
  console.log(chalk.yellow("Creating knowledge base..."));
  const knowledgeBase = [
    {
      id: "doc_1",
      content: "React is a JavaScript library for building user interfaces. It was created by Facebook and is used to create interactive web applications.",
      metadata: { category: "programming", topic: "react", difficulty: "beginner" }
    },
    {
      id: "doc_2", 
      content: "TypeScript is a superset of JavaScript that adds static typing. It helps catch errors at compile time and improves code quality.",
      metadata: { category: "programming", topic: "typescript", difficulty: "intermediate" }
    },
    {
      id: "doc_3",
      content: "Node.js is a JavaScript runtime that allows you to run JavaScript on the server side. It's built on Chrome's V8 engine.",
      metadata: { category: "programming", topic: "nodejs", difficulty: "intermediate" }
    },
    {
      id: "doc_4",
      content: "MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. It's popular for web applications.",
      metadata: { category: "database", topic: "mongodb", difficulty: "intermediate" }
    },
    {
      id: "doc_5",
      content: "Docker is a platform for developing, shipping, and running applications in containers. It makes deployment consistent.",
      metadata: { category: "devops", topic: "docker", difficulty: "advanced" }
    },
    {
      id: "doc_6",
      content: "Git is a distributed version control system. It helps track changes in code and collaborate with other developers.",
      metadata: { category: "tools", topic: "git", difficulty: "beginner" }
    },
    {
      id: "doc_7",
      content: "JavaScript is a programming language that runs in web browsers. It's used for creating interactive websites and web applications.",
      metadata: { category: "programming", topic: "javascript", difficulty: "beginner" }
    },
    {
      id: "doc_8",
      content: "Python is a high-level programming language known for its simplicity and readability. It's used in web development, data science, and AI.",
      metadata: { category: "programming", topic: "python", difficulty: "beginner" }
    }
  ];

  // Index the knowledge base in vector memory
  await memory.vector.index(knowledgeBase);
  console.log(chalk.green(`✅ Indexed ${knowledgeBase.length} documents!\n`));

  // Simulate search queries
  const searchQueries = [
    "What is React?",
    "Tell me about TypeScript",
    "How does Node.js work?",
    "What is MongoDB used for?",
    "Explain Docker containers",
    "How do I use Git?",
    "What programming language should I learn first?",
    "Tell me about Python",
  ];

  console.log(chalk.yellow("Starting semantic search queries...\n"));

  for (const query of searchQueries) {
    console.log(chalk.cyan(`Search Query: "${query}"`));
    
    // Perform semantic search
    const searchResults = await memory.vector.search(query, { limit: 3 });
    
    console.log(chalk.green("Top Results:"));
    if (searchResults.length > 0) {
      searchResults.forEach((result, index) => {
        const content = result.content || result.text || "No content available";
        const score = result.score || 0;
        console.log(chalk.gray(`${index + 1}. [Score: ${score.toFixed(3)}] ${content.substring(0, 80)}...`));
      });
    } else {
      console.log(chalk.gray("No relevant results found."));
    }
    
    // Generate response based on search results
    let response = "Based on the search results, here's what I found:";
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      const content = topResult.content || topResult.text || "No content available";
      response = `Based on the search results, ${content.substring(0, 100)}...`;
    } else {
      response = "I couldn't find any relevant information for that query.";
    }
    console.log(chalk.green(`AI Response: ${response}\n`));
    
    // Small delay for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show vector memory statistics
  console.log(chalk.yellow("📊 Vector Memory Statistics:"));
  console.log(chalk.gray(`Total Documents: ${knowledgeBase.length}`));
  console.log(chalk.gray(`Index Size: ~${knowledgeBase.length * 100} bytes (estimated)`));

  await memory.close();
  console.log(chalk.green("\n✅ Vector memory example completed!"));
}

main().catch(console.error);
