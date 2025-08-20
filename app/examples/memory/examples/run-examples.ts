#!/usr/bin/env tsx

import chalk from "chalk";

const examples = {
  "working": "Working Memory - Conversation Context",
  "kv": "Key-Value Memory - User Preferences",
  "vector": "Vector Memory - Knowledge Base Search", 
  "graph": "Graph Memory - Social Network",
  "episodic": "Episodic Memory - Learning from Experiences",
};

async function runExample(type: string) {
  console.log(chalk.blue(`🚀 Running ${examples[type as keyof typeof examples]} Example\n`));
  
  try {
    switch (type) {
      case "working":
        await import("./working-memory-example.ts");
        break;
      case "kv":
        await import("./kv-memory-example.ts");
        break;
      case "vector":
        await import("./vector-memory-example.ts");
        break;
      case "graph":
        await import("./graph-memory-example.ts");
        break;
      case "episodic":
        await import("./episodic-memory-example.ts");
        break;
      default:
        console.log(chalk.red(`❌ Unknown example type: ${type}`));
        console.log(chalk.yellow("Available examples:"));
        Object.entries(examples).forEach(([key, desc]) => {
          console.log(chalk.gray(`  ${key}: ${desc}`));
        });
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error running ${type} example:`), error);
    process.exit(1);
  }
}

async function showHelp() {
  console.log(chalk.blue("🧠 AxiomKit Memory Examples"));
  console.log(chalk.gray("Simple CLI examples demonstrating different memory types.\n"));
  
  console.log(chalk.yellow("Available Examples:"));
  Object.entries(examples).forEach(([key, desc]) => {
    console.log(chalk.gray(`  ${key}: ${desc}`));
  });
  
  console.log(chalk.yellow("\nUsage:"));
  console.log(chalk.gray("  npx tsx run-examples.ts <type>"));
  console.log(chalk.gray("  npx tsx run-examples.ts --all"));
  console.log(chalk.gray("  npx tsx run-examples.ts --help"));
  
  console.log(chalk.yellow("\nExamples:"));
  console.log(chalk.gray("  npx tsx run-examples.ts working"));
  console.log(chalk.gray("  npx tsx run-examples.ts kv"));
  console.log(chalk.gray("  npx tsx run-examples.ts vector"));
  console.log(chalk.gray("  npx tsx run-examples.ts graph"));
  console.log(chalk.gray("  npx tsx run-examples.ts episodic"));
}

async function runAllExamples() {
  console.log(chalk.blue("🚀 Running All Memory Examples\n"));
  
  for (const [type, desc] of Object.entries(examples)) {
    console.log(chalk.yellow(`\n${"=".repeat(50)}`));
    console.log(chalk.blue(`Running: ${desc}`));
    console.log(chalk.yellow(`${"=".repeat(50)}\n`));
    
    try {
      await runExample(type);
      console.log(chalk.green(`✅ ${desc} completed successfully!\n`));
    } catch (error) {
      console.error(chalk.red(`❌ ${desc} failed:`), error);
    }
    
    // Small delay between examples
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(chalk.green("🎉 All examples completed!"));
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  showHelp();
} else if (args.includes("--all")) {
  runAllExamples();
} else {
  const type = args[0];
  runExample(type);
}
