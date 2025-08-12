/**  */
export class McpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly serverId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "McpError";
  }
}

export class McpConnectionError extends McpError {
  constructor(message: string, serverId?: string, cause?: Error) {
    super(message, "CONNECTION_ERROR", serverId, cause);
    this.name = "McpConnectionError";
  }
}

export class McpTransportError extends McpError {
  constructor(message: string, serverId?: string, cause?: Error) {
    super(message, "TRANSPORT_ERROR", serverId, cause);
    this.name = "McpTransportError";
  }
}

export class McpServerNotFoundError extends McpError {
  constructor(serverId: string) {
    super(
      `MCP server with ID '${serverId}' not found`,
      "SERVER_NOT_FOUND",
      serverId
    );
    this.name = "McpServerNotFoundError";
  }
}

export class McpActionError extends McpError {
  constructor(
    message: string,
    serverId: string,
    public readonly action: string,
    cause?: Error
  ) {
    super(message, "ACTION_ERROR", serverId, cause);
    this.name = "McpActionError";
  }
}

export class McpValidationError extends McpError {
  constructor(message: string, public readonly field: string, cause?: Error) {
    super(message, "VALIDATION_ERROR", undefined, cause);
    this.name = "McpValidationError";
  }
}

/**
 * Error codes for different types of MCP errors
 */
export const McpErrorCodes = {
  CONNECTION_ERROR: "CONNECTION_ERROR",
  TRANSPORT_ERROR: "TRANSPORT_ERROR",
  SERVER_NOT_FOUND: "SERVER_NOT_FOUND",
  ACTION_ERROR: "ACTION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  CAPABILITY_ERROR: "CAPABILITY_ERROR",
} as const;

export type McpErrorCode = (typeof McpErrorCodes)[keyof typeof McpErrorCodes];
