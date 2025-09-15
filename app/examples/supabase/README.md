# Enhanced Supabase Example

This example demonstrates the improved AxiomKit Supabase integration with automatic database setup and better configuration.

## Features

- ✅ **Automatic Database Setup** - No manual SQL required
- ✅ **Namespaced Tables** - Avoids conflicts with other applications
- ✅ **Self-Contained** - Works out of the box
- ✅ **Persistent Memory** - Chat history and context stored in Supabase
- ✅ **Vector Search** - Semantic search capabilities
- ✅ **Graph Storage** - Relationship data storage

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in this directory:

```bash
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run the Example

```bash
npx tsx index.ts
```

That's it! The package will automatically:
- Set up required database functions
- Create necessary tables with proper namespacing
- Initialize all memory providers
- Start the chat interface

## What's New

### Automatic Setup
The improved package automatically handles database setup:
- Creates `execute_sql` function if needed
- Sets up all required tables with namespacing
- Creates vector similarity search functions
- Establishes proper indexes for performance

### Namespaced Tables
Tables are created with namespacing to avoid conflicts:
- `example_kv_store` - Key-value storage
- `example_vector_store` - Vector embeddings
- `example_graph_nodes` - Graph nodes
- `example_graph_edges` - Graph edges

### Better Configuration
```typescript
const memorySystem = createSupabaseMemory({
  url: env.SUPABASE_URL,
  key: env.SUPABASE_ANON_KEY,
  namespace: "example",           // Custom namespace
  autoSetup: true,                // Automatic setup
  setupOptions: {
    createTables: true,           // Create tables
    createFunctions: true,        // Create functions
    schema: "public",             // Database schema
  },
});
```

## Database Features

### Key-Value Storage
- Persistent storage with TTL support
- Tagged data for organization
- Automatic expiration handling

### Vector Embeddings
- Semantic search capabilities
- Similarity matching
- Metadata filtering
- Namespace isolation

### Graph Storage
- Node and edge storage
- Relationship queries
- Graph traversal
- Path finding

## Usage Examples

Once running, you can ask the AI about:
- "What data is stored in the database?"
- "Show me the current database tables"
- "What's the database schema?"
- "How much data is stored?"

The AI can access the database to answer these questions!

## Troubleshooting

### Permission Issues
Make sure your Supabase API key has:
- `CREATE` on tables
- `EXECUTE` on functions
- `USAGE` on the `public` schema

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check that your Supabase project is active
- Ensure your IP is allowed (if using IP restrictions)

## Architecture

The improved package provides:
1. **Self-Contained Setup** - No external dependencies
2. **Automatic Migration** - Handles schema changes
3. **Namespace Isolation** - Multiple instances possible
4. **Error Recovery** - Graceful fallbacks
5. **Performance Optimization** - Proper indexing

This makes it a true library/framework extension that "just works"! 🎉
