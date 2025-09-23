import { createAgent, Logger } from "@axiomkit/core";
import { createMcpProvider } from "@axiomkit/mcp";
import { LogLevel } from "@axiomkit/core";
import path from "path";
import { groq } from "@ai-sdk/groq";

createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  logger: new Logger({
    level: LogLevel.INFO,
  }),
  providers: [
    createMcpProvider([
      {
        id: "sei-blockchain-server",
        name: "SEI Blockchain Agent",
        transport: {
          type: "stdio",
          command: "tsx",
          args: [path.join(__dirname, "mcp-sei-server.ts")],
        },
      },
    ]),
  ],
}).start();
