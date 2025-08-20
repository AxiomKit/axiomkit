#!/usr/bin/env tsx

import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@axiomkit/core";

import chalk from "chalk";

/**
 * Key-Value Memory Example - User Preferences & Settings
 *
 * This example demonstrates how key-value memory stores user preferences,
 * settings, and quick facts that can be retrieved instantly.
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

  console.log(chalk.blue("🔑 Key-Value Memory Example - User Preferences"));
  console.log(
    chalk.gray("Storing and retrieving user preferences and settings.\n")
  );

  // Store some initial user preferences
  console.log(chalk.yellow("Setting up user preferences..."));
  await memory.kv.set("user.preferences.theme", "dark");
  await memory.kv.set("user.preferences.language", "en");
  await memory.kv.set("user.preferences.notifications", true);
  await memory.kv.set("user.favorites.color", "blue");
  await memory.kv.set("user.favorites.food", "pizza");
  await memory.kv.set("user.game.progress.level", 5);
  await memory.kv.set("user.game.achievements", ["first_win", "speed_runner"]);
  console.log(chalk.green("✅ Preferences stored!\n"));

  // Simulate user interactions
  const interactions = [
    "What's my favorite color?",
    "Change my theme to light mode",
    "What level am I in the game?",
    "Add 'collector' to my achievements",
    "What are my current preferences?",
    "Set my favorite food to sushi",
    "Show me all my achievements",
  ];

  console.log(chalk.yellow("Starting user interactions...\n"));

  for (const interaction of interactions) {
    console.log(chalk.cyan(`User: ${interaction}`));

    // Process the interaction
    if (interaction.includes("What's my favorite color")) {
      const color = await memory.kv.get("user.favorites.color");
      console.log(chalk.green(`✅ Your favorite color is: ${color}`));
    } else if (interaction.includes("Change my theme")) {
      await memory.kv.set("user.preferences.theme", "light");
      console.log(chalk.green("✅ Theme changed to light mode"));
    } else if (interaction.includes("What level am I")) {
      const level = await memory.kv.get("user.game.progress.level");
      console.log(chalk.green(`✅ You are at level: ${level}`));
    } else if (interaction.includes("Add 'collector'")) {
      const achievements =
        (await memory.kv.get("user.game.achievements")) || [];
      achievements.push("collector");
      await memory.kv.set("user.game.achievements", achievements);
      console.log(chalk.green("✅ Achievement 'collector' added!"));
    } else if (interaction.includes("What are my current preferences")) {
      const theme = await memory.kv.get("user.preferences.theme");
      const language = await memory.kv.get("user.preferences.language");
      const notifications = await memory.kv.get(
        "user.preferences.notifications"
      );
      console.log(
        chalk.green(
          `✅ Your preferences: Theme=${theme}, Language=${language}, Notifications=${notifications}`
        )
      );
    } else if (interaction.includes("Set my favorite food")) {
      await memory.kv.set("user.favorites.food", "sushi");
      console.log(chalk.green("✅ Favorite food updated to sushi!"));
    } else if (interaction.includes("Show me all my achievements")) {
      const achievements =
        (await memory.kv.get("user.game.achievements")) || [];
      console.log(
        chalk.green(`✅ Your achievements: ${achievements.join(", ")}`)
      );
    }
    console.log();
  }

  // Show all stored preferences
  console.log(chalk.yellow("📊 All Stored Preferences:"));
  const allKeys = await memory.kv.keys();

  for (const key of allKeys) {
    const value = await memory.kv.get(key);
    console.log(chalk.gray(`${key}: ${JSON.stringify(value)}`));
  }

  await memory.close();
  console.log(chalk.green("\n✅ Key-value memory example completed!"));
}

main().catch(console.error);
