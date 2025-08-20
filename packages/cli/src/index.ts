import * as readline from "readline/promises";
import { service, context, input, extension, output } from "@axiomkit/core";
import * as z from "zod";

const readlineService = service({
  register(container) {
    container.singleton("readline", () =>
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    );
  },
});

const cli = context({
  type: "cli",
  key: ({ user }) => user.toString(),
  maxSteps: 5, // Reduced to prevent infinite loops
  schema: { user: z.string() },
  inputs: {
    "cli:message": input({
      description: "Receive user input from CLI",
      schema: z.string(),
      async subscribe(send, { container }) {
        const rl = container.resolve<readline.Interface>("readline");
        const controller = new AbortController();

        while (!controller.signal.aborted) {
          try {
            const question = await rl.question("> ");
            if (question.toLowerCase() === "exit") {
              console.log("Goodbye!");
              process.exit(0);
            }
            if (question.trim()) {
              console.log("User:", question);
              send(cli, { user: "admin" }, question);
            }
          } catch (error) {
            console.error("Error reading input:", error);
            break;
          }
        }

        return () => {
          controller.abort();
        };
      },
    }),
  },
  outputs: {
    "cli:message": output({
      description: "Send messages to the user via CLI",
      instructions: "Use plain text responses",
      schema: z.string(),
      handler(data) {
        console.log("Agent:", data);
        return {
          data,
        };
      },
      examples: [
        `<output type="cli:message">Hello! How can I help you today?</output>`,
      ],
    }),
  },
});

/**
 * Default CLI extension
 */
const cliExtension = extension({
  name: "cli",
  contexts: {
    cli,
  },
  services: [readlineService],
});

/**
 * Creates a CLI extension with custom instructions
 * This function allows users to create a CLI extension with specific instructions
 * for the agent's behavior in the CLI context.
 *
 * @param config - Configuration object for the CLI extension
 * @returns A configured CLI extension
 *
 * @example
 * ```typescript
 * const translatorCliExtension = createCliExtension({
 *   name: "translator",
 *   instructions: [
 *     "You are a professional translator.",
 *     "Your task is to translate user input accurately and concisely.",
 *     "When a user provides text and a target language, respond with ONLY the translated text.",
 *   ],
 * });
 * ```
 */
function createCliExtension(config: {
  name: string;
  instructions?: string[];
  description?: string;
  maxSteps?: number;
}) {
  // Create a custom CLI context with the provided instructions
  const customCli = context({
    type: "cli",
    key: ({ user }) => user.toString(),
    maxSteps: config.maxSteps || 10, // Prevent infinite loops
    schema: { user: z.string() },
    instructions: config.instructions,
    description: config.description,
    inputs: {
      "cli:message": input({
        description: "Receive user input from CLI",
        schema: z.string(),
        async subscribe(send, { container }) {
          const rl = container.resolve<readline.Interface>("readline");
          const controller = new AbortController();

          while (!controller.signal.aborted) {
            try {
              const question = await rl.question("> ");
              if (question.toLowerCase() === "exit") {
                console.log("Goodbye!");
                process.exit(0);
              }
              if (question.trim()) {
                console.log("User:", question);
                send(customCli, { user: "admin" }, question);
              }
            } catch (error) {
              console.error("Error reading input:", error);
              break;
            }
          }

          return () => {
            controller.abort();
          };
        },
      }),
    },
    outputs: {
      "cli:message": output({
        description: "Send messages to the user via CLI",
        instructions: "Use plain text responses",
        schema: z.string(),
        handler(data) {
          console.log("Agent:", data);
          return {
            data,
          };
        },
        examples: [
          `<output type="cli:message">Hello! How can I help you today?</output>`,
        ],
      }),
    },
  });

  return extension({
    name: config.name,
    contexts: {
      cli: customCli,
    },
    services: [readlineService],
  });
}

/**
 * Creates a simple CLI extension for basic chat functionality
 * This is a simplified version that focuses on basic input/output
 */
function createSimpleCliExtension(config: {
  name: string;
  instructions?: string[];
}) {
  const simpleCli = context({
    type: "cli",
    key: ({ user }) => user.toString(),
    maxSteps: 5, // Very limited to prevent loops
    schema: { user: z.string() },
    instructions: config.instructions || [
      "You are a helpful AI assistant.",
      "Respond to user input in a clear and concise manner.",
      "Do not use template variables or complex formatting.",
      "Provide direct, plain text responses.",
    ],
    inputs: {
      "cli:message": input({
        schema: z.string(),
        async subscribe(send, { container }) {
          const rl = container.resolve<readline.Interface>("readline");

          while (true) {
            try {
              const question = await rl.question("> ");
              if (question.toLowerCase() === "exit") {
                console.log("Goodbye!");
                process.exit(0);
              }
              if (question.trim()) {
                console.log("User:", question);
                send(simpleCli, { user: "admin" }, question);
              }
            } catch (error) {
              console.error("Error reading input:", error);
              break;
            }
          }
        },
      }),
    },
    outputs: {
      "cli:message": output({
        schema: z.string(),
        handler(data) {
          console.log("Agent:", data);
          return { data };
        },
      }),
    },
  });

  return extension({
    name: config.name,
    contexts: {
      cli: simpleCli,
    },
    services: [readlineService],
  });
}

// Export all functions and types
export {
  cli,
  cliExtension,
  readlineService,
  createCliExtension,
  createSimpleCliExtension,
};
