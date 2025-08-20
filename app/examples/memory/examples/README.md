# 🧠 AxiomKit Memory Examples

Simple CLI examples demonstrating each type of memory in AxiomKit. These examples are designed to be easy to run and understand, showing practical use cases for each memory type.

## 📋 Available Examples

### 🔄 Working Memory - Conversation Context
**File:** `working-memory-example.ts`
- Demonstrates how working memory maintains conversation context
- Shows topic tracking and conversation state management
- Simulates a conversation about programming topics

### 🔑 Key-Value Memory - User Preferences
**File:** `kv-memory-example.ts`
- Stores and retrieves user preferences and settings
- Manages game progress and achievements
- Shows quick access to user data

### 🔍 Vector Memory - Knowledge Base Search
**File:** `vector-memory-example.ts`
- Semantic search through a knowledge base
- Finds relevant documents based on meaning
- Demonstrates AI-powered information retrieval

### 🕸️ Graph Memory - Social Network
**File:** `graph-memory-example.ts`
- Manages relationships between people and entities
- Shows social network analysis
- Demonstrates complex relationship queries

### 🧠 Episodic Memory - Learning from Experiences
**File:** `episodic-memory-example.ts`
- Records and recalls past experiences
- Learns from user interactions
- Adapts responses based on history

## 🚀 Quick Start

### Prerequisites
```bash
# Make sure you're in the memory examples directory
cd app/examples/memory

# Install dependencies
pnpm install
```

### Running Examples

#### Run a specific example:
```bash
npx tsx examples/run-examples.ts working
npx tsx examples/run-examples.ts kv
npx tsx examples/run-examples.ts vector
npx tsx examples/run-examples.ts graph
npx tsx examples/run-examples.ts episodic
```

#### Run all examples:
```bash
npx tsx examples/run-examples.ts --all
```

#### Show help:
```bash
npx tsx examples/run-examples.ts --help
```

### Run individual examples directly:
```bash
npx tsx examples/working-memory-example.ts
npx tsx examples/kv-memory-example.ts
npx tsx examples/vector-memory-example.ts
npx tsx examples/graph-memory-example.ts
npx tsx examples/episodic-memory-example.ts
```

## 🎯 What Each Example Shows

### Working Memory Example
- **Real-world use:** Chat applications, conversation bots
- **Key features:** Context maintenance, topic tracking
- **Demo:** Simulates a conversation about TypeScript and React

### Key-Value Memory Example
- **Real-world use:** User settings, game saves, preferences
- **Key features:** Fast access, simple storage
- **Demo:** Manages user preferences and game achievements

### Vector Memory Example
- **Real-world use:** Search engines, knowledge bases, document retrieval
- **Key features:** Semantic search, similarity matching
- **Demo:** Searches through programming documentation

### Graph Memory Example
- **Real-world use:** Social networks, organizational charts, recommendation systems
- **Key features:** Relationship mapping, network analysis
- **Demo:** Analyzes a social network of developers and companies

### Episodic Memory Example
- **Real-world use:** Learning systems, personalized assistants
- **Key features:** Experience recording, pattern recognition
- **Demo:** Learns from past interactions to improve responses

## 🔧 Customization

Each example is self-contained and can be easily modified:

1. **Change the AI model:** Update the `anthropic()` call in each example
2. **Modify the data:** Change the sample data to match your use case
3. **Add new features:** Extend the examples with additional functionality
4. **Integrate with real data:** Replace mock data with real data sources

## 📊 Example Output

Each example provides:
- **Clear explanations** of what's happening
- **Real-time feedback** on memory operations
- **Statistics** showing memory usage and performance
- **Practical demonstrations** of memory capabilities

## 🎮 Game-like Examples

These examples include game-like elements to make them more engaging:
- **Achievement tracking** in KV memory
- **Social network** in graph memory
- **Learning progression** in episodic memory
- **Knowledge quests** in vector memory

## 🚀 Next Steps

After running these examples:
1. **Experiment** with different data and scenarios
2. **Combine** multiple memory types in your own applications
3. **Extend** the examples with real-world data sources
4. **Build** your own memory-powered applications

## 📚 Related Documentation

- [AxiomKit Core Documentation](../../../packages/core/README.md)
- [Memory System Architecture](../README.md)
- [Advanced Memory Examples](../multi-memory-agent.ts)
