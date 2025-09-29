import fetch, { Request, Response } from "node-fetch";

// Set up global polyfills for Node.js v16 compatibility
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = fetch as any;
}
if (typeof globalThis.Request === "undefined") {
  globalThis.Request = Request as any;
}
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = Response as any;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// IMPORTANT: Ensure stdout is reserved for MCP JSON only.
// Redirect all non-error console output to stderr to avoid breaking MCP protocol.
const originalError = console.error.bind(console);
const redirectToStderr =
  (fnName: "log" | "info" | "warn" | "debug") =>
  (...args: any[]) =>
    originalError(...args);
console.log = redirectToStderr("log");
console.info = redirectToStderr("info");
console.warn = redirectToStderr("warn");
console.debug = redirectToStderr("debug");

// Create a simple MCP server for testing
const server = new McpServer({
  name: "Simple MCP Test Server",
  version: "1.0.0",
});

// Simple tool without complex schemas
server.tool(
  "get_info",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "Hello from AxiomKit MCP! This server is working correctly.",
        },
      ],
    };
  }
);

// Simple echo tool
server.tool(
  "echo",
  {
    message: {
      type: "string",
      description: "Message to echo back"
    }
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${message}`,
        },
      ],
    };
  }
);

// Simple math tool
server.tool(
  "add",
  {
    a: {
      type: "number",
      description: "First number"
    },
    b: {
      type: "number", 
      description: "Second number"
    }
  },
  async ({ a, b }) => {
    const result = a + b;
    return {
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${result}`,
        },
      ],
    };
  }
);

async function main() {
  console.error("Simple MCP Test Server starting...");
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Simple MCP Test Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
