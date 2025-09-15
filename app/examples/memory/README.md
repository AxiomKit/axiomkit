# Episodic Memory Showcase - Axiom Framework

This example demonstrates the powerful episodic memory capabilities of the Axiom framework, showcasing how AI agents can learn, remember, and build upon previous conversations and experiences.

## 🧠 What is Episodic Memory?

Episodic memory in the Axiom framework allows AI agents to:

- **Store conversational episodes** as structured memories
- **Retrieve relevant context** from previous interactions
- **Learn user preferences** and adapt over time
- **Maintain continuity** across multiple sessions
- **Perform similarity searches** across past conversations
- **Build relationships** between concepts and entities

## 🚀 Features Demonstrated

### 1. Learning User Preferences
- Agents learn about user preferences through natural conversation
- Preferences are stored as structured episodes with metadata
- User profiles are maintained in key-value memory

### 2. Context Retrieval
- Intelligent similarity search across past conversations
- Retrieval of relevant episodes based on current context
- Integration with user profiles for personalized responses

### 3. Multi-Session Memory
- Continuity across multiple conversation sessions
- Progressive learning and profile updates
- Cross-session context awareness

### 4. Advanced Memory Operations
- Vector similarity search for content discovery
- Graph relationships between entities
- Structured data storage and retrieval

### 5. Memory Analytics
- Analysis of conversation patterns
- Memory usage statistics
- Health monitoring of memory systems

## 📁 File Structure

```
app/examples/memory/
├── episodic-memory-showcase.ts  # Main showcase script
├── package.json                 # Dependencies
└── README.md                   # This documentation
```

## 🛠️ Setup and Installation

1. **Install dependencies:**
   ```bash
   cd app/examples/memory
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Add your API keys to .env file
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

3. **Run the showcase:**
   ```bash
   npm run showcase
   # or
   npx tsx episodic-memory-showcase.ts
   ```

## 🎯 Scenarios Covered

### Scenario 1: Learning User Preferences
Demonstrates how the agent learns about user preferences through conversation and stores them as structured episodes.

**Key Features:**
- Episode creation from conversation logs
- User profile storage in key-value memory
- Metadata extraction and tagging

### Scenario 2: Context Retrieval
Shows how the agent retrieves relevant context from previous conversations using similarity search.

**Key Features:**
- Semantic similarity search
- Episode ranking by relevance
- User profile integration

### Scenario 3: Multi-Session Memory
Illustrates how the agent maintains context and learns progressively across multiple sessions.

**Key Features:**
- Cross-session continuity
- Progressive profile updates
- Session-based episode organization

### Scenario 4: Cross-Session Similarity Search
Demonstrates advanced search capabilities across multiple conversation sessions.

**Key Features:**
- Multi-context search
- Episode correlation
- Temporal relationship analysis

### Scenario 5: Memory Analytics
Provides insights into memory usage patterns and system health.

**Key Features:**
- Conversation statistics
- Topic analysis
- Memory system health monitoring

### Scenario 6: Advanced Memory Operations
Shows advanced capabilities including vector search and graph relationships.

**Key Features:**
- Vector similarity search
- Graph entity relationships
- Structured data indexing

## 🔧 Memory System Architecture

The Axiom memory system consists of multiple specialized memory types:

### Key-Value Memory
- **Purpose:** Fast storage and retrieval of structured data
- **Use Cases:** User profiles, session data, configuration
- **Provider:** In-memory implementation for examples

### Vector Memory
- **Purpose:** Semantic search and similarity matching
- **Use Cases:** Content discovery, episode retrieval, knowledge search
- **Provider:** In-memory vector store with similarity scoring

### Graph Memory
- **Purpose:** Relationship modeling and entity connections
- **Use Cases:** User preferences, concept relationships, knowledge graphs
- **Provider:** In-memory graph database

### Episodic Memory
- **Purpose:** Conversation episode management and retrieval
- **Use Cases:** Context awareness, learning from interactions
- **Features:** Automatic episode creation, similarity search, metadata extraction

## 📊 Example Output

```
🧠 Axiom Episodic Memory Showcase
=====================================

📚 Scenario 1: Learning User Preferences
The agent learns about user preferences and stores them as episodes

