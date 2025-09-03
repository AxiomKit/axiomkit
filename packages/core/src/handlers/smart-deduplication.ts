import type {
  Action,
  ActionContext,
  ActionFingerprint,
  DeduplicationDecision,
  DeduplicationRule,
  ActionCall,
} from "../types";
import type { Logger } from "../logger";

/**
 * Smart deduplication engine that handles action deduplication intelligently
 */
export class SmartDeduplicationEngine {
  private executedActions = new Map<
    string,
    {
      fingerprint: ActionFingerprint;
      result: any;
      timestamp: number;
      attempts: number;
    }
  >();

  constructor(private logger: Logger) {}

  /**
   * Generate a unique fingerprint for an action call
   */
  private generateActionFingerprint(
    action: Action,
    call: ActionCall,
    context: ActionContext<any, any, any>
  ): ActionFingerprint {
    const metadata = action.metadata;
    const rules = metadata?.deduplication?.rules;

    // Create base fingerprint
    const fingerprint: ActionFingerprint = {
      actionName: action.name,
      parameters: this.filterParameters(call.data || {}, rules),
      contextId: context.id,
      sessionId: context.sessionId,
      userId: context.userId,
      timestamp: Date.now(),
      timeWindow: rules?.timeWindow || 5 * 60 * 1000, // Default 5 minutes
      requestId: call.id,
      attemptNumber: 1,
      source: this.detectActionSource(call, context),
    };

    return fingerprint;
  }

