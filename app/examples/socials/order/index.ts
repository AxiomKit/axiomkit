import { createGroq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  LogLevel,
  validateEnv,
} from "@axiomkit/core";
import { telegram } from "@axiomkit/telegram";

import * as z from "zod/v4";

const env = validateEnv(
  z.object({
    TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

// Define an Action to confirm the order
const confirmOrder = action({
  name: "confirmOrder",
  description: "Mark the order as confirmed",
  schema: z.object({
    confirmed: z.boolean(),
  }),
  handler: async ({ confirmed }, ctx) => {
    const memory = ctx.memory;
    memory.update({
      confirmed: confirmed,
    });
    return `✅ Order has been ${confirmed ? "confirmed" : "cancelled"}.`;
  },
});

// Define Order Context as the PRIMARY context
const orderContext = context({
  type: "order-context",
  schema: z.object({
    customerName: z.string().optional(),
    product: z.string().optional(),
    quantity: z.number().optional(),
    address: z.string().optional(),
    confirmed: z.boolean().default(false),
    chatId: z.number().optional(), // Add chatId to link with Telegram
  }),
  instructions: `
You are an AI order assistant on Telegram.
Help the user place an order by:
1. Asking for missing details (name, product, quantity, address).
2. Confirming the final order before marking it confirmed.
Keep responses short and friendly.

Current order state:
- Customer Name: {{memory.customerName || 'Not provided'}}
- Product: {{memory.product || 'Not provided'}}
- Quantity: {{memory.quantity || 'Not provided'}}
- Address: {{memory.address || 'Not provided'}}
- Confirmed: {{memory.confirmed ? 'Yes' : 'No'}}

Ask for missing information and guide the user through the ordering process.
`,
  create: ({ args }) => ({
    customerName: args.customerName,
    product: args.product,
    quantity: args.quantity,
    address: args.address,
    confirmed: args.confirmed ?? false,
    chatId: args.chatId,
  }),
  // Add outputs to handle Telegram responses
  outputs: {
    "telegram:message": {
      attributes: {
        userId: z.string().describe("the userId to send the message to"),
      },
      schema: z.string().describe("the content of the message to send"),
      description: "use this to send a telegram message to user",
      handler: async (data, ctx, { container }) => {
        const tg = container.resolve("telegraf").telegram;
        const chunks = data.match(/.{1,4096}/g) || [data];

        for (const chunk of chunks) {
          await tg.sendMessage(ctx.outputRef.params!.userId, chunk, {
            parse_mode: "Markdown",
          });
        }

        return {
          data,
          timestamp: Date.now(),
        };
      },
    },
  },
});

// Create agent with orderContext as the PRIMARY context
createAgent({
  logLevel: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  context: orderContext, // Make this the primary context
  actions: [confirmOrder],
  extensions: [telegram],
}).start({ confirmed: false }); // Pass required field
