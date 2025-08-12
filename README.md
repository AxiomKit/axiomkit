<div align="center">
<img src="https://files.catbox.moe/aslpwo.png" alt="Axiomkit " width="100" />
<h1>Axiomkit</h1>
</div>

⚠️ **Alpha Software:** This framework is under active development. APIs may change between versions.

## Overview

**AxiomKit** is a full-stack TypeScript framework for building truly autonomous AI
agents. It combines structured planning, adaptive memory, and explainable decision-making in one clean system, designed for:
- Autonomous task execution
- Stateful, long-running conversations
- Memory-backed decision making
- Multi-agent ecosystems
- Dynamic learning and adaptation

It's a framework for building real AI agents, not just chatbots. Built for both
Node.js and browser environments.

### Key Features:
- ⚙️ Modular TypeScript Architecture: Clean, extensible, and fully typed for robust development.
- 🧠 Adaptive Memory + Dynamic Contexts: Agents remember, prioritize, and adapt their understanding over time.
- 📚 Goal-Driven Planning + Self-Improvement: Enables complex task decomposition and continuous learning from experience.
- 🤝 Multi-Agent Collaboration: Facilitates seamless coordination and task-sharing among multiple agents.
- 🔍 Explainable + Ethical by Design: Built-in mechanisms for transparency and adherence to ethical guidelines.
- 🌐 Universal Compatibility: Runs in Node.js, browsers, Deno, Bun, and edge runtimes.
- 🤖 Any LLM Provider: Works with OpenAI, Anthropic, Groq, local models, or any provider via adapters.

## 📁 Project Structure

```
axiomkit/
├── 📦 packages/                    # Core framework packages
│   ├── 🧠 core/                   # Main framework with agent, memory, and context systems
│   ├── 🛠️ cli/                   # Command-line interface tools
│   ├── 🚀 create-agent/           # CLI tool for bootstrapping new agents
│   ├── 🗄️ mongodb/               # MongoDB integration for persistent memory
│   ├── ⛓️ sei/                   # Sei blockchain integration
│   └── 📱 telegram/               # Telegram bot integration
├── 🎯 examples/                   # Ready-to-run example implementations
│   ├── 🤖 bots/                   # Various bot implementations
│   ├── 💬 chat/                   # Next.js chat interface
│   ├── 🎮 games/                  # Game-related examples
│   ├── 🗄️ mongodb/               # MongoDB usage examples
│   ├── ⛓️ sei/                   # Sei blockchain examples
│   └── 📱 telegram/               # Telegram bot examples
└── 📋 scripts/                    # Build and deployment scripts
```

## 🎯 Examples & Use Cases

| Category | Example | Description | Link |
|----------|---------|-------------|------|
| **🤖 Bot Agents** | Calculator Bot | Simple arithmetic operations with memory | [`examples/bots/calculator-bot.ts`](./examples/bots/calculator-bot.ts) |
| | Translator Bot | Multi-language translation with context | [`examples/bots/translator-bot.ts`](./examples/bots/translator-bot.ts) |
| | Writing Assistant | AI-powered writing and editing help | [`examples/bots/writing-assistant.ts`](./examples/bots/writing-assistant.ts) |
| | Debugging Assistant | Code debugging and problem-solving | [`examples/bots/debugging-assistant.ts`](./examples/bots/debugging-assistant.ts) |
| | Multi-Functional Agent | Complex agent with multiple capabilities | [`examples/bots/multi-functional-agent.ts`](./examples/bots/multi-functional-agent.ts) |
| | Custom Chatbot | Basic conversational agent | [`examples/bots/custom-chatbot.ts`](./examples/bots/custom-chatbot.ts) |
| | Echo Bot | Simple message echoing with memory | [`examples/bots/echo.ts`](./examples/bots/echo.ts) |
| **💬 Chat Interface** | Next.js Chat App | Full-stack chat application with UI | [`examples/chat/`](./examples/chat/) |
| **⛓️ Blockchain** | Sei Integration | Sei blockchain trading and wallet management | [`examples/sei/`](./examples/sei/) |
| **📱 Messaging** | Telegram Bot | Telegram bot with AxiomKit integration | [`examples/telegram/`](./examples/telegram/) |
| **🗄️ Database** | MongoDB Memory | Persistent memory storage with MongoDB | [`examples/mongodb/`](./examples/mongodb/) |
| **🎮 Gaming** | Game Examples | Gaming-related agent implementations | [`examples/games/`](./examples/games/) |

## 📦 Core Packages

| Package | Description | Link |
|---------|-------------|------|
| **🧠 @axiomkit/core** | Main framework with agent, memory, and context systems | [`packages/core/`](./packages/core/) |
| **🛠️ @axiomkit/cli** | Command-line interface tools and utilities | [`packages/cli/`](./packages/cli/) |
| **🚀 @axiomkit/create-agent** | CLI tool for bootstrapping new agents | [`packages/create-agent/`](./packages/create-agent/) |
| **🗄️ @axiomkit/mongodb** | MongoDB integration for persistent memory storage | [`packages/mongodb/`](./packages/mongodb/) |
| **⛓️ @axiomkit/sei** | Sei blockchain integration for DeFi and trading | [`packages/sei/`](./packages/sei/) |
| **📱 @axiomkit/telegram** | Telegram bot integration for messaging | [`packages/telegram/`](./packages/telegram/) |

## 🚀 Quick Start

### 1. Create a New Agent
```bash
npx @axiomkit/create-agent my-agent
```

### 2. Run an Example
```bash
cd examples/bots
npm install
npm run calculator-bot
```

### 3. Build Your Own
```typescript
import { createAgent, context, action } from "@axiomkit/core";
import { groq } from "@ai-sdk/groq";

const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [/* your extensions */],
});

agent.start();
```

## 🔧 Manual Installation
# Install the core package
```bash
npm install @axiomkit/core
```
# Install with extensions
```bash
npm install @axiomkit/mongodb @axiomkit/telegram @axiomkit/sei
```
```bash
npx @axiomkit/create-agent my-agent
```

## 📚 Documentation

- **Core Concepts**: [`packages/core/README.md`](./packages/core/README.md)
- **CLI Tools**: [`packages/cli/`](./packages/cli/)
- **Create Agent**: [`packages/create-agent/README.md`](./packages/create-agent/README.md)
- **MongoDB Extension**: [`packages/mongodb/README.md`](./packages/mongodb/README.md)
- **Sei Extension**: [`packages/sei/Readme.md`](./packages/sei/Readme.md)
- **Telegram Extension**: [`packages/telegram/README.md`](./packages/telegram/README.md)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and check out the examples to understand the framework better.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributors
### Rule JSDoc
Use the following JSDoc tags for comprehensive documentation:
- /** ... */: Start and end all JSDoc comments.
- @param {Type} name - Description.: For function parameters.
    - Type: The TypeScript type (e.g., {string}, {number[]}, {MyInterface}).
    - name: The parameter name.
    - Description: A clear explanation of the parameter's purpose.
    - Use [name] for optional parameters.

- @returns {Type} - Description.: For function return values.
- @throws {ErrorType} - Description.: For errors thrown by the function.
- @example: Provide a code example demonstrating how to use the function/class.
- @deprecated - Reason for deprecation.: Mark deprecated elements.
- @see {link}: Reference related documentation or resources.
- @template {T}: For generic types.