/**
 * Summarizes token consumption from model interactions.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  estimatedCost?: number;
}

/**
 * ⚡️ Performance stats for model API calls.
 */
export interface ModelCallMetrics {
  /** Time until the first token appears (ms). */
  timeToFirstToken?: number;
  /** Full duration of the call (ms). */
  totalTime: number;
  tokensPerSecond?: number;
  modelId: string;
  /** Who provides the model (e.g., 'openai'). */
  provider: string;
}

/**
 * 🚀 A single, tracked AI model API call.
 */
export interface ModelCall {
  id: string;
  actionCallId: string;
  contextId: string;
  agentRunId: string;
  requestId: string;
  startTime: number;
  endTime?: number;
  tokenUsage?: TokenUsage;
  metrics?: ModelCallMetrics;
  callType: "generate" | "stream" | "embed" | "reasoning";
  error?: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

export interface ActionCallTracking {
  /** Action call ID */
  id: string;
  /** Parent context ID */
  contextId: string;
  /** Parent agent run ID */
  agentRunId: string;
  /** Root request ID */
  requestId: string;
  /** Action name */
  actionName: string;
  /** Timestamp when action started */
  startTime: number;
  /** Timestamp when action completed */
  endTime?: number;
  /** Model calls made during this action */
  modelCalls: ModelCall[];
  /** Aggregated token usage from all model calls */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Action execution status */
  status: "running" | "completed" | "failed";
  /** Error information if action failed */
  error?: {
    message: string;
    cause?: unknown;
  };
}

export interface ContextTracking {
  /** Context ID */
  id: string;
  /** Context type */
  type: string;
  /** Parent agent run ID */
  agentRunId: string;
  /** Root request ID */
  requestId: string;
  /** Context arguments hash for caching */
  argsHash?: string;
  /** Timestamp when context was created */
  startTime: number;
  /** Timestamp when context was last used */
  lastUsedTime?: number;
  /** Action calls made in this context */
  actionCalls: ActionCallTracking[];
  /** Aggregated metrics from all actions */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Memory operations count */
  memoryOperations: number;
}

export interface AgentRunTracking {
  /** Agent run ID */
  id: string;
  /** Agent name/type */
  agentName: string;
  /** Root request ID */
  requestId: string;
  /** Timestamp when run started */
  startTime: number;
  /** Timestamp when run completed */
  endTime?: number;
  /** Contexts used during this run */
  contexts: ContextTracking[];
  /** Aggregated metrics from all contexts */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Run status */
  status: "running" | "completed" | "failed";
  /** Error information if run failed */
  error?: {
    message: string;
    cause?: unknown;
  };
}

export interface RequestTracking {
  /** Unique request ID */
  id: string;
  /** User/session identifier */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Request source/type */
  source: string;
  /** Timestamp when request started */
  startTime: number;
  /** Timestamp when request completed */
  endTime?: number;
  /** Agent runs triggered by this request */
  agentRuns: AgentRunTracking[];
  /** Aggregated metrics from all agent runs */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Request status */
  status: "running" | "completed" | "failed";
  /** Error information if request failed */
  error?: {
    message: string;
    cause?: unknown;
  };
  /** Request metadata */
  metadata?: Record<string, unknown>;
}

export interface RequestContext {
  /** Current request ID */
  requestId: string;
  /** Current agent run ID */
  agentRunId?: string;
  /** Current context ID */
  contextId?: string;
  /** Current action call ID */
  actionCallId?: string;
  /** Whether tracking is enabled */
  trackingEnabled: boolean;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

export interface RequestTrackingConfig {
  /** Whether tracking is enabled */
  enabled: boolean;
  /** Whether to track token usage */
  trackTokenUsage: boolean;
  /** Whether to track performance metrics */
  trackPerformance: boolean;
  /** Whether to track costs */
  trackCosts: boolean;
  /** Whether to log tracking metrics */
  enableLogging?: boolean;
  /** Minimum log level for tracking metrics */
  logLevel?: "trace" | "debug" | "info" | "warn" | "error";
  /** Cost estimation per model/provider */
  costEstimation?: {
    [modelProvider: string]: {
      inputTokenCost: number; // Cost per 1 million input tokens
      outputTokenCost: number; // Cost per 1 million output tokens
      reasoningTokenCost?: number; // Cost per 1 million reasoning tokens
    };
  };
  /** Storage backend for tracking data */
  storage?: RequestTrackingStorage;
}

export interface RequestTrackingStorage {
  /** Store request tracking data */
  storeRequest(request: RequestTracking): Promise<void>;
  /** Retrieve request tracking data */
  getRequest(requestId: string): Promise<RequestTracking | null>;
  /** Store model call data */
  storeModelCall(modelCall: ModelCall): Promise<void>;
  /** Query requests by criteria */
  queryRequests(criteria: RequestQueryCriteria): Promise<RequestTracking[]>;
  /** Get aggregated metrics */
  getMetrics(criteria: MetricsQueryCriteria): Promise<AggregatedMetrics>;
}

export interface RequestQueryCriteria {
  /** User ID filter */
  userId?: string;
  /** Session ID filter */
  sessionId?: string;
  /** Agent name filter */
  agentName?: string;
  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
  /** Status filter */
  status?: ("running" | "completed" | "failed")[];
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface AggregatedMetrics {
  /** Total requests */
  totalRequests: number;
  /** Total token usage */
  totalTokenUsage: TokenUsage;
  /** Total cost */
  totalCost: number;
  /** Average response time */
  averageResponseTime: number;
  /** Success rate */
  successRate: number;
  /** Breakdown by group */
  breakdown: Array<{
    group: Record<string, string>;
    metrics: {
      requests: number;
      tokenUsage: TokenUsage;
      cost: number;
      averageResponseTime: number;
      successRate: number;
    };
  }>;
}

export interface MetricsQueryCriteria {
  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
  /** Aggregation level */
  aggregateBy: "request" | "agent" | "context" | "action" | "model";
  /** Group by fields */
  groupBy?: string[];
  /** User ID filter */
  userId?: string;
  /** Agent name filter */
  agentName?: string;
}
