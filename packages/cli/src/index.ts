import * as readline from "readline/promises";
import { service, context, input, provider, output } from "@axiomkit/core";
import * as z from "zod";

export const readlineService = service({
  register(container) {
    container.singleton("readline", () =>
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    );
  },
});

/**
 * Configuration for creating a CLI context.
 */
export interface CliContextConfig {
  name?: string;
  instructions?: string | string[];
  maxSteps?: number;
  schema?: z.ZodObject<z.ZodRawShape>;
}

// Flexible CLI context that can be customized
export const createCliContext = (config: CliContextConfig = {}) => {
  const {
    name = "cli",
    instructions = "You are a helpful assistant.",
    maxSteps = 5,
    schema = z.object({ user: z.string() }),
  } = config;

  return context({
    type: name,
    key: (args: unknown) => {
      const a = args as { user?: unknown };
      return a && typeof a.user === "string" ? a.user : "default";
    },
    maxSteps,
    schema: schema,
    instructions: Array.isArray(instructions) ? instructions : [instructions],

    inputs: {
      "cli:message": input({
        async subscribe(send, { container }) {
          const rl = container.resolve<readline.Interface>("readline");
          const controller = new AbortController();

          while (!controller.signal.aborted) {
            const question = await rl.question("> ");
            if (question === "exit") {
              break;
            }
            console.log("User:", question);
            send(createCliContext(config), { user: "admin" }, question);
          }

          return () => {
            controller.abort();
          };
        },
      }),
    },

    outputs: {
      "cli:message": output({
        description: "Send messages to the user",
        schema: z.string(),
        handler(data) {
          console.log("Agent:", data);
          return { data };
        },
      }),
    },
  });
};

/**
 * Create a flexible CLI tools for any context config.
 */
export const createCliProvider = (contextConfig?: CliContextConfig) => {
  const cliContext = createCliContext(contextConfig || {});

  return provider({
    name: "cli",
    contexts: {
      cli: cliContext,
    },
    services: [readlineService],
  });
};

export const assistantCliTool = createCliProvider({
  name: "assistant",
  instructions: [
    "You are a helpful and friendly assistant.",
    "You help users with their questions and tasks.",
    "Be concise but thorough in your responses.",
    "Always be polite and professional.",
  ],
});

export const cliProvider = createCliProvider();
