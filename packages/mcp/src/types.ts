import * as z from "zod";

export const StdioTransportSchema = z.object({
  type: z.literal("stdio"),
  command: z.string().describe("Command to execute for the MCP server"),
  args: z.array(z.string()).optional().describe("Command line arguments"),
  env: z.string().optional().describe("Environment variables"),
});

export const SseTransportSchema = z.object({
  type: z.literal("sse"),
  serverUrl: z.string().url().describe("Base URL of the MCP server"),
  sseEndpoint: z.string().optional().describe("SSE endpoint path"),
  messageEndpoint: z.string().optional().describe("Message endpoint path"),
});

export const TransportSchema = z.union([
  StdioTransportSchema,
  SseTransportSchema,
]);

// Capabilities schema
export const CapabilitiesSchema = z.object({
  prompts: z.unknown().optional(),
  resources: z.unknown().optional(),
  tools: z.unknown().optional(),
});

// Server configuration schema
export const McpServerConfigSchema = z.object({
  id: z.string().describe("Unique identifier for the MCP server"),
  name: z.string().describe("Display name for the MCP server"),
  transport: TransportSchema,
  capabilities: CapabilitiesSchema.optional(),
  retryConfig: z
    .object({
      maxRetries: z.number().min(0).default(3),
      retryDelay: z.number().min(100).default(1000),
      backoffMultiplier: z.number().min(1).default(2),
    })
    .optional(),
});

// Client configuration schema
export const McpClientConfigSchema = z.object({
  clientInfo: z
    .object({
      name: z.string(),
      version: z.string(),
    })
    .optional(),
  transport: TransportSchema,
  capabilities: CapabilitiesSchema.optional(),
  env: z.string().optional(),
});

// Response types
export interface McpServerInfo {
  id: string;
  name: string;
  connected: boolean;
  transportType: "stdio" | "sse";
  lastConnected?: Date;
  errorCount: number;
}

export interface McpActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  serverId: string;
  timestamp: Date;
}

export interface McpConnectionStatus {
  serverId: string;
  connected: boolean;
  lastError?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

// Type exports
export type StdioTransport = z.infer<typeof StdioTransportSchema>;
export type SseTransport = z.infer<typeof SseTransportSchema>;
export type Transport = z.infer<typeof TransportSchema>;
export type Capabilities = z.infer<typeof CapabilitiesSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type McpClientConfig = z.infer<typeof McpClientConfigSchema>;
