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
