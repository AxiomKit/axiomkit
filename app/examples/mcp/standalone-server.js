import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "axiomkit-standalone-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Register tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "add":
      const a = Number(args.a);
      const b = Number(args.b);
      if (isNaN(a) || isNaN(b)) {
        throw new Error("Both arguments must be numbers");
      }
      return {
        content: [
          {
            type: "text",
            text: `The sum of ${a} and ${b} is ${a + b}`,
          },
        ],
      };

    case "multiply":
      const x = Number(args.x);
      const y = Number(args.y);
      if (isNaN(x) || isNaN(y)) {
        throw new Error("Both arguments must be numbers");
      }
      return {
        content: [
          {
            type: "text",
            text: `The product of ${x} and ${y} is ${x * y}`,
          },
        ],
      };

    case "greet":
      const name = String(args.name || "World");
      return {
        content: [
          {
            type: "text",
            text: `Hello, ${name}!`,
          },
        ],
      };

    case "getCurrentTime":
      const now = new Date();
      return {
        content: [
          {
            type: "text",
            text: `Current time is: ${now.toISOString()}`,
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Register list handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "multiply",
        description: "Multiply two numbers",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "First number" },
            y: { type: "number", description: "Second number" },
          },
          required: ["x", "y"],
        },
      },
      {
        name: "greet",
        description: "Greet someone",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name to greet" },
          },
        },
      },
      {
        name: "getCurrentTime",
        description: "Get current time",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///example.txt",
        name: "Example Text File",
        description: "A simple text file for demonstration",
        mimeType: "text/plain",
      },
      {
        uri: "file:///data.json",
        name: "Example JSON Data",
        description: "Sample JSON data",
        mimeType: "application/json",
      },
      {
        uri: "file:///config.yaml",
        name: "Example YAML Config",
        description: "Sample YAML configuration",
        mimeType: "text/yaml",
      },
    ],
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "greeting",
        description: "Generate a greeting message",
        arguments: [
          {
            name: "name",
            description: "Name to greet",
            type: "string",
          },
        ],
      },
      {
        name: "calculation",
        description: "Perform a calculation",
        arguments: [
          {
            name: "operation",
            description: "Operation to perform",
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
          },
          {
            name: "num1",
            description: "First number",
            type: "string",
          },
          {
            name: "num2",
            description: "Second number",
            type: "string",
          },
        ],
      },
      {
        name: "help",
        description: "Show help information",
        arguments: [],
      },
    ],
  };
});

// Register resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "file:///example.txt":
      return {
        contents: [
          {
            uri: "file:///example.txt",
            mimeType: "text/plain",
            text: "This is an example resource file.\nIt contains some sample text for demonstration purposes.",
          },
        ],
      };

    case "file:///data.json":
      return {
        contents: [
          {
            uri: "file:///data.json",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                message: "Hello from AxiomKit MCP server!",
                timestamp: new Date().toISOString(),
                data: [1, 2, 3, 4, 5],
              },
              null,
              2
            ),
          },
        ],
      };

    case "file:///config.yaml":
      return {
        contents: [
          {
            uri: "file:///config.yaml",
            mimeType: "text/yaml",
            text: `server:
  name: axiomkit-standalone-server
  version: 1.0.0
capabilities:
  tools: true
  resources: true
  prompts: true`,
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Register prompts
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "greeting":
      const userName = String(args.name || "User");
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Hello ${userName}! Welcome to the AxiomKit MCP server. How can I help you today?`,
            },
          },
        ],
      };

    case "calculation":
      const operation = String(args.operation || "add");
      const num1 = Number(args.num1 || 0);
      const num2 = Number(args.num2 || 0);

      let result;
      switch (operation) {
        case "add":
          result = num1 + num2;
          break;
        case "subtract":
          result = num1 - num2;
          break;
        case "multiply":
          result = num1 * num2;
          break;
        case "divide":
          if (num2 === 0) {
            throw new Error("Cannot divide by zero");
          }
          result = num1 / num2;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `The result of ${num1} ${operation} ${num2} is ${result}`,
            },
          },
        ],
      };

    case "help":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Available tools:
- add: Add two numbers (args: a, b)
- multiply: Multiply two numbers (args: x, y)
- greet: Greet someone (args: name)
- getCurrentTime: Get current time

Available resources:
- file:///example.txt: Example text file
- file:///data.json: Example JSON data
- file:///config.yaml: Example YAML config

Available prompts:
- greeting: Generate a greeting (args: name)
- calculation: Perform a calculation (args: operation, num1, num2)
- help: Show this help message`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AxiomKit MCP server started and listening on stdio");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

main();
