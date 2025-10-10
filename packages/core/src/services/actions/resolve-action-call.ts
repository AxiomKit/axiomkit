import type { Logger } from "@/logger";
import type { ActionCall, ActionCtxRef } from "@/types";
import { NotFoundError } from "@/types";

export function resolveActionCall({
  call,
  actions,
  logger,
}: {
  call: ActionCall;
  actions: readonly ActionCtxRef[];
  logger: Logger;
}): ActionCtxRef {
  const contextKey = call.params?.contextKey;

  const action = actions.find(
    (a) =>
      (contextKey ? contextKey === a.ctxRef.key : true) && a.name === call.name
  );

  if (!action) {
    const availableActions = actions.map((a) => a.name);
    const errorDetails = {
      error: "ACTION_MISMATCH",
      requestedAction: call.name,
      availableActions,
      contextKey,
      callContent: call.content,
      callId: call.id,
    };

    // If no actions are available, log a warning instead of error
    if (availableActions.length === 0) {
      logger.warn(
        "agent:action",
        `Action '${call.name}' called but no actions are available. This may indicate the LLM is not following instructions properly.`,
        errorDetails
      );
    } else {
      logger.error(
        "agent:action",
        `Action '${
          call.name
        }' not found. Available actions: ${availableActions.join(", ")}`,
        errorDetails
      );
    }

    throw new NotFoundError(call);
  }

  return action;
}
