import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type McpActionResult, type McpServerInfo } from "./types";
import { McpServerNotFoundError } from "./errors";

export async function safeMcpOperation<T>(
  serverId: string,
  client: Client | undefined,
  operation: () => Promise<T>
): Promise<McpActionResult<T>> {
  const timestamp = new Date();

  if (!client) {
    return {
      success: false,
      error: `MCP server with ID '${serverId}' not found`,
      serverId,
      timestamp,
    };
  }

  try {
    const data = await operation();
    return {
      success: true,
      data,
      serverId,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      serverId,
      timestamp,
    };
  }
}

/**
 * Get client for a server ID with error handling
 */
export function getClientForServer(
  serverId: string,
  clients: Map<string, Client>
): Client {
  const client = clients.get(serverId);
  if (!client) {
    throw new McpServerNotFoundError(serverId);
  }
  return client;
}

/**
 * Validate server configuration
 */
export function validateServerConfig(serverConfig: any): void {
  if (!serverConfig.id || typeof serverConfig.id !== "string") {
    throw new Error("Server ID is required and must be a string");
  }

  if (!serverConfig.name || typeof serverConfig.name !== "string") {
    throw new Error("Server name is required and must be a string");
  }

  if (!serverConfig.transport) {
    throw new Error("Transport configuration is required");
  }

  if (
    !serverConfig.transport.type ||
    !["stdio", "sse"].includes(serverConfig.transport.type)
  ) {
    throw new Error("Transport type must be 'stdio' or 'sse'");
  }

  if (
    serverConfig.transport.type === "stdio" &&
    !serverConfig.transport.command
  ) {
    throw new Error("Command is required for stdio transport");
  }

  if (
    serverConfig.transport.type === "sse" &&
    !serverConfig.transport.serverUrl
  ) {
    throw new Error("Server URL is required for SSE transport");
  }
}

/**
 * Format server information for display
 */
export function formatServerInfo(servers: McpServerInfo[]): string {
  if (servers.length === 0) {
    return "No MCP servers configured";
  }

  return servers
    .map(
      (server) =>
        `${server.name} (${server.id}) - ${
          server.connected ? "Connected" : "Disconnected"
        } - ${server.transportType}`
    )
    .join("\n");
}

/**
 * Create a standardized error message for MCP operations
 */
export function createMcpErrorMessage(
  operation: string,
  serverId: string,
  error: Error
): string {
  return `Failed to ${operation} on MCP server '${serverId}': ${error.message}`;
}

/**
 * Check if a server supports a specific capability
 */
export function hasCapability(
  serverConfig: any,
  capability: "prompts" | "resources" | "tools"
): boolean {
  return (
    serverConfig.capabilities &&
    serverConfig.capabilities[capability] &&
    Object.keys(serverConfig.capabilities[capability]).length > 0
  );
}

/**
 * Get supported capabilities for a server
 */
export function getSupportedCapabilities(serverConfig: any): string[] {
  const capabilities: string[] = [];

  if (hasCapability(serverConfig, "prompts")) capabilities.push("prompts");
  if (hasCapability(serverConfig, "resources")) capabilities.push("resources");
  if (hasCapability(serverConfig, "tools")) capabilities.push("tools");

  return capabilities;
}

/**
 * Create a connection summary for multiple servers
 */
export function createConnectionSummary(servers: McpServerInfo[]): {
  total: number;
  connected: number;
  disconnected: number;
  byTransport: Record<string, number>;
} {
  const summary = {
    total: servers.length,
    connected: 0,
    disconnected: 0,
    byTransport: {} as Record<string, number>,
  };

  for (const server of servers) {
    if (server.connected) {
      summary.connected++;
    } else {
      summary.disconnected++;
    }

    summary.byTransport[server.transportType] =
      (summary.byTransport[server.transportType] || 0) + 1;
  }

  return summary;
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
