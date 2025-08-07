import {
  createContainer,
  createAgent,
  LogLevel,
  validateEnv,
  Logger,
} from "@axiomkit/core";
import * as z from "zod/v4";
import { discord } from "@axiomkit/discord";
import { groq } from "@ai-sdk/groq";
// Validate environment before proceeding
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
    DISCORD_BOT_NAME: z.string().min(1, "DISCORD_BOT_NAME is required"),
  })
);

const container = createContainer();

const agent = createAgent({
  logger: new Logger({ level: LogLevel.DEBUG }),
  model: groq("gemma2-9b-it"),
  extensions: [discord],
  container,
});

console.log("Starting Axiomkit Discord Bot...");
await agent.start();
console.log("Axiomkit Discord Bot started");
