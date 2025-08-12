import * as z from "zod/v4";
import { action, extension } from "@axiomkit/core";
import type { Logger } from "@axiomkit/core";

import { McpConnectionManager } from "./connection-manager";
import { type McpServerConfig, McpServerConfigSchema } from "./types";
import { safeMcpOperation } from "./utils";

/**
 * Creates an extension that connects to one or more MCP servers
 * and exposes their capabilities as actions within the agent system.
 *
 * @param servers Configuration for one or more MCP servers to connect to
 * @returns An extension that can be added to the agent's extensions list
 */
export function createMcpExtension(servers: McpServerConfig[]) {
  let connectionManager: McpConnectionManager;

  return extension({
    name: "mcp",

    // Initialize MCP clients when the extension is installed
    async install(agent) {
      const logger = agent.container.resolve<Logger>("logger");

      logger.info("mcp:extension", "Installing MCP extension", {
        serversCount: servers.length,
      });

      // Validate server configurations
      for (const server of servers) {
        try {
          McpServerConfigSchema.parse(server);
        } catch (error) {
          logger.error("mcp:extension", "Invalid server configuration", {
            serverId: server.id,
            error: (error as Error).message,
          });
          throw error;
        }
      }

      // Initialize connection manager
      connectionManager = new McpConnectionManager(logger);

      // Connect to each configured MCP server
      for (const server of servers) {
        await connectionManager.connectToServer(server);
      }
    },

    // Define actions for interacting with MCP servers
    actions: [
      action({
        name: "mcp.listServers",
        description: "List all MCP servers and their connection status",
        handler() {
          const serverList = connectionManager.getServerInfo();
          return { servers: serverList };
        },
      }),

      action({
        name: "mcp.getConnectionStatus",
        description: "Get detailed connection status for all MCP servers",
        handler() {
          const status = connectionManager.getConnectionStatus();
          return { status };
        },
      }),

      // Action to list available tools from a specific MCP server
      action({
        name: "mcp.listTools",
        description: "List available tools from an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
        },
        async handler({ serverId }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.listTools()
          );
        },
      }),

      action({
        name: "mcp.listPrompts",
        description: "List available prompts from an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
        },
        async handler({ serverId }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.listPrompts()
          );
        },
      }),

      // Action to get a prompt from a specific MCP server
      action({
        name: "mcp.getPrompt",
        description: "Get a prompt from an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
          name: z.string().describe("Name of the prompt to get"),
          arguments: z
            .record(z.any(), z.any())
            .optional()
            .describe("Arguments for the prompt"),
        },
        async handler({ serverId, name, arguments: args }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.getPrompt({
              name,
              arguments: args || {},
            })
          );
        },
      }),

      // Action to list available resources from a specific MCP server
      action({
        name: "mcp.listResources",
        description: "List available resources from an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
        },
        async handler({ serverId }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.listResources()
          );
        },
      }),

      // Action to read a resource from a specific MCP server
      action({
        name: "mcp.readResource",
        description: "Read a resource from an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
          uri: z.string().describe("URI of the resource to read"),
        },
        async handler({ serverId, uri }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.readResource({ uri })
          );
        },
      }),

      // Action to call a tool on a specific MCP server
      action({
        name: "mcp.callTool",
        description: "Call a tool on an MCP server",
        schema: {
          serverId: z.string().describe("ID of the MCP server to query"),
          name: z.string().describe("Name of the tool to call"),
          arguments: z
            .record(z.any(), z.any())
            .optional()
            .describe("Arguments for the tool"),
        },
        async handler({ serverId, name, arguments: args }) {
          const client = connectionManager.getClient(serverId);
          return await safeMcpOperation(serverId, client, () =>
            client!.callTool({
              name,
              arguments: args,
            })
          );
        },
      }),
    ],
  });
}
