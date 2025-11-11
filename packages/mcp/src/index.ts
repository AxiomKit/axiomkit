// Client and Provider
export { createMcpClient } from "./client";
export { createMcpProvider } from "./provider";

// Server
export { createMcpServer, runMcpServer } from "./server";
export type { McpServerOptions, ToolSchema, ToolHandler } from "./server";

// Server Utilities
export {
  setupFetchPolyfills,
  redirectConsoleToStderr,
  setupMcpServerEnvironment,
} from "./server-utils";

// Types
export type {
  McpServerConfig,
  McpClientConfig,
  McpServerInfo,
  McpActionResult,
  McpConnectionStatus,
  Transport,
  StdioTransport,
  SseTransport,
  Capabilities,
} from "./types";

// Schemas
export {
  McpServerConfigSchema,
  McpClientConfigSchema,
  TransportSchema,
  StdioTransportSchema,
  SseTransportSchema,
  CapabilitiesSchema,
} from "./types";

// Errors
export {
  McpError,
  McpConnectionError,
  McpTransportError,
  McpServerNotFoundError,
  McpActionError,
  McpValidationError,
  McpErrorCodes,
} from "./errors";

// Utilities
export {
  safeMcpOperation,
  getClientForServer,
  validateServerConfig,
  formatServerInfo,
  createMcpErrorMessage,
  hasCapability,
  getSupportedCapabilities,
  createConnectionSummary,
  retryOperation,
} from "./utils";

// Connection Manager
export { McpConnectionManager } from "./connection-manager";
