import type { RequestTrackingConfig, TokenUsage } from "./types";

/**
 * Utility to aggregate token usage
 */
export function aggregateTokenUsage(usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (total, usage) => ({
      inputTokens: total.inputTokens + usage.inputTokens,
      outputTokens: total.outputTokens + usage.outputTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
      reasoningTokens:
        (total.reasoningTokens || 0) + (usage.reasoningTokens || 0),
      estimatedCost: (total.estimatedCost || 0) + (usage.estimatedCost || 0),
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
      estimatedCost: 0,
    }
  );
}

/**
 * Utility to estimate cost based on token usage
 */
export function estimateCost(
  tokenUsage: TokenUsage,
  modelProvider: string,
  costConfig?: RequestTrackingConfig["costEstimation"]
): number {
  if (!costConfig || !costConfig[modelProvider]) {
    return 0;
  }

  const perMillionTokens = 1000000;

  const rates = costConfig[modelProvider];
  const inputCost =
    (tokenUsage.inputTokens / perMillionTokens) * rates.inputTokenCost;
  const outputCost =
    (tokenUsage.outputTokens / perMillionTokens) * rates.outputTokenCost;
  const reasoningCost =
    tokenUsage.reasoningTokens && rates.reasoningTokenCost
      ? (tokenUsage.reasoningTokens / perMillionTokens) *
        rates.reasoningTokenCost
      : 0;

  return inputCost + outputCost + reasoningCost;
}
