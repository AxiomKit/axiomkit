import { createGroq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  LogLevel,
  validateEnv,
} from "@axiomkit/core";
import { telegram } from "@axiomkit/telegram";

import { z } from "zod";

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
  description: "Mark the order as confirmed and process it",
  schema: z.object({
    confirmed: z.boolean(),
    orderSummary: z.string().optional(),
  }),
  handler: async (
    { confirmed, orderSummary }: { confirmed: boolean; orderSummary?: string },
    ctx: any
  ) => {
    const memory = ctx.memory;
    memory.update({
      confirmed: confirmed,
      orderSummary: orderSummary,
    });

    if (confirmed) {
      return `✅ Order confirmed! Here's your order summary:\n${orderSummary}\n\nYour order has been processed and will be shipped soon.`;
    } else {
      return `❌ Order cancelled. Feel free to start a new order anytime!`;
    }
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
    orderSummary: z.string().optional(),
    chatId: z.number().optional(),
  }),
  instructions: `
You are a helpful AI order assistant on Telegram. Your job is to help users place orders for products.

## How to handle order requests:

1. **When user says "create order about product" or similar:**
   - Ask them what specific product they want to order
   - Be friendly and helpful

2. **When user mentions a product:**
   - Ask for the quantity they want
   - Ask for their name for the order
   - Ask for their delivery address

3. **When all details are provided:**
   - Summarize the order
   - Ask for confirmation before processing

4. **Keep responses natural and conversational:**
   - Don't use JSON format Example   {"content": "Great! Can you please tell me your name for the order?"} => let only reply Great! Can you please tell me your name for the order?
   - Be friendly and helpful
   - Keep messages concise but informative

## Current order state:
- Customer Name: {{memory.customerName || 'Not provided'}}
- Product: {{memory.product || 'Not provided'}}
- Quantity: {{memory.quantity || 'Not provided'}}
- Address: {{memory.address || 'Not provided'}}
- Confirmed: {{memory.confirmed ? 'Yes' : 'No'}}

## Response guidelines:
- Always respond in plain text, never JSON
- Be conversational and friendly
- Ask one question at a time to avoid overwhelming the user
- When all details are collected, provide a clear order summary
- Use the confirmOrder action when ready to process the order

Remember: You're helping a real person place an order, so be patient and helpful!
`,
  create: ({ args }, ctx) => ({
    customerName: args.customerName,
    product: args.product,
    quantity: args.quantity,
    address: args.address,
    confirmed: args.confirmed ?? false,
    orderSummary: args.orderSummary,
    chatId: args.chatId,
  }),
  // Add outputs to handle Telegram responses
  outputs: {
    "telegram:message": {
      attributes: {
        userId: z.string().describe("the userId to send the message to"),
      },
      schema: z.string().describe("the content of the message to send"),
      description: "use this to send a telegram message to user ",
      handler: async (data, ctx, { container }) => {
        console.log("Reply with this content");
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

createAgent({
  logLevel: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  context: orderContext,
  actions: [confirmOrder],
  extensions: [telegram],
}).start({ confirmed: false });
