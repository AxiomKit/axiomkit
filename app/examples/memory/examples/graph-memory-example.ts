import {
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
} from "@axiomkit/core";

import chalk from "chalk";

/**
 * Graph Memory Example - Social Network Relationships
 *
 * This example demonstrates how graph memory stores relationships
 * between entities, like a social network or organizational structure.
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

  console.log(chalk.blue("🕸️ Graph Memory Example - Social Network"));
  console.log(
    chalk.gray("Managing relationships between people and entities.\n")
  );

  // Create a social network
  console.log(chalk.yellow("Building social network..."));

  // Add people nodes
  const people = [
    { id: "alice", name: "Alice", type: "person", role: "developer" },
    { id: "bob", name: "Bob", type: "person", role: "designer" },
    { id: "charlie", name: "Charlie", type: "person", role: "manager" },
    { id: "diana", name: "Diana", type: "person", role: "developer" },
    { id: "eve", name: "Eve", type: "person", role: "designer" },
    { id: "frank", name: "Frank", type: "person", role: "developer" },
  ];

  // Add company nodes
  const companies = [
    { id: "techcorp", name: "TechCorp", type: "company", industry: "software" },
    {
      id: "designstudio",
      name: "DesignStudio",
      type: "company",
      industry: "design",
    },
    { id: "startup", name: "StartupXYZ", type: "company", industry: "tech" },
  ];

  // Add skill nodes
  const skills = [
    { id: "react", name: "React", type: "skill", category: "frontend" },
    { id: "nodejs", name: "Node.js", type: "skill", category: "backend" },
    { id: "figma", name: "Figma", type: "skill", category: "design" },
    { id: "python", name: "Python", type: "skill", category: "programming" },
  ];

  // Add all entities to the graph
  for (const person of people) {
    await memory.graph.addEntity({
      id: person.id,
      type: person.type,
      name: person.name,
      properties: { role: person.role },
    });
  }
  for (const company of companies) {
    await memory.graph.addEntity({
      id: company.id,
      type: company.type,
      name: company.name,
      properties: { industry: company.industry },
    });
  }
  for (const skill of skills) {
    await memory.graph.addEntity({
      id: skill.id,
      type: skill.type,
      name: skill.name,
      properties: { category: skill.category },
    });
  }

  // Add relationships
  const relationships = [
    // Work relationships
    { from: "alice", to: "techcorp", type: "works_at" },
    { from: "bob", to: "designstudio", type: "works_at" },
    { from: "charlie", to: "startup", type: "works_at" },
    { from: "diana", to: "techcorp", type: "works_at" },
    { from: "eve", to: "designstudio", type: "works_at" },
    { from: "frank", to: "startup", type: "works_at" },

    // Friendships
    { from: "alice", to: "bob", type: "friends_with" },
    { from: "alice", to: "charlie", type: "friends_with" },
    { from: "bob", to: "eve", type: "friends_with" },
    { from: "charlie", to: "frank", type: "friends_with" },
    { from: "diana", to: "alice", type: "friends_with" },
    { from: "eve", to: "diana", type: "friends_with" },

    // Skills
    { from: "alice", to: "react", type: "knows" },
    { from: "alice", to: "nodejs", type: "knows" },
    { from: "bob", to: "figma", type: "knows" },
    { from: "charlie", to: "python", type: "knows" },
    { from: "diana", to: "react", type: "knows" },
    { from: "eve", to: "figma", type: "knows" },
    { from: "frank", to: "nodejs", type: "knows" },
  ];

  // Add all relationships
  for (const rel of relationships) {
    await memory.graph.addRelationship({
      id: `${rel.from}_${rel.to}_${rel.type}`,
      from: rel.from,
      to: rel.to,
      type: rel.type,
      strength: 1.0,
    });
  }

  console.log(
    chalk.green(
      `✅ Created network with ${
        people.length + companies.length + skills.length
      } nodes and ${relationships.length} relationships!\n`
    )
  );

  // Simulate network queries
  const networkQueries = [
    "Who does Alice work with?",
    "What skills does Bob have?",
    "Who are Alice's friends?",
    "Which company does Charlie work for?",
    "Who knows React?",
    "What are the connections between Alice and Eve?",
    "Show me all developers",
    "Who works at TechCorp?",
  ];

  console.log(chalk.yellow("Analyzing network relationships...\n"));

  for (const query of networkQueries) {
    console.log(chalk.cyan(`Query: "${query}"`));

    let result = "";

    if (query.includes("Alice work with")) {
      const aliceWork = await memory.graph.findRelated("alice", "works_at");
      result = `Alice works at: ${aliceWork.map((e) => e.name).join(", ")}`;
    } else if (query.includes("Bob have")) {
      const bobSkills = await memory.graph.findRelated("bob", "knows");
      result = `Bob knows: ${bobSkills.map((e) => e.name).join(", ")}`;
    } else if (query.includes("Alice's friends")) {
      const aliceFriends = await memory.graph.findRelated(
        "alice",
        "friends_with"
      );
      result = `Alice's friends: ${aliceFriends.map((e) => e.name).join(", ")}`;
    } else if (query.includes("Charlie work for")) {
      const charlieWork = await memory.graph.findRelated("charlie", "works_at");
      result = `Charlie works at: ${charlieWork.map((e) => e.name).join(", ")}`;
    } else if (query.includes("knows React")) {
      const reactSkills = await memory.graph.findRelated("react", "knows");
      result = `People who know React: ${reactSkills
        .map((e) => e.name)
        .join(", ")}`;
    } else if (query.includes("developers")) {
      const developers = people
        .filter((p) => p.role === "developer")
        .map((p) => p.name);
      result = `Developers: ${developers.join(", ")}`;
    } else if (query.includes("TechCorp")) {
      const techcorpEmployees = await memory.graph.findRelated(
        "techcorp",
        "works_at"
      );
      result = `TechCorp employees: ${techcorpEmployees
        .map((e) => e.name)
        .join(", ")}`;
    } else {
      result = "I can help you analyze the social network relationships.";
    }

    console.log(chalk.green(`Answer: ${result}\n`));

    // Small delay for readability
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Show graph statistics
  console.log(chalk.yellow("📊 Graph Memory Statistics:"));
  console.log(
    chalk.gray(
      `Total Entities: ${people.length + companies.length + skills.length}`
    )
  );
  console.log(chalk.gray(`Total Relationships: ${relationships.length}`));

  await memory.close();
  console.log(chalk.green("\n✅ Graph memory example completed!"));
}

main().catch(console.error);
