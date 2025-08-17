import { createMongoMemory } from "@axiomkit/mongodb";
import * as z from "zod";

/**
 * Simple test to verify MongoDB memory functionality
 * Run this with: tsx test-memory.ts
 */

// Simple environment validation
const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/test",
};

async function testMongoMemory() {
  console.log("🧪 Testing MongoDB Memory System...");
  
  try {
    // Create MongoDB memory system
    const memorySystem = createMongoMemory({
      uri: env.MONGODB_URI,
      dbName: "test_memory",
      collectionName: "test_data",
    });

    // Initialize the memory system
    console.log("📡 Initializing memory system...");
    await memorySystem.initialize();

    // Test basic operations
    console.log("✅ Testing basic memory operations...");
    
    // Set a test value
    await memorySystem.kv.set("test:key", { message: "Hello MongoDB!", timestamp: Date.now() });
    console.log("✅ Set test value");

    // Get the test value
    const retrieved = await memorySystem.kv.get("test:key");
    console.log("✅ Retrieved value:", retrieved);

    // Test with TTL
    await memorySystem.kv.set("test:ttl", { expires: "soon" }, { ttl: 60 }); // 60 seconds
    console.log("✅ Set value with TTL");

    // Check if key exists
    const exists = await memorySystem.kv.exists("test:key");
    console.log("✅ Key exists:", exists);

    // Test individual operations
    await memorySystem.kv.set("batch:1", { id: 1, data: "first" });
    await memorySystem.kv.set("batch:2", { id: 2, data: "second" });
    await memorySystem.kv.set("batch:3", { id: 3, data: "third" });
    console.log("✅ Set individual test data");

    // Get individual data
    const batch1 = await memorySystem.kv.get("batch:1");
    const batch2 = await memorySystem.kv.get("batch:2");
    const batch3 = await memorySystem.kv.get("batch:3");
    console.log("✅ Retrieved individual data:", { batch1, batch2, batch3 });

    // Test keys pattern matching
    const keys = await memorySystem.kv.keys("batch:*");
    console.log("✅ Pattern keys:", keys);

    // Test count
    const count = await memorySystem.kv.count("batch:*");
    console.log("✅ Count:", count);

    // Test scan
    console.log("✅ Testing scan operation...");
    const scanner = memorySystem.kv.scan();
    let scanCount = 0;
    let result = await scanner.next();
    while (!result.done && scanCount < 10) {
      const [key, value] = result.value;
      console.log(`  ${key}:`, value);
      scanCount++;
      result = await scanner.next();
    }

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await memorySystem.kv.delete("test:key");
    await memorySystem.kv.delete("test:ttl");
    await memorySystem.kv.delete("batch:1");
    await memorySystem.kv.delete("batch:2");
    await memorySystem.kv.delete("batch:3");
    
    console.log("✅ Test completed successfully!");
    
    // Close the connection
    await memorySystem.close();
    console.log("🔌 Connection closed");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testMongoMemory().catch(console.error);
