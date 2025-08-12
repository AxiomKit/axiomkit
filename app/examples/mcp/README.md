# 🚀 AxiomKit MCP Agent Examples

A comprehensive collection of Model Context Protocol (MCP) agent examples built with the AxiomKit framework. These examples demonstrate how to integrate various MCP servers with AI agents for powerful, context-aware applications.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Examples](#examples)
- [MCP Servers](#mcp-servers)
- [Testing with Claude](#testing-with-claude)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

This project showcases the power of AxiomKit's MCP integration, allowing AI agents to connect to external data sources and tools through the Model Context Protocol. The examples range from simple file system operations to complex multi-server integrations with databases, search engines, and AI models.

### Key Benefits

- **🔌 Seamless MCP Integration**: Connect to any MCP-compatible server
- **🤖 AI-Powered Agents**: Leverage Groq, OpenAI, and other AI models
- **📊 Multi-Server Support**: Combine multiple data sources in one agent
- **🛡️ Type Safety**: Full TypeScript support with Zod validation
- **⚡ Real-time Interactions**: Interactive chat and streaming capabilities
- **🔧 Extensible Architecture**: Easy to add new MCP servers and actions

## ✨ Features

### Core Capabilities
- **File System Operations**: Read, write, and analyze files
- **Database Queries**: PostgreSQL support with read-only operations
- **Web Search**: Brave Search integration for real-time information
- **AI Model Integration**: Groq, OpenAI, and other providers

### Advanced Features
- **Multi-Modal Agents**: Combine multiple MCP servers
- **Custom MCP Servers**: Build your own standalone servers
- **Error Handling**: Robust error management and retry logic
- **Logging & Monitoring**: Comprehensive logging and metrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- API keys for various services

### 1. Install Dependencies

```bash
cd app/examples/mcp
pnpm install
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
# AI Models
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key

# MCP Servers
BRAVE_API_KEY=your_brave_search_key

# Database
DATABASE_URL=your_database_connection_string
```

### 3. Run Examples

```bash
# Working Groq agent demo
pnpm run working-demo

# Deep MCP functionality
pnpm run deep-demo

# Test with Claude
pnpm run working-test
```

## 📦 Installation

### Step 1: Clone and Setup

```bash
# Navigate to the examples directory
cd app/examples/mcp

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### Step 2: Configure Environment

```bash
# Set required environment variables
export GROQ_API_KEY="your_groq_api_key"
export BRAVE_API_KEY="your_brave_api_key"
```

### Step 3: Verify Installation

```bash
# Test basic functionality
pnpm run test-mcp

# Test working demo
pnpm run working-demo
```

## 🎮 Examples

### 1. Working Groq Agent (`working-groq-agent.ts`)

A functional agent demonstrating file system operations with Groq AI:

```bash
pnpm run working-demo
```

**Features:**
- File system MCP server integration
- Groq AI model for responses
- Creative writing and code generation
- Data analysis and problem solving
- Real MCP server calls to demonstrate functionality

### 2. Deep MCP Agent (`deep-mcp-agent.ts`)

Advanced agent with multiple MCP servers:

```bash
pnpm run deep-demo
```

**Features:**
- File System  + Brave Search + PostgreSQL
- Complex multi-server orchestration
- Real-time data querying
- Web search integration
- Database operations (read-only)

### 3. Standalone MCP Server (`standalone-server.js`)

Custom MCP server example:

```bash
pnpm run test-standalone
```

**Features:**
- Custom tool definitions (add, multiply, greet, getCurrentTime)
- STDIO transport
- Error handling and validation
- Extensible architecture

### 4. Claude Integration Tests

Test scripts for Claude integration:

```bash
# Working test
pnpm run working-test

# Deep functionality test
pnpm run deep-test
```

## 🔌 MCP Servers

### Supported Servers

| Server | Package | Transport | Status |
|--------|---------|-----------|--------|
| File System | `@modelcontextprotocol/server-filesystem` | STDIO | ✅ Working |
| Brave Search | `@modelcontextprotocol/server-brave-search` | STDIO | ✅ Working |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | STDIO | ✅ Working (Read-only) |
| Standalone | Custom Server | STDIO | ✅ Working |

### Server Configuration

Each server is configured with appropriate settings:

```typescript
const fileSystemServer: McpServerConfig = {
  id: "filesystem",
  name: "File System Server",
  transport: {
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-filesystem"],
  },
  capabilities: { tools: {}, prompts: {} },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
};
```

## 🤖 Testing with Claude

### Claude Desktop Setup

1. **Configure Claude's MCP Settings**

Edit Claude's configuration file:
```bash
# macOS
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
notepad %APPDATA%\Claude\claude_desktop_config.json
```

2. **Add MCP Server Configuration**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "brave-search": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "your_database_url"],
      "env": {}
    }
  }
}
```

3. **Test with Claude**

Ask Claude to:
```
"List all files in the current directory using the filesystem MCP server"
```

### Claude Test Commands

#### File System Tests
```
"Show me the contents of the README.md file"
"List all TypeScript files in the current directory"
"Search for files containing 'MCP' in their content"
```

#### Database Tests (Read-Only)
```
"Show me the PostgreSQL version"
"List all tables in the database"
"Display the structure of the first table"
"Show sample data from one table"
```

#### Search Tests
```
"Search for 'AxiomKit framework' on the web"
"Find recent news about AI agents"
"Look up information about Model Context Protocol"
```

### AxiomKit + Claude Integration

Run the integration tests:

```bash
# Set your Groq API key
export GROQ_API_KEY="your_groq_api_key"

# Test working integration
pnpm run working-test

# Test deep functionality
pnpm run deep-test
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MCP Server Not Found
```bash
# Error: npm error 404 Not Found
# Solution: Check if the MCP server package exists
npm view @modelcontextprotocol/server-[name]
```

#### 2. API Key Errors
```bash
# Error: API_KEY environment variable is required
# Solution: Set the required environment variable
export GROQ_API_KEY="your_groq_api_key"
export BRAVE_API_KEY="your_brave_api_key"
```

#### 3. Database Connection Issues
```bash
# Error: Please provide a database URL as a command-line argument
# Solution: Pass DATABASE_URL as an argument, not environment variable
args: ["@modelcontextprotocol/server-postgres", "your_database_url"]
```

#### 4. Permission Errors
```bash
# Error: Permission denied
# Solution: Check file permissions and API key validity
chmod +x node_modules/.bin/npx
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=axiomkit:*

# Run with verbose output
pnpm run working-demo
```

## 📚 API Reference

### Agent Actions

```typescript
// File operations
creative_writing: "Generate creative content using AI"
code_generation: "Generate code using AI"
data_analysis: "Analyze data and provide insights"
problem_solving: "Solve complex problems using AI"

// Research operations
research_topic: "Conduct comprehensive research using multiple MCP servers"
code_analysis: "Analyze code repositories and provide insights"
database_exploration: "Explore and query database structures"
web_research: "Search the web for real-time information"
```

### MCP Extension

```typescript
import { createMcpExtension } from '@axiomkit/mcp';

const mcpExtension = createMcpExtension([fileSystemServer, braveSearchServer, postgresServer]);
```

## 📁 Current Files

### Core Examples
- `working-groq-agent.ts` - Functional Groq agent with file system integration
- `deep-mcp-agent.ts` - Advanced multi-server agent
- `working-demo.ts` - Demo script for working agent
- `deep-mcp-demo.ts` - Demo script for deep agent

### Test Scripts
- `claude-working-test.ts` - Claude integration test for working agent
- `claude-deep-test.ts` - Claude integration test for deep agent

### Custom Servers
- `standalone-server.js` - Custom MCP server with basic tools

### Documentation
- `README.md` - This comprehensive guide
- `CLAUDE-MCP-SETUP.md` - Detailed Claude setup instructions

## 🤝 Contributing

### Adding New Examples

1. **Create Example File**
```bash
touch new-example.ts
```

2. **Define Agent Configuration**
```typescript
import { createAgent } from '@axiomkit/core';
import { createMcpExtension } from '@axiomkit/mcp';

const agent = createAgent({
  extensions: [mcpExtension],
  actions: [/* your actions */],
  contexts: [/* your contexts */]
});
```

3. **Add to package.json**
```json
{
  "scripts": {
    "new-example": "tsx new-example.ts"
  }
}
```

4. **Update README**
Add documentation for your new example.

### Adding New MCP Servers

1. **Find MCP Server Package**
```bash
npm search @modelcontextprotocol/server-
```

2. **Configure Server**
```typescript
const newServer: McpServerConfig = {
  id: "server-name",
  name: "Server Name",
  transport: {
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-name"],
  },
  capabilities: { tools: {}, prompts: {} },
  retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
};
```

3. **Add to Agent**
```typescript
const mcpExtension = createMcpExtension([existingServers, newServer]);
```

## 📄 License

This project is part of the AxiomKit framework. See the main project LICENSE file for details.

## 🆘 Support

- **Issues**: Create an issue in the main AxiomKit repository
- **Documentation**: Check the main AxiomKit docs
- **Community**: Join the AxiomKit community discussions

---

**Built with ❤️ using AxiomKit and Model Context Protocol**


