import { createAgent } from "@axiomkit/core";
import { createMcpProvider } from "@axiomkit/mcp";
import { groq } from "@ai-sdk/groq";
import path from "node:path";

const agent = createAgent({
  model: groq("gemma2-9b-it"),
  providers: [
    createMcpProvider([
      {
        id: "simple-server",
        name: "Simple MCP Server",
        transport: {
          type: "stdio",
          command: "npx",
          args: ["-y", "tsx", path.join(__dirname, "mcp-simple-server.ts")],
        },
      },
    ]),
  ],
});

await agent.start();
