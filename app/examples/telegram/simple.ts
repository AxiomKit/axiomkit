import { createGroq } from "@ai-sdk/groq";
import { createAgent, LogLevel, validateEnv } from "@axiomkit/core";
import { telegram } from "@axiomkit/telegram";

import * as z from "zod/v4";

// Simple Chat

const env = validateEnv(
  z.object({
    TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

createAgent({
  logLevel: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [telegram],
}).start();
