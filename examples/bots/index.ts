// Example with a chat context - cli
import { context, validateEnv } from "@axiomkit/core";
import * as z from "zod/v4";

// Validation install .env
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

// // Manage context state , working memory , and execution logic for agent can interactions.
// const chatContext = await context({
//   type: "chat",
//   schema: {
//     userId: z.string(),
//   },
//   key: ({ userId }) => userId,
//   render({ args }) {
//     return ``;
//   },
// });
