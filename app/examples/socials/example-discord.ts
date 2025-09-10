import {
  createContainer,
  createAgent,
  LogLevel,
  validateEnv,
  Logger,
  context,
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
const discordContext = context({
  type: "discord-context",
  instructions: `You are a helpful Discord bot assistant. Your Name is ${env.DISCORD_BOT_NAME}. You will respond to messages in a friendly and helpful manner.

IMPORTANT: When responding to Discord messages, always output clean, natural text. Do NOT output JSON or code blocks unless specifically requested.

Guidelines:
- Keep responses conversational and friendly
- Use Discord formatting sparingly (bold, italic, etc.) when appropriate
- If someone asks for help with code, provide clear explanations
- For long responses, break them into multiple messages naturally
- Use emojis occasionally to make responses more engaging
- If someone shares an image or file, acknowledge it appropriately
- Be helpful but concise
- Don't Reply JSON like  {\"content\": \"Hey !  What's up?\"}\n  

Current context: You're in a Discord channel. Respond naturally as if chatting with friends.`,
});
const agent = createAgent({
  logger: new Logger({ level: LogLevel.DEBUG }),
  context: discordContext,
  model: groq("gemma2-9b-it"),
  providers: [discord],
  container,
});

console.log("Starting Axiomkit Discord Bot...");
await agent.start({
  id: "discord-bot",
});
console.log("Axiomkit Discord Bot started");