✅ Stored episode: episode:user-john-session-1:1234567890
📝 Summary: User discussed Italian food preferences, including love for pasta and pizza, preference for meat-based dishes over seafood, and vegetarian Mondays for environmental reasons.

✅ Stored user profile for john-doe

🔍 Scenario 2: Context Retrieval
The agent retrieves relevant context from previous conversations

🔎 Query: "What kind of restaurant should I go to tonight?"
📊 Found 1 similar episodes:

📋 Episode: episode:user-john-session-1:1234567890
   Summary: User discussed Italian food preferences...
   Duration: 80000ms
   Tags: food, preferences, italian

👤 Retrieved user profile:
   Name: John Doe
   Preferences: Italian food, pasta, pizza, carbonara, bolognese
   Interests: trying new cuisines
   Goals: environmental consciousness (vegetarian Mondays)
```

## 🎨 Customization

### Adding New Scenarios
You can extend the showcase by adding new scenarios:

```typescript
async function scenario7_CustomScenario() {
  console.log(chalk.yellow.bold('🎯 Scenario 7: Custom Scenario'));
  
  // Your custom logic here
  const episode = await memory.episodes.createFromLogs(
    contextId,
    conversationLogs,
    contextState,
    agent
  );
  
  // Store and analyze
  const episodeId = await memory.episodes.store(episode);
  console.log(chalk.green(`✅ Custom scenario completed: ${episodeId}`));
}
```

### Custom Memory Providers
Replace in-memory providers with persistent ones:

```typescript
import { RedisKeyValueProvider } from '@axiomkit/redis';
import { PineconeVectorProvider } from '@axiomkit/pinecone';

const memory = new MemorySystem({
  providers: {
    kv: new RedisKeyValueProvider({ url: 'redis://localhost:6379' }),
    vector: new PineconeVectorProvider({ apiKey: 'your-key' }),
    graph: new InMemoryGraphProvider(), // or use Neo4j
  },
});
```

### Custom Episode Hooks
Add custom logic for episode creation:

```typescript
const memory = new MemorySystem({
  providers: { /* ... */ },
  episodes: {
    hooks: {
      beforeCreate: async (logs, context, agent) => {
        // Custom preprocessing
        return logs;
      },
      afterCreate: async (episode, context, agent) => {
        // Custom postprocessing
        console.log(`Created episode: ${episode.id}`);
      }
    }
  }
});
```

## 🔍 API Reference

### EpisodicMemory Interface

```typescript
interface EpisodicMemory {
  // Store an episode
  store(episode: Episode): Promise<string>;
  
  // Find episodes similar to a query
  findSimilar(contextId: string, query: string, limit?: number): Promise<Episode[]>;
  
  // Get episode by ID
  get(episodeId: string): Promise<Episode | null>;
  
  // Get all episodes for a context
  getByContext(contextId: string, limit?: number): Promise<Episode[]>;
  
  // Create episode from logs
  createFromLogs(contextId: string, logs: AnyRef[], contextState: ContextState, agent: AnyAgent): Promise<Episode>;
  
  // Delete episode
  delete(episodeId: string): Promise<boolean>;
  
  // Clear all episodes for a context
  clearContext(contextId: string): Promise<void>;
}
```

### Episode Structure

```typescript
interface Episode {
  id: string;
  contextId: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  duration?: number;
  summary: string;
  metadata?: Record<string, any>;
  input?: any;
  output?: any;
  context?: string;
}
```

## 🚀 Production Considerations

### Performance
- Use persistent memory providers for production
- Implement caching strategies for frequently accessed data
- Consider memory pruning for long-running agents

### Security
- Encrypt sensitive data in memory stores
- Implement access controls for memory operations
- Audit memory access patterns

### Scalability
- Use distributed memory providers for multi-instance deployments
- Implement memory sharding for large-scale applications
- Monitor memory usage and implement cleanup policies

## 🤝 Contributing

To contribute to this example:

1. Fork the repository
2. Create a feature branch
3. Add your scenario or improvement
4. Update documentation
5. Submit a pull request

## 📄 License

This example is part of the Axiom framework and follows the same license terms.

## 🆘 Support

For questions or issues:

- Check the [Axiom documentation](https://axiomkit.dev)
- Join our [Discord community](https://discord.gg/axiomkit)
- Open an issue on GitHub

---

**Happy building with Axiom! 🚀**
