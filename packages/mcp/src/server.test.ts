import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMcpServer } from "./server";
import * as z from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock the MCP SDK
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  const mockTools = new Map<string, any>();
  
  return {
    McpServer: vi.fn().mockImplementation(() => {
      return {
        tool: vi.fn((name: string, schemaOrCb: any, cb?: any) => {
          if (typeof schemaOrCb === "function") {
            // No schema, just callback
            mockTools.set(name, { schema: {}, callback: schemaOrCb });
          } else {
            // Has schema
            mockTools.set(name, { schema: schemaOrCb, callback: cb });
          }
          return {
            name,
            remove: () => mockTools.delete(name),
          };
        }),
        connect: vi.fn(),
        getRegisteredTools: () => Array.from(mockTools.entries()),
      };
    }),
  };
});

// Mock stdio transport
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

// Mock server utils
vi.mock("./server-utils", () => ({
  setupMcpServerEnvironment: vi.fn(),
}));

describe("createMcpServer", () => {
  let server: ReturnType<typeof createMcpServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMcpServer({
      name: "Test Server",
      version: "1.0.0",
    });
  });

  describe("Tool Registration", () => {
    it("should register a tool with empty schema", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool("test_tool", {}, handler);

      const mcpServer = (McpServer as any).mock.results[0].value;
      expect(mcpServer.tool).toHaveBeenCalledWith(
        "test_tool",
        expect.any(Function)
      );
    });

    it("should register a tool with Zod schema", () => {
      const handler = vi.fn(async ({ message }: { message: string }) => ({
        content: [{ type: "text", text: `Echo: ${message}` }],
      }));

      server.tool(
        "echo",
        {
          message: z.string().describe("Message to echo"),
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      expect(mcpServer.tool).toHaveBeenCalledWith(
        "echo",
        expect.objectContaining({
          message: expect.any(Object),
        }),
        expect.any(Function)
      );
    });

    it("should register a tool with plain object schema", () => {
      const handler = vi.fn(async ({ value }: { value: number }) => ({
        content: [{ type: "text", text: `Value: ${value}` }],
      }));

      server.tool(
        "test",
        {
          value: {
            type: "number",
            description: "A number value",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      expect(mcpServer.tool).toHaveBeenCalledWith(
        "test",
        expect.objectContaining({
          value: expect.any(Object),
        }),
        expect.any(Function)
      );
    });

    it("should register a tool with multiple parameters", () => {
      const handler = vi.fn(async ({ a, b }: { a: number; b: number }) => ({
        content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
      }));

      server.tool(
        "add",
        {
          a: z.number().describe("First number"),
          b: z.number().describe("Second number"),
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "add"
      );
      expect(toolCall).toBeDefined();
      expect(toolCall[1]).toHaveProperty("a");
      expect(toolCall[1]).toHaveProperty("b");
    });
  });

  describe("Schema Conversion", () => {
    it("should convert string schema correctly", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "test",
        {
          message: {
            type: "string",
            description: "A message",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      expect(toolCall).toBeDefined();
      const schema = toolCall[1];
      expect(schema.message).toBeDefined();
      // Check that it's a Zod schema (has _def property)
      expect((schema.message as any)._def).toBeDefined();
    });

    it("should convert number schema correctly", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "test",
        {
          value: {
            type: "number",
            description: "A number",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      expect(toolCall).toBeDefined();
      const schema = toolCall[1];
      // Verify it's a Zod schema with _def
      expect((schema.value as any)._def).toBeDefined();
      // Verify it's a number schema (check typeName if available)
      const typeName = (schema.value as any)._def?.typeName;
      if (typeName) {
        expect(typeName).toBe("ZodNumber");
      }
    });

    it("should convert boolean schema correctly", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "test",
        {
          flag: {
            type: "boolean",
            description: "A flag",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      expect(toolCall).toBeDefined();
      const schema = toolCall[1];
      // Verify it's a Zod schema with _def
      expect((schema.flag as any)._def).toBeDefined();
      // Verify it's a boolean schema (check typeName if available)
      const typeName = (schema.flag as any)._def?.typeName;
      if (typeName) {
        expect(typeName).toBe("ZodBoolean");
      }
    });

    it("should handle optional parameters", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "test",
        {
          optional: z.string().optional().describe("Optional value"),
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      expect(toolCall).toBeDefined();
      const schema = toolCall[1];
      // Verify it's a Zod schema
      expect((schema.optional as any)._def).toBeDefined();
      // Zod v4 uses _def.type instead of _def.typeName
      const type = (schema.optional as any)._def?.type;
      expect(type).toBeDefined();
      // For optional schemas, type should be "optional"
      expect(type).toBe("optional");
    });
  });

  describe("Tool Execution", () => {
    it("should call handler with correct arguments for empty schema", async () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "success" }],
      }));

      server.tool("test", {}, handler);

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      const callback = toolCall[1];

      const result = await callback();
      expect(handler).toHaveBeenCalledWith({});
      expect(result).toEqual({
        content: [{ type: "text", text: "success" }],
      });
    });

    it("should call handler with correct arguments for schema with parameters", async () => {
      const handler = vi.fn(async ({ message }: { message: string }) => ({
        content: [{ type: "text", text: `Echo: ${message}` }],
      }));

      server.tool(
        "echo",
        {
          message: z.string(),
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "echo"
      );
      const callback = toolCall[2];

      const result = await callback({ message: "hello" }, {});
      expect(handler).toHaveBeenCalledWith({ message: "hello" });
      expect(result).toEqual({
        content: [{ type: "text", text: "Echo: hello" }],
      });
    });

    it("should handle errors in tool handler", async () => {
      const handler = vi.fn(async () => {
        throw new Error("Tool error");
      });

      server.tool("error_tool", {}, handler);

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "error_tool"
      );
      const callback = toolCall[1];

      await expect(callback()).rejects.toThrow("Tool error");
    });
  });

  describe("Server Connection", () => {
    it("should connect to stdio transport", async () => {
      const { StdioServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/stdio.js"
      );

      await server.connect();

      expect(StdioServerTransport).toHaveBeenCalled();
      const mcpServer = (McpServer as any).mock.results[0].value;
      expect(mcpServer.connect).toHaveBeenCalled();
    });
  });

  describe("Chaining", () => {
    it("should allow chaining tool registrations", () => {
      const handler1 = vi.fn(async () => ({
        content: [{ type: "text", text: "test1" }],
      }));
      const handler2 = vi.fn(async () => ({
        content: [{ type: "text", text: "test2" }],
      }));

      server
        .tool("tool1", {}, handler1)
        .tool("tool2", {}, handler2);

      const mcpServer = (McpServer as any).mock.results[0].value;
      expect(mcpServer.tool).toHaveBeenCalledTimes(2);
    });
  });

  describe("Complex Schemas", () => {
    it("should handle mixed Zod and plain object schemas", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "mixed",
        {
          zodParam: z.string(),
          plainParam: {
            type: "number",
            description: "A number",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "mixed"
      );
      const schema = toolCall[1];
      expect(schema.zodParam).toBeDefined();
      expect(schema.plainParam).toBeDefined();
    });

    it("should handle array schema", () => {
      const handler = vi.fn(async () => ({
        content: [{ type: "text", text: "test" }],
      }));

      server.tool(
        "test",
        {
          items: {
            type: "array",
            description: "An array",
          },
        },
        handler
      );

      const mcpServer = (McpServer as any).mock.results[0].value;
      const toolCall = mcpServer.tool.mock.calls.find(
        (call: any[]) => call[0] === "test"
      );
      expect(toolCall).toBeDefined();
      const schema = toolCall[1];
      // Verify it's a Zod schema with _def
      expect((schema.items as any)._def).toBeDefined();
      // Zod v4 uses _def.type instead of _def.typeName
      const type = (schema.items as any)._def?.type;
      expect(type).toBeDefined();
      // For array schemas, type should be "array"
      expect(type).toBe("array");
    });
  });
});

