import { createMongoMemory } from "@axiomkit/mongodb";

/**
 * Simple MongoDB Memory Example
 * 
 * This example demonstrates basic usage of MongoDB memory without requiring
 * the full AxiomKit agent setup. It shows how to store and retrieve data
 * using MongoDB as a persistent memory store.
 */

async function simpleExample() {
  console.log("🚀 Simple MongoDB Memory Example");
  
  // Create MongoDB memory system
  const memory = createMongoMemory({
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/simple_example",
    dbName: "simple_example",
    collectionName: "data",
  });

  try {
    // Initialize the memory system
    console.log("📡 Initializing memory system...");
    await memory.initialize();

    // Store some data
    console.log("\n📝 Storing data...");
    await memory.kv.set("user:john", {
      name: "John Doe",
      email: "john@example.com",
      preferences: { theme: "dark", language: "en" },
      lastLogin: new Date(),
    });

    await memory.kv.set("user:jane", {
      name: "Jane Smith",
      email: "jane@example.com",
      preferences: { theme: "light", language: "es" },
      lastLogin: new Date(),
    });

    // Store data with TTL (expires in 1 hour)
    await memory.kv.set("session:temp", {
      sessionId: "abc123",
      userId: "john",
      expiresAt: new Date(Date.now() + 3600000),
    }, { ttl: 3600 });

    console.log("✅ Data stored successfully");

    // Retrieve data
    console.log("\n📖 Retrieving data...");
    const john = await memory.kv.get("user:john");
    const jane = await memory.kv.get("user:jane");
    const session = await memory.kv.get("session:temp");

    console.log("John's data:", john);
    console.log("Jane's data:", jane);
    console.log("Session data:", session);

    // Check if keys exist
    console.log("\n🔍 Checking key existence...");
    const johnExists = await memory.kv.exists("user:john");
    const unknownExists = await memory.kv.exists("user:unknown");
    
    console.log("John exists:", johnExists);
    console.log("Unknown user exists:", unknownExists);

    // Get all user keys
    console.log("\n📋 Getting user keys...");
    const userKeys = await memory.kv.keys("user:*");
    console.log("User keys:", userKeys);

    // Count users
    console.log("\n🔢 Counting users...");
    const userCount = await memory.kv.count("user:*");
    console.log("Number of users:", userCount);

    // Store individual products
    console.log("\n📦 Storing products...");
    await memory.kv.set("product:laptop", { name: "MacBook Pro", price: 1299, category: "electronics" });
    await memory.kv.set("product:phone", { name: "iPhone 15", price: 799, category: "electronics" });
    await memory.kv.set("product:book", { name: "The Art of Programming", price: 49, category: "books" });
    console.log("✅ Products stored");

    // Retrieve products individually
    const laptop = await memory.kv.get("product:laptop");
    const phone = await memory.kv.get("product:phone");
    const book = await memory.kv.get("product:book");
    console.log("Retrieved products:", { laptop, phone, book });

    // Scan through data
    console.log("\n🔍 Scanning all data...");
    const scanner = memory.kv.scan();
    let count = 0;
    let result = await scanner.next();
    while (!result.done && count < 5) {
      const [key, value] = result.value;
      console.log(`${key}:`, value);
      count++;
      result = await scanner.next();
    }

    // Clean up
    console.log("\n🧹 Cleaning up...");
    await memory.kv.delete("user:john");
    await memory.kv.delete("user:jane");
    await memory.kv.delete("session:temp");
    await memory.kv.delete("product:laptop");
    await memory.kv.delete("product:phone");
    await memory.kv.delete("product:book");
    
    console.log("✅ Cleanup completed");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Close the connection
    await memory.close();
    console.log("🔌 Connection closed");
  }
}

// Run the example
simpleExample().catch(console.error);
