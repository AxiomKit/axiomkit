import type { AnyAgent, AnyRef, Log, WorkingMemory } from "../types";
import { formatContextLog, memory } from "../utils";

/**
 * Retrieves and sorts working memory logs
 * @param memory - Working memory object
 * @param includeThoughts - Whether to include thought logs (default: true)
 * @returns Sorted array of memory logs
 */
export function getWorkingMemoryLogs(
  memory: Partial<WorkingMemory>,
  includeThoughts = true
): Log[] {
  return [
    ...(memory.inputs ?? []),
    ...(memory.outputs ?? []),
    ...(memory.calls ?? []),
    ...((includeThoughts ? memory.thoughts : undefined) ?? []),
    ...(memory.results ?? []),
    ...(memory.events ?? []),
  ].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
}

export function getWorkingMemoryAllLogs(
  memory: Partial<WorkingMemory>,
  includeThoughts = true
): AnyRef[] {
  return [
    ...(memory.inputs ?? []),
    ...(memory.outputs ?? []),
    ...(memory.calls ?? []),
    ...((includeThoughts ? memory.thoughts : undefined) ?? []),
    ...(memory.results ?? []),
    ...(memory.events ?? []),
    ...(memory.steps ?? []),
    ...(memory.runs ?? []),
  ].sort((a, b) => (a.timestamp >= b.timestamp ? 1 : -1));
}

export function formatWorkingMemory({
  memory,
  processed,
  size,
}: {
  memory: Partial<WorkingMemory>;
  processed: boolean;
  size?: number;
}) {
  let logs = getWorkingMemoryLogs(memory, false).filter(
    (i) => i.processed === processed
  );

  if (size) {
    logs = logs.slice(-size);
  }

  return logs.map((i) => formatContextLog(i)).flat();
}

/**
 * Creates a default working memory object
 * @returns Empty working memory with initialized arrays
 */
export function createWorkingMemory(): WorkingMemory {
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
    runs: [],
    steps: [],
    events: [],
  };
}

export function pushToWorkingMemory(workingMemory: WorkingMemory, ref: AnyRef) {
  if (!workingMemory || !ref) {
    throw new Error("workingMemory and ref must not be null or undefined");
  }

  switch (ref.ref) {
    case "action_call":
      workingMemory.calls.push(ref);
      break;
    case "action_result":
      workingMemory.results.push(ref);
      break;
    case "input":
      workingMemory.inputs.push(ref);
      break;
    case "output":
      workingMemory.outputs.push(ref);
      break;
    case "thought":
      workingMemory.thoughts.push(ref);
      break;
    case "event":
      workingMemory.events.push(ref);
      break;
    case "step":
      workingMemory.steps.push(ref);
      break;
    case "run":
      workingMemory.runs.push(ref);
      break;
    default:
      throw new Error("invalid ref");
  }
}

/**
 * Default working memory config
 * Provides a memory container with standard working memory structure
 */
export const defaultWorkingMemory = memory<WorkingMemory>({
  key: "working-memory",
  create: createWorkingMemory,
});

export async function getContextWorkingMemory(
  agent: AnyAgent,
  contextId: string
) {
  let workingMemory = await agent.memory.store.get<WorkingMemory>(
    ["working-memory", contextId].join(":")
  );

  if (!workingMemory) {
    workingMemory = await defaultWorkingMemory.create();
    await agent.memory.store.set(
      ["working-memory", contextId].join(":"),
      workingMemory
    );
  }

  return workingMemory;
}

export async function saveContextWorkingMemory(
  agent: AnyAgent,
  contextId: string,
  workingMemory: WorkingMemory
) {
  return await agent.memory.store.set(
    ["working-memory", contextId].join(":"),
    workingMemory
  );
}
