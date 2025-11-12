import { createMcpServer } from "@axiomkit/mcp";
import * as z from "zod";

const server = createMcpServer({
  name: "Simple MCP Test Server",
  version: "1.0.0",
});

// Simple tool without complex schemas
server.tool("get_info", {}, async () => {
  return {
    content: [
      {
        type: "text",
        text: "Hello from AxiomKit MCP! This server is working correctly.",
      },
    ],
  };
});

// Simple echo tool - using Zod schema directly
server.tool(
  "echo",
  {
    message: z.string().describe("The message to echo back to the user"),
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

// Simple math tool - using Zod schemas directly
// This tool performs addition of two numbers
server.tool(
  "add",
  {
    a: z.number().describe("The first number to add"),
    b: z.number().describe("The second number to add"),
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
  await server.connect();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
