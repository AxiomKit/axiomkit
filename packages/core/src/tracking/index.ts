import type { RequestContext } from "./types";
import { v7 as randomUUIDv7 } from "uuid";
export * from "./types";
/**
 * Creates a new request context
 */
export function createRequestContext(
  source: string,
  options?: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    trackingEnabled?: boolean;
  }
): RequestContext {
  return {
    requestId: randomUUIDv7(),
    trackingEnabled: options?.trackingEnabled ?? true,
    metadata: {
      source,
      userId: options?.userId,
      sessionId: options?.sessionId,
      ...options?.metadata,
    },
  };
}

/**
 * Creates a child context for agent runs
 */
export function createAgentRunContext(
  parentContext: RequestContext,
  agentName: string
): RequestContext {
  return {
    ...parentContext,
    agentRunId: randomUUIDv7(),
    metadata: {
      ...parentContext.metadata,
      agentName,
    },
  };
}

/**
 * Creates a child context for context operations
 */
export function createContextTrackingContext(
  parentContext: RequestContext,
  contextId: string,
  contextType: string
): RequestContext {
  return {
    ...parentContext,
    contextId,
    metadata: {
      ...parentContext.metadata,
      contextType,
    },
  };
}

/**
 * Creates a child context for action calls
 */
export function createActionCallContext(
  parentContext: RequestContext,
  actionName: string
): RequestContext {
  return {
    ...parentContext,
    actionCallId: randomUUIDv7(),
    metadata: {
      ...parentContext.metadata,
      actionName,
    },
  };
}

/**
 * Extracts correlation IDs from request context for logging
 */
export interface CorrelationIds {
  requestId: string;
  agentRunId?: string;
  contextId?: string;
  actionCallId?: string;
}

/**
 * Extracts correlation IDs from request context
 */
export function getCorrelationIds(context: RequestContext): CorrelationIds {
  return {
    requestId: context.requestId,
    agentRunId: context.agentRunId,
    contextId: context.contextId,
    actionCallId: context.actionCallId,
  };
}

/**
 * Creates a correlation ID string for logging context
 */
export function formatCorrelationIds(ids: CorrelationIds): string {
  const parts = [`req:${ids.requestId.slice(-8)}`];

  if (ids.agentRunId) {
    parts.push(`run:${ids.agentRunId.slice(-8)}`);
  }

  if (ids.contextId) {
    parts.push(`ctx:${ids.contextId.slice(-8)}`);
  }

  if (ids.actionCallId) {
    parts.push(`act:${ids.actionCallId.slice(-8)}`);
  }

  return parts.join("|");
}
