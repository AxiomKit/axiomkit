import * as readline from "readline/promises";
import { service, context, input, extension, output } from "@axiomkit/core";
import * as z from "zod/v4";

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

// Flexible CLI context that can be customized
export const createCliContext = (config: {
  name?: string;
  instructions?: string | string[];
  maxSteps?: number;
  schema?: any;
}) => {
  const {
    name = "cli",
    instructions = "You are a helpful assistant.",
    maxSteps = 5,
    schema = { user: z.string() },
  } = config;

  return context({
    type: name,
    key: ({ user }) => user?.toString() || "default",
    maxSteps,
    schema,
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
        instructions:
          "Respond to the user's message according to your instructions",
        schema: z.string(),
        handler(data) {
          console.log("Agent:", data);
          return { data };
        },
      }),
    },
  });
};

// Create a flexible CLI extension
export const createCliExtension = (contextConfig?: any) => {
  const cliContext = createCliContext(contextConfig || {});

  return extension({
    name: "cli",
    contexts: {
      cli: cliContext,
    },
    services: [readlineService],
  });
};

// Pre-configured extensions for common use cases
export const echoCliExtension = createCliExtension({
  name: "echo",
  instructions: [
    "You are a simple echo bot.",
    "Your ONLY job is to repeat EXACTLY what the user says back to them.",
    "Do NOT add any additional words, greetings, or explanations.",
    "Just echo the user's message verbatim.",
    "If user says 'hi', you say 'hi'.",
    "Nothing more, nothing less.",
  ],
});

export const assistantCliExtension = createCliExtension({
  name: "assistant",
  instructions: [
    "You are a helpful and friendly assistant.",
    "You help users with their questions and tasks.",
    "Be concise but thorough in your responses.",
    "Always be polite and professional.",
  ],
});

// Default CLI extension (backward compatibility)
export const cliExtension = createCliExtension();