  /**
   * Filter parameters based on deduplication rules
   */
  private filterParameters(
    params: Record<string, any>,
    rules?: DeduplicationRule
  ): Record<string, any> {
    if (!rules) return params;

    const filtered: Record<string, any> = {};

    // Include required fields
    for (const field of rules.requiredFields) {
      if (params[field] !== undefined) {
        filtered[field] = params[field];
      }
    }

    // Include all fields except ignored ones
    for (const [key, value] of Object.entries(params)) {
      if (!rules.ignoreFields.includes(key)) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Detect the source of the action call
   */
  private detectActionSource(
    call: ActionCall,
    context: ActionContext<any, any, any>
  ): "user" | "llm" | "system" | "retry" {
    // This is a simplified detection - in practice, you'd have more context
    if (call.content && call.content.includes("retry")) return "retry";
    if (context.source === "user") return "user";
    if (context.source === "system") return "system";
    return "llm";
  }

  /**
   * Check if an action should be executed based on deduplication rules
   */
  async shouldExecuteAction(
    action: Action,
    context: ActionContext<any, any, any>,
    call: ActionCall
  ): Promise<DeduplicationDecision> {
    const metadata = action.metadata;

    // If deduplication is disabled, always execute
    if (!metadata?.deduplication?.enabled) {
      return { shouldExecute: true, reason: "Deduplication disabled" };
    }

    // If action is idempotent, always execute
    if (metadata?.business?.idempotent) {
      return { shouldExecute: true, reason: "Action is idempotent" };
    }

    // Generate fingerprint
    const fingerprint = this.generateActionFingerprint(action, call, context);

    // Check for existing execution
    const existing = this.findExistingExecution(fingerprint);

    if (!existing) {
      return { shouldExecute: true, reason: "No duplicate found" };
    }

    // Apply business rules
    const businessDecision = this.applyBusinessRules(
      action,
      context,
      fingerprint,
      existing
    );
    if (businessDecision.shouldExecute) {
      return businessDecision;
    }

    // Apply deduplication rules
    const deduplicationDecision = this.applyDeduplicationRules(
      action,
      fingerprint,
      existing
    );

    return deduplicationDecision;
  }

  /**
   * Find existing execution of an action
   */
  private findExistingExecution(fingerprint: ActionFingerprint) {
    const key = this.generateFingerprintKey(fingerprint);
    const existing = this.executedActions.get(key);

    if (!existing) return null;

    // Check if within time window
    const now = Date.now();
    if (now - existing.timestamp > fingerprint.timeWindow) {
      this.executedActions.delete(key);
      return null;
    }

    return existing;
  }

  /**
   * Generate a unique key for a fingerprint
   */
  private generateFingerprintKey(fingerprint: ActionFingerprint): string {
    const core = `${fingerprint.actionName}:${fingerprint.contextId}`;
    const params = JSON.stringify(fingerprint.parameters);
    return `${core}:${params}`;
  }

  /**
   * Apply business rules to determine if action should execute
   */
  private applyBusinessRules(
    action: Action,
    context: ActionContext<any, any, any>,
    fingerprint: ActionFingerprint,
    existing: {
      fingerprint: ActionFingerprint;
      result: any;
      timestamp: number;
      attempts: number;
    }
  ): DeduplicationDecision {
    const business = action.metadata?.business;
    if (!business) {
      return { shouldExecute: false, reason: "No business rules defined" };
    }

    const timeGap = Date.now() - existing.timestamp;

    // Check if enough time has passed
    if (timeGap >= business.duplicateConditions.timeGap) {
      return {
        shouldExecute: true,
        reason: "Sufficient time gap for duplicate",
      };
    }

    // Check if context has changed
    if (
      business.duplicateConditions.contextChange &&
      this.hasContextChanged(context, existing.fingerprint)
    ) {
      return { shouldExecute: true, reason: "Context has changed" };
    }

    // Check if user confirmation is required
    if (business.duplicateConditions.userConfirmation) {
      return {
        shouldExecute: false,
        reason: "User confirmation required for duplicate",
        allowWithConfirmation: true,
        duplicateAction: existing.fingerprint,
      };
    }

    return {
      shouldExecute: false,
      reason: "Duplicate action blocked by business rules",
    };
  }

  /**
   * Apply deduplication rules
   */
  private applyDeduplicationRules(
    action: Action,
    fingerprint: ActionFingerprint,
    existing: {
      fingerprint: ActionFingerprint;
      result: any;
      timestamp: number;
      attempts: number;
    }
  ): DeduplicationDecision {
    const rules = action.metadata?.deduplication?.rules;
    if (!rules) {
      return { shouldExecute: false, reason: "No deduplication rules defined" };
    }

    // Check retry limits
    if (rules.allowRetries && existing.attempts < rules.maxRetries) {
      return { shouldExecute: true, reason: "Retry allowed within limits" };
    }

    // Check retry delay
    const timeSinceLastAttempt = Date.now() - existing.timestamp;
    if (rules.allowRetries && timeSinceLastAttempt >= rules.retryDelay) {
      return { shouldExecute: true, reason: "Retry delay satisfied" };
    }

    // Return cached result
    return {
      shouldExecute: false,
      reason: "Duplicate action - returning cached result",
      cachedResult: existing.result,
      duplicateAction: existing.fingerprint,
    };
  }

  /**
   * Check if context has changed significantly
   */
  private hasContextChanged(
    current: ActionContext<any, any, any>,
    previous: ActionFingerprint
  ): boolean {
    // Compare relevant context fields
    if (current.sessionId !== previous.sessionId) return true;
    if (current.userId !== previous.userId) return true;

    // Add more context comparison logic as needed
    return false;
  }

  /**
   * Record action execution for future deduplication
   */
  recordActionExecution(
    action: Action,
    context: ActionContext<any, any, any>,
    call: ActionCall,
    result: any
  ): void {
    const fingerprint = this.generateActionFingerprint(action, call, context);
    const key = this.generateFingerprintKey(fingerprint);

    const existing = this.executedActions.get(key);
    if (existing) {
      existing.attempts++;
      existing.timestamp = Date.now();
      existing.result = result;
    } else {
      this.executedActions.set(key, {
        fingerprint,
        result,
        timestamp: Date.now(),
        attempts: 1,
      });
    }

    this.logger.debug("deduplication:record", `Recorded action execution`, {
      actionName: action.name,
      fingerprint: key,
      attempts: existing ? existing.attempts : 1,
    });
  }

  /**
   * Clear old executions outside time windows
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, execution] of this.executedActions.entries()) {
      if (now - execution.timestamp > execution.fingerprint.timeWindow) {
        this.executedActions.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(
        "deduplication:cleanup",
        `Cleaned up ${cleaned} old executions`
      );
    }
  }
}
