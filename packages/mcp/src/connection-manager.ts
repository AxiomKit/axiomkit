import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createMcpClient } from "./client";
import type {
  McpServerConfig,
  McpConnectionStatus,
  McpServerInfo,
  McpClientConfig,
} from "./types";
import type { Logger } from "@axiomkit/core";

export class McpConnectionManager {
  private clients = new Map<string, Client>();
  private connectionStatus = new Map<string, McpConnectionStatus>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async connectToServer(serverConfig: McpServerConfig): Promise<void> {
    const { id, name } = serverConfig;

    this.logger.debug("mcp:connection-manager", "Connecting to MCP server", {
      id,
      name,
      transportType: serverConfig.transport.type,
    });

    // Initialize connection status
    this.connectionStatus.set(id, {
      serverId: id,
      connected: false,
      reconnectAttempts: 0,
    });

    try {
      const client = await this.createClient(serverConfig);
      this.clients.set(id, client);

      this.connectionStatus.set(id, {
        serverId: id,
        connected: true,
        lastConnected: new Date(),
        reconnectAttempts: 0,
      });

      this.logger.info("mcp:connection-manager", "Connected to MCP server", {
        id,
        name,
      });

      // Set up connection monitoring
      this.monitorConnection(id, serverConfig);
    } catch (error) {
      this.handleConnectionError(id, serverConfig, error as Error);
    }
  }

  private async createClient(serverConfig: McpServerConfig): Promise<Client> {
    const clientConfig: McpClientConfig = {
      clientInfo: {
        name: `axiomkit-mcp-client`,
        version: "0.0.1",
      },
      transport: serverConfig.transport,
      capabilities: serverConfig.capabilities,
    };

    return createMcpClient(clientConfig);
  }

  private handleConnectionError(
    serverId: string,
    serverConfig: McpServerConfig,
    error: Error
  ): void {
    const status = this.connectionStatus.get(serverId);
    if (!status) return;

    const retryConfig = serverConfig.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    };

    status.connected = false;
    status.lastError = error.message;
    status.reconnectAttempts++;

    this.logger.error(
      "mcp:connection-manager",
      "Failed to connect to MCP server",
      {
        serverId,
        name: serverConfig.name,
        error: error.message,
        reconnectAttempts: status.reconnectAttempts,
        maxRetries: retryConfig.maxRetries,
      }
    );

    // Attempt reconnection if under max retries
    if (status.reconnectAttempts <= retryConfig.maxRetries) {
      const delay =
        retryConfig.retryDelay *
        Math.pow(retryConfig.backoffMultiplier, status.reconnectAttempts - 1);

      this.logger.info(
        "mcp:connection-manager",
        "Scheduling reconnection attempt",
        {
          serverId,
          delay,
          attempt: status.reconnectAttempts,
        }
      );

      const timeout = setTimeout(() => {
        this.reconnectToServer(serverConfig);
      }, delay);

      this.reconnectTimeouts.set(serverId, timeout);
    } else {
      this.logger.error(
        "mcp:connection-manager",
        "Max reconnection attempts reached",
        {
          serverId,
          name: serverConfig.name,
          maxRetries: retryConfig.maxRetries,
        }
      );
    }
  }

  /**
   * Reconnect to a server
   */
  private async reconnectToServer(
    serverConfig: McpServerConfig
  ): Promise<void> {
    const { id } = serverConfig;

    // Clear existing timeout
    const existingTimeout = this.reconnectTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.reconnectTimeouts.delete(id);
    }

    // Reset connection status for retry
    const status = this.connectionStatus.get(id);
    if (status) {
      status.connected = false;
      status.lastError = undefined;
    }

    await this.connectToServer(serverConfig);
  }

  /**
   * Monitor connection health
   */
  private monitorConnection(
    serverId: string,
    serverConfig: McpServerConfig
  ): void {
    // Set up periodic health checks
    const healthCheckInterval = setInterval(async () => {
      const client = this.clients.get(serverId);
      if (!client) {
        clearInterval(healthCheckInterval);
        return;
      }

      try {
        // Simple health check - try to list tools
        await client.listTools();

        // Update last connected time
        const status = this.connectionStatus.get(serverId);
        if (status) {
          status.lastConnected = new Date();
        }
      } catch (error) {
        this.logger.warn("mcp:connection-manager", "Health check failed", {
          serverId,
          error: (error as Error).message,
        });

        // Mark as disconnected and trigger reconnection
        const status = this.connectionStatus.get(serverId);
        if (status) {
          status.connected = false;
        }

        this.handleConnectionError(serverId, serverConfig, error as Error);
        clearInterval(healthCheckInterval);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get a client by server ID
   */
  getClient(serverId: string): Client | undefined {
    return this.clients.get(serverId);
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): McpConnectionStatus[] {
    return Array.from(this.connectionStatus.values());
  }

  /**
   * Get server information
   */
  getServerInfo(): McpServerInfo[] {
    return Array.from(this.connectionStatus.entries()).map(([id, status]) => ({
      id,
      name: id, // We could store the name in connection status if needed
      connected: status.connected,
      transportType: "stdio" as const, // We could store this in connection status
      lastConnected: status.lastConnected,
      errorCount: status.reconnectAttempts,
    }));
  }

  /**
   * Disconnect from a specific server
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      try {
        await client.close();
        this.logger.info(
          "mcp:connection-manager",
          "Disconnected from MCP server",
          {
            serverId,
          }
        );
      } catch (error) {
        this.logger.warn("mcp:connection-manager", "Error during disconnect", {
          serverId,
          error: (error as Error).message,
        });
      }

      this.clients.delete(serverId);
    }

    // Clear reconnection timeout
    const timeout = this.reconnectTimeouts.get(serverId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(serverId);
    }

    this.connectionStatus.delete(serverId);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map((serverId) =>
      this.disconnectFromServer(serverId)
    );

    await Promise.allSettled(disconnectPromises);

    this.logger.info(
      "mcp:connection-manager",
      "Disconnected from all MCP servers"
    );
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverId: string): boolean {
    const status = this.connectionStatus.get(serverId);
    return status?.connected || false;
  }
}
