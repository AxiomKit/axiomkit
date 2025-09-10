import type {
  ActionCall,
  ActionCallContext,
  AnyAction,
  AnyAgent,
  ActionResult,
} from "@/types";
import { randomUUIDv7 } from "@/utils";
import type { Logger } from "@/logger";
import type { TaskRunner } from "@/task";
import { runAction } from "@/tasks";
import { SmartDeduplicationEngine } from "@/handlers/smart-deduplication";

export async function handleActionCall({
  action,
  logger,
  call,
  taskRunner,
  agent,
  abortSignal,
  callCtx,
  queueKey,
}: {
  callCtx: ActionCallContext;
  call: ActionCall;
  action: AnyAction;
  logger: Logger;
  taskRunner: TaskRunner;
  agent: AnyAgent;
  abortSignal?: AbortSignal;
  queueKey?: string;
}): Promise<ActionResult> {
  // Initialize deduplication engine if not already present
  if (!agent.deduplicationEngine) {
    agent.deduplicationEngine = new SmartDeduplicationEngine(logger);
  }

  // Check if action should be executed based on deduplication rules
  const deduplicationDecision =
    await agent.deduplicationEngine.shouldExecuteAction(action, callCtx, call);

  // If action should not execute, return cached result or error
  if (!deduplicationDecision.shouldExecute) {
    if (deduplicationDecision.cachedResult) {
      logger.info(
        "deduplication:cache",
        `Returning cached result for ${action.name}`,
        {
          reason: deduplicationDecision.reason,
          actionId: call.id,
        }
      );

      return {
        ref: "action_result",
        id: randomUUIDv7(),
        callId: call.id,
        data: deduplicationDecision.cachedResult,
        name: call.name,
        timestamp: Date.now(),
        processed: false,
      };
    }

    if (deduplicationDecision.allowWithConfirmation) {
      logger.warn(
        "deduplication:confirmation",
        `Action ${action.name} requires confirmation`,
        {
          reason: deduplicationDecision.reason,
          actionId: call.id,
        }
      );

      return {
        ref: "action_result",
        id: randomUUIDv7(),
        callId: call.id,
        data: {
          error: "DUPLICATE_ACTION_REQUIRES_CONFIRMATION",
          message: deduplicationDecision.reason,
          duplicateAction: deduplicationDecision.duplicateAction,
        },
        name: call.name,
        timestamp: Date.now(),
        processed: false,
      };
    }

    // Action is blocked due to deduplication
    logger.warn(
      "deduplication:blocked",
      `Action ${action.name} blocked as duplicate`,
      {
        reason: deduplicationDecision.reason,
        actionId: call.id,
      }
    );

    return {
      ref: "action_result",
      id: randomUUIDv7(),
      callId: call.id,
      data: {
        error: "DUPLICATE_ACTION_BLOCKED",
        message: deduplicationDecision.reason,
        duplicateAction: deduplicationDecision.duplicateAction,
      },
      name: call.name,
      timestamp: Date.now(),
      processed: false,
    };
  }

  queueKey =
    queueKey ??
    (action.queueKey
      ? typeof action.queueKey === "function"
        ? action.queueKey(callCtx)
        : action.queueKey
      : undefined);

  const data = await taskRunner.enqueueTask(
    runAction,
    {
      action,
      agent,
      logger,
      ctx: callCtx,
    },
    {
      retry: action.retry,
      abortSignal,
      queueKey,
    }
  );

  const result: ActionResult = {
    ref: "action_result",
    id: randomUUIDv7(),
    callId: call.id,
    data,
    name: call.name,
    timestamp: Date.now(),
    processed: false,
  };

  if (action.format) result.formatted = action.format(result);

  if (callCtx.actionMemory && action.actionState) {
    await agent.memory.kv.set(action.actionState.key, callCtx.actionMemory);
  }

  if (action.onSuccess) {
    await Promise.try(action.onSuccess, result, callCtx, agent);
  }

  return result;
}
