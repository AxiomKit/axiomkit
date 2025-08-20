#!/usr/bin/env tsx

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@axiomkit/core";

import chalk from "chalk";

/**
 * Episodic Memory Example - Learning from Experiences
 *
 * This example demonstrates how episodic memory stores and recalls
 * past experiences, allowing the agent to learn from interactions.
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

  console.log(
    chalk.blue("🧠 Episodic Memory Example - Learning from Experiences")
  );
  console.log(
    chalk.gray("Storing and recalling past experiences to improve responses.\n")
  );

  // Record some past experiences
  console.log(chalk.yellow("Recording past experiences..."));

  const pastExperiences = [
    {
      title: "User prefers short explanations",
      content:
        "The user asked for a simple explanation of React and seemed satisfied with a brief, concise response. They prefer quick, to-the-point answers.",
      emotions: ["helpful", "satisfied"],
      tags: ["preference", "communication_style", "react"],
    },
    {
      title: "User struggled with TypeScript",
      content:
        "The user had difficulty understanding TypeScript interfaces. They needed multiple examples and step-by-step explanations. They learn better with practical examples.",
      emotions: ["frustrated", "confused"],
      tags: ["learning_style", "typescript", "difficulty"],
    },
    {
      title: "User loves gaming examples",
      content:
        "When I used gaming analogies to explain programming concepts, the user was very engaged and understood quickly. They seem to enjoy learning through game-related examples.",
      emotions: ["excited", "engaged"],
      tags: ["learning_style", "gaming", "analogies"],
    },
    {
      title: "User prefers dark mode",
      content:
        "The user mentioned they always use dark mode in their applications and prefer dark themes. They find light themes too bright and uncomfortable.",
      emotions: ["preference", "comfort"],
      tags: ["ui_preference", "dark_mode", "comfort"],
    },
    {
      title: "User is a visual learner",
      content:
        "The user asked for diagrams and visual representations when explaining complex concepts. They mentioned they learn better when they can see things visually.",
      emotions: ["interested", "curious"],
      tags: ["learning_style", "visual", "diagrams"],
    },
  ];

  // Store experiences in episodic memory
  for (const experience of pastExperiences) {
    await memory.episodes.store({
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contextId: "demo_context",
      type: "user_interaction",
      summary: experience.title,
      logs: [],
      metadata: {
        emotions: experience.emotions,
        tags: experience.tags,
        content: experience.content,
      },
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last week
      startTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      endTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    });
  }

  console.log(
    chalk.green(`✅ Recorded ${pastExperiences.length} experiences!\n`)
  );

  // Simulate new interactions that should trigger memory recall
  const newInteractions = [
    "Can you explain React hooks?",
    "I'm having trouble with TypeScript generics",
    "What's the best way to learn programming?",
    "Do you have any UI design tips?",
    "Can you explain async/await?",
    "What's your favorite programming language?",
    "I need help with CSS Grid",
  ];

  console.log(
    chalk.yellow("Starting new interactions (with memory recall)...\n")
  );

  for (const interaction of newInteractions) {
    console.log(chalk.cyan(`User: ${interaction}`));

    // Search for relevant past experiences
    const relevantExperiences = await memory.episodes.findSimilar(
      "demo_context",
      interaction,
      2
    );

    if (relevantExperiences.length > 0) {
      console.log(chalk.yellow("📚 Relevant past experiences:"));
      relevantExperiences.forEach((exp, index) => {
        console.log(
          chalk.gray(
            `${index + 1}. ${exp.summary} (${exp.metadata?.tags?.join(", ")})`
          )
        );
      });
    }

    // Generate response with context from past experiences
    let response = "I can help you with that!";
    if (relevantExperiences.length > 0) {
      const experience = relevantExperiences[0];
      if (experience.summary.includes("short explanations")) {
        response =
          "React hooks are functions that let you use state and other React features in functional components. They start with 'use'.";
      } else if (experience.summary.includes("TypeScript")) {
        response =
          "TypeScript generics can be tricky! Let me explain step by step with practical examples...";
      } else if (experience.summary.includes("gaming")) {
        response =
          "Think of programming like a game! Each concept is like a new level to master...";
      } else if (experience.summary.includes("dark mode")) {
        response =
          "For UI design, consider using dark themes since you prefer them. Here are some tips...";
      }
    }
    console.log(chalk.green(`Assistant: ${response}\n`));

    // Small delay for readability
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Show episodic memory statistics
  console.log(chalk.yellow("📊 Episodic Memory Statistics:"));
  console.log(chalk.gray(`Total Episodes: ${pastExperiences.length}`));
  console.log(
    chalk.gray(
      `Total Duration: ~${pastExperiences.length * 60000}ms (estimated)`
    )
  );
  console.log(
    chalk.gray(`Average Episode Length: ~150 characters (estimated)`)
  );

  // Show recent experiences
  console.log(chalk.yellow("\n📚 Recent Experiences:"));
  const recentExperiences = await memory.episodes.getByContext(
    "demo_context",
    3
  );
  recentExperiences.forEach((exp, index) => {
    console.log(chalk.gray(`${index + 1}. ${exp.summary}`));
    console.log(chalk.gray(`   Tags: ${exp.metadata?.tags?.join(", ")}`));
    console.log(
      chalk.gray(`   Date: ${new Date(exp.timestamp).toLocaleDateString()}\n`)
    );
  });

  await memory.close();
  console.log(chalk.green("\n✅ Episodic memory example completed!"));
}

main().catch(console.error);
