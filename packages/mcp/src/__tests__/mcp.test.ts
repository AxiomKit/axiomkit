import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMcpExtension,
  type McpServerConfig,
  McpServerConfigSchema,
  McpConnectionManager,
  safeMcpOperation,
  validateServerConfig,
  McpServerNotFoundError,
  McpValidationError,
} from "../index";
import { Logger } from "@axiomkit/core";

describe("MCP Package", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe("Configuration Validation", () => {
    it("should validate correct server configuration", () => {
      const config: McpServerConfig = {
        id: "test-server",
        name: "Test Server",
        transport: {
          type: "stdio",
          command: "node",
          args: ["server.js"],
        },
      };

      expect(() => McpServerConfigSchema.parse(config)).not.toThrow();
    });

    it("should reject invalid server configuration", () => {
      const invalidConfig = {
        id: "test-server",
        // Missing name
        transport: {
          type: "stdio",
          // Missing command
        },
      };

      expect(() => McpServerConfigSchema.parse(invalidConfig)).toThrow();
    });

    it("should validate SSE transport configuration", () => {
      const config: McpServerConfig = {
        id: "sse-server",
        name: "SSE Server",
        transport: {
          type: "sse",
          serverUrl: "http://localhost:3001",
        },
      };

      expect(() => McpServerConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe("Utility Functions", () => {
    it("should validate server configuration", () => {
      const validConfig = {
        id: "test",
        name: "Test",
        transport: { type: "stdio", command: "node" },
      };

      expect(() => validateServerConfig(validConfig)).not.toThrow();
    });

    it("should throw error for invalid configuration", () => {
      const invalidConfig = {
        id: "test",
        // Missing name
        transport: { type: "stdio" }, // Missing command
      };

      expect(() => validateServerConfig(invalidConfig)).toThrow();
    });

    it("should handle safe MCP operations", async () => {
      const mockClient = {
        listTools: vi.fn().mockResolvedValue([{ name: "test-tool" }]),
      };

      const result = await safeMcpOperation(
        "test-server",
        mockClient as any,
        () => mockClient.listTools()
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ name: "test-tool" }]);
      expect(result.serverId).toBe("test-server");
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle safe MCP operations with missing client", async () => {
      const result = await safeMcpOperation("missing-server", undefined, () =>
        Promise.resolve("test")
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
      expect(result.serverId).toBe("missing-server");
    });

    it("should handle safe MCP operations with errors", async () => {
      const mockClient = {
        listTools: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };

      const result = await safeMcpOperation(
        "test-server",
        mockClient as any,
        () => mockClient.listTools()
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
      expect(result.serverId).toBe("test-server");
    });
  });

  describe("Connection Manager", () => {
    it("should create connection manager", () => {
      const manager = new McpConnectionManager(logger);
      expect(manager).toBeInstanceOf(McpConnectionManager);
    });

    it("should track connection status", () => {
      const manager = new McpConnectionManager(logger);

      expect(manager.isConnected("test-server")).toBe(false);
      expect(manager.getConnectionStatus()).toEqual([]);
      expect(manager.getServerInfo()).toEqual([]);
    });

    it("should handle missing client", () => {
      const manager = new McpConnectionManager(logger);

      expect(manager.getClient("missing-server")).toBeUndefined();
    });
  });

  describe("Extension Creation", () => {
    it("should create MCP extension", () => {
      const servers: McpServerConfig[] = [
        {
          id: "test-server",
          name: "Test Server",
          transport: {
            type: "stdio",
            command: "node",
            args: ["server.js"],
          },
        },
      ];

      const extension = createMcpExtension(servers);
      expect(extension).toBeDefined();
      expect(extension.name).toBe("mcp");
      expect(extension.actions).toBeDefined();
    });

    it("should include all required actions", () => {
      const servers: McpServerConfig[] = [
        {
          id: "test-server",
          name: "Test Server",
          transport: {
            type: "stdio",
            command: "node",
            args: ["server.js"],
          },
        },
      ];

      const extension = createMcpExtension(servers);
      expect(extension.actions).toBeDefined();
      const actionNames = extension.actions
        ? extension.actions.map((action) => action.name)
        : [];

      expect(actionNames).toContain("mcp.listServers");
      expect(actionNames).toContain("mcp.getConnectionStatus");
      expect(actionNames).toContain("mcp.listTools");
      expect(actionNames).toContain("mcp.listPrompts");
      expect(actionNames).toContain("mcp.getPrompt");
      expect(actionNames).toContain("mcp.listResources");
      expect(actionNames).toContain("mcp.readResource");
      expect(actionNames).toContain("mcp.callTool");
    });
  });

  describe("Error Handling", () => {
    it("should create proper error instances", () => {
      const serverNotFoundError = new McpServerNotFoundError("test-server");
      expect(serverNotFoundError).toBeInstanceOf(Error);
      expect(serverNotFoundError.serverId).toBe("test-server");
      expect(serverNotFoundError.code).toBe("SERVER_NOT_FOUND");

      const validationError = new McpValidationError(
        "Invalid config",
        "config"
      );
      expect(validationError).toBeInstanceOf(Error);
      expect(validationError.field).toBe("config");
      expect(validationError.code).toBe("VALIDATION_ERROR");
    });
  });
});
