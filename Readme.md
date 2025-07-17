⚠️ Alpha Software: This framework is under active development. APIs may
change between versions.
## Overview

**AxiomKit** is a full-stack TypeScript framework for building truly autonomous AI
agents. It combines structured planning, adaptive memory, and explainable decision-making in one clean system, designed for:
- Autonomous task execution
- Stateful, long-running conversations
- Memory-backed decision making
- Multi-agent ecosystems
- Dynamic learning and adaptation

It’s a framework for building real AI agents, not just chatbots. Built for both
Node.js and browser environments.

### Key Features:
- ⚙️ Modular TypeScript Architecture: Clean, extensible, and fully typed for robust development.
- 🧠 Adaptive Memory + Dynamic Contexts: Agents remember, prioritize, and adapt their understanding over time.
- 📚 Goal-Driven Planning + Self-Improvement: Enables complex task decomposition and continuous learning from experience.
- 🤝 Multi-Agent Collaboration: Facilitates seamless coordination and task-sharing among multiple agents.
- 🔍 Explainable + Ethical by Design: Built-in mechanisms for transparency and adherence to ethical guidelines.
- 🌐 Universal Compatibility: Runs in Node.js, browsers, Deno, Bun, and edge runtimes.
- 🤖 Any LLM Provider: Works with OpenAI, Anthropic, Groq, local models, or any provider via adapters.


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