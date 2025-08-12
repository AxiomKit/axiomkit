# AxiomKit Framework MCP Integration Demonstration

This document demonstrates the effectiveness of the AxiomKit framework through comprehensive MCP (Model Context Protocol) integration examples.

## 🎯 Framework Effectiveness Demonstrated

### 1. **Seamless MCP Integration**
The AxiomKit framework provides a clean, extension-based architecture for integrating MCP servers:

```typescript
import { createAgent, action } from "@axiomkit/core";
import { createMcpExtension } from "@axiomkit/mcp";

// Simple configuration with multiple MCP servers
const mcpExtension = createMcpExtension([
  fileSystemServer,
  githubServer,
  weatherServer,
]);

const agent = createAgent({
  model: { provider: "openai", name: "gpt-4" },
  extensions: [mcpExtension],
  actions: [/* custom actions */],
});
```

**Benefits:**
- ✅ Zero boilerplate code
- ✅ Automatic connection management
- ✅ Built-in error handling and retry logic
- ✅ Type-safe server configurations

### 2. **Type-Safe Action Definitions**
The framework provides a clean action definition system:

```typescript
action({
  name: "analyze_files",
  description: "Analyze files using MCP file system server",
  schema: {
    directory: "string",
    file_pattern: "string?",
  },
  async handler({ directory, file_pattern }) {
    const tools = await agent.run({
      context: { type: "analysis", schema: {} },
      args: {},
      actions: [{
        name: "mcp.listResources",
        arguments: { serverId: "filesystem" },
      }],
    });
    return { message: `Analyzed files in ${directory}`, tools_available: tools };
  },
})
```

**Benefits:**
- ✅ Automatic schema validation
- ✅ Type inference and IntelliSense support
- ✅ Clean separation of concerns
- ✅ Reusable action patterns


