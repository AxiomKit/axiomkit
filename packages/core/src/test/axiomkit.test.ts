import { describe, it, expect } from "vitest";
import { z } from "zod";
import { context } from "../context";
import { createAgent } from "../agent";
import { MockLanguageModelV2 } from "ai/test";

const TestContext = context({
  type: "test",
  schema: z.object({ name: z.string() }) as any,
  setup: (args: any) => ({ greeting: `Hello, ${args.name}!` }),
  maxSteps: 1,
});

describe("AxiomKit Agent Creation Flow", () => {
  it("should create, start, and access context of an AI agent Axiomkit", async () => {
    const model = new MockLanguageModelV2({
      doGenerate: async (options) => ({
        content: [{ type: "text", text: "Test response" }],
        finishReason: "stop",
        usage: {
          promptTokens: 1,
          completionTokens: 1,
          inputTokens: 1,
          outputTokens: 1,
          totalTokens: 2,
        },
        warnings: [],
        rawCall: { rawPrompt: null, rawSettings: {} },
        providerMetadata: {},
        request: {},
        response: {},
      }),
    });

    // Create the agent
    const agent = createAgent({
      model,
      context: TestContext,
    });

    await agent.start({ name: "World" });

    expect(agent.isBooted()).toBe(true);
    const ctxState = await agent.getContext({
      context: TestContext,
      args: { name: "World" },
    });
    expect(ctxState).toBeDefined();
    expect(ctxState.options.greeting).toBe("Hello, World!");
  });
});
