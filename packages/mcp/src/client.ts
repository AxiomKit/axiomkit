import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { type McpClientConfig, McpClientConfigSchema } from "./types";
import {
  McpConnectionError,
  McpTransportError,
  McpValidationError,
} from "./errors";

/**
 * Creates and connects an MCP client to a server
 * @param options Configuration options for the MCP client
 * @returns Connected MCP client instance
 */
export async function createMcpClient(options: McpClientConfig) {
  const clientInfo = options.clientInfo || {
    name: "generic-mcp-client",
    version: "1.0.0",
  };

  // Set default capabilities if not provided
  const capabilities = options.capabilities || {
    prompts: {},
    resources: {},
    tools: {},
  };

  // Validate configuration
  try {
    McpClientConfigSchema.parse(options);
  } catch (error) {
    throw new McpValidationError(
      `Invalid MCP client configuration: ${(error as Error).message}`,
      "configuration"
    );
  }

  let transport;
  try {
    if (options.transport.type === "stdio") {
      transport = new StdioClientTransport({
        command: options.transport.command,
        args: options.transport.args || [],
        env: options.env,
      });
    } else if (options.transport.type === "sse") {
      // Create the SSE transport with the correct configuration
      // Convert string URL to URL object
      const serverUrl = new URL(options.transport.serverUrl);
      transport = new SSEClientTransport(serverUrl);
    } else {
      throw new McpTransportError(
        `Unsupported transport type: ${options.transport}`
      );
    }
  } catch (error) {
    throw new McpTransportError(
      `Failed to create transport: ${(error as Error).message}`,
      undefined,
      error as Error
    );
  }

  // Create the client
  const client = new Client(clientInfo, { capabilities });

  // Connect to the server
  try {
    await client.connect(transport);
  } catch (error) {
    throw new McpConnectionError(
      `Failed to connect to MCP server: ${(error as Error).message}`,
      undefined,
      error as Error
    );
  }

  return client;
}
