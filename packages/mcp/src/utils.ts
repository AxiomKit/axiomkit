import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type McpActionResult } from "./types";

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
