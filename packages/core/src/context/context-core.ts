import { z, type ZodRawShape } from "zod/v4";
import type {
  AnyAction,
  AnyAgent,
  AnyContext,
  Context,
  ContextConfig,
  ContextSettings,
  ContextState,
  InferSchemaArguments,
} from "../types";
import { LogEventType, type StructuredLogger } from "../logs";

/**
 * Creates a context configuration
 * @template Memory - Type of working memory
 * @template Args - Zod schema type for context arguments
 * @template Ctx - Type of context data
 * @template Exports - Type of exported data
 * @param ctx - Context configuration object
 * @returns Typed context configuration
 */

export function context<
  TMemory = any,
  Args extends z.ZodTypeAny | ZodRawShape = any,
  Ctx = any,
  Actions extends AnyAction[] = AnyAction[],
  Events extends Record<string, z.ZodTypeAny | z.ZodRawShape> = Record<
    string,
    z.ZodTypeAny | z.ZodRawShape
  >
>(
  config: ContextConfig<TMemory, Args, Ctx, Actions, Events>
): Context<TMemory, Args, Ctx, Actions, Events> {
  const ctx: Context<TMemory, Args, Ctx, Actions, Events> = {
    ...config,
    setActions(actions) {
      Object.assign(ctx, { actions });
      return ctx as any;
    },
    setInputs(inputs) {
      ctx.inputs = inputs;
      return ctx;
    },
    setOutputs(outputs) {
      ctx.outputs = outputs;
      return ctx;
    },
    use(composer) {
      ctx.__composers = ctx.__composers?.concat(composer) ?? [composer];
      return ctx;
    },
  };

  return ctx;
}

export function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  const key = context.key ? context.key(args) : undefined;
  return key ? [context.type, key].join(":") : context.type;
}

export async function createContextState<TContext extends AnyContext>({
  agent,
  context,
  args,
  contexts = [],
  settings: initialSettings = {},
}: {
  agent: AnyAgent;
  context: TContext;
  args: InferSchemaArguments<TContext["schema"]>;
  contexts?: string[];
  settings?: ContextSettings;
}): Promise<ContextState<TContext>> {
  const key = context.key ? context.key(args) : undefined;
  const id = key ? [context.type, key].join(":") : context.type;

  // Log structured context create event if structured logger is available
  const structuredLogger =
    agent.container?.resolve<StructuredLogger>("structuredLogger");
  if (structuredLogger) {
    structuredLogger.logEvent({
      eventType: LogEventType.CONTEXT_CREATE,
      timestamp: Date.now(),
      requestContext: {
        requestId: "context-create", // Default since we may not have request context
        trackingEnabled: false,
      },
      contextType: context.type,
      contextId: id,
      argsHash: key,
    });
  }

  const settings: ContextSettings = {
    model: context.model,
    maxSteps: context.maxSteps,
    maxWorkingMemorySize: context.maxWorkingMemorySize,
    modelSettings: {
      ...(agent.modelSettings || {}),
      ...(context.modelSettings || {}),
      ...(initialSettings.modelSettings || {}),
    },
    ...initialSettings,
  };

  const options = context.setup
    ? await context.setup(args, settings, agent)
    : {};

  const memory =
    (context.load
      ? await context.load(id, { options, settings })
      : await agent.memory.store.get(`memory:${id}`)) ??
    (context.create
      ? await Promise.try(
          context.create,
          { key, args, id, options, settings },
          agent
        )
      : {});

  return {
    id,
    key,
    args,
    options,
    context,
    memory,
    settings,
    contexts,
  };
}

type ContextStateSnapshot = {
  id: string;
  type: string;
  args: any;
  key?: string;
  settings: Omit<ContextSettings, "model"> & { model?: string };
  contexts: string[];
};

export async function saveContextState(agent: AnyAgent, state: ContextState) {
  const { id, context, key, args, settings, contexts } = state;

  // Log structured context update event
  const structuredLogger =
    agent.container?.resolve<StructuredLogger>("structuredLogger");
  if (structuredLogger) {
    structuredLogger.logEvent({
      eventType: LogEventType.CONTEXT_UPDATE,
      timestamp: Date.now(),
      requestContext: {
        requestId: "context-save", // Default since we may not have request context
        trackingEnabled: false,
      },
      contextType: context.type,
      contextId: id,
      updateType: "state",
      details: {
        hasMemory: !!state.memory,
        contextCount: contexts.length,
        hasCustomSave: !!state.context.save,
      },
    });
  }

  await agent.memory.store.set<ContextStateSnapshot>(`context:${id}`, {
    id,
    type: context.type,
    key,
    args,
    settings: {
      ...settings,
      model: settings.model?.modelId,
    },
    contexts,
  });

  if (state.context.save) {
    await state.context.save(state);
  } else {
    await agent.memory.store.set<any>(`memory:${id}`, state.memory);
  }
}
export async function loadContextState(
  agent: AnyAgent,
  context: AnyContext,
  contextId: string
): Promise<Omit<ContextState, "options" | "memory"> | null> {
  const state = await agent.memory.store.get<ContextStateSnapshot>(
    `context:${contextId}`
  );

  if (!state) return null;

  return {
    ...state,
    context,
    settings: {
      ...state?.settings,
      // todo: agent resolve model?
      model: undefined,
    },
  };
}

export async function saveContextsIndex(
  agent: AnyAgent,
  contextIds: Set<string>
) {
  await agent.memory.store.set<string[]>(
    "contexts",
    Array.from(contextIds.values())
  );
}

function getContextData(
  contexts: Map<string, ContextState>,
  contextId: string
) {
  // todo: verify type?
  if (contexts.has(contextId)) {
    const state = contexts.get(contextId)!;
    return {
      id: contextId,
      type: state.context.type,
      key: state.key,
      args: state.args,
      settings: state.settings,
    };
  }

  const [type, key] = contextId.split(":");

  return {
    id: contextId,
    type,
    key,
  };
}

export function getContexts(
  contextIds: Set<string>,
  contexts: Map<string, ContextState>
) {
  return Array.from(contextIds.values())
    .filter((t) => !!t)
    .map((id) => getContextData(contexts, id));
}

export async function deleteContext(agent: AnyAgent, contextId: string) {
  await agent.memory.store.delete(`context:${contextId}`);
  await agent.memory.store.delete(`memory:${contextId}`);
  await agent.memory.store.delete(`working-memory:${contextId}`);
}
