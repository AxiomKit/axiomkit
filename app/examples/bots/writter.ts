import { createAgent, context, action, input, output } from "@axiomkit/core";
import { groq } from "@ai-sdk/groq";
import * as z from "zod";

// Create a context - this is where the magic happens!
const assistantContext = context({
  type: "personal-assistant",

  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
  }),

  // Initialize memory for new users
  create: () => ({
    userName: "",
    lastTopic: "",
    preferences: {},
    conversationCount: 0,
  }),

  // Define what the LLM sees about this context
  render: (state) => {
    const { userName, conversationCount, lastTopic, preferences } =
      state.memory;

    return `
Personal Assistant for User: ${state.args.userId}
${
  userName ? `Name: ${userName}` : "⚠️ NAME UNKNOWN - Please tell me your name!"
}
Conversations: ${conversationCount}
${lastTopic ? `Last topic: ${lastTopic}` : ""}
${
  Object.keys(preferences).length > 0
    ? `Preferences: ${JSON.stringify(preferences, null, 2)}`
    : "No preferences saved yet"
}
    `.trim();
  },

  // Instructions that guide the assistant's behavior
  instructions: `You are a personal assistant with memory. You should:
- Remember information about the user across conversations
- Ask for their name if you don't know it
- Learn their preferences over time
- Reference previous conversations when relevant
- Be helpful and personalized based on what you know`,

  // Track conversation count
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
  },
})
  .setInputs({
    text: input({
      schema: z.string(),
      description: "Text input for user messages",
    }),
  })
  .setOutputs({
    text: output({
      schema: z.string(),
      description: "Text response from the agent",
    }),
  });

// Add actions the assistant can perform
assistantContext.setActions([
  action({
    name: "remember-name",
    description: "Remember the user's name",
    schema: z.object({
      name: z.string().describe("The user's name"),
    }),
    handler: async ({ name }, ctx) => {
      ctx.memory.userName = name;
      return {
        remembered: true,
        message: `I'll remember your name is ${name}`,
      };
    },
  }),

  action({
    name: "update-topic",
    description: "Remember what we're discussing",
    schema: z.object({
      topic: z.string().describe("Current conversation topic"),
    }),
    handler: async ({ topic }, ctx) => {
      ctx.memory.lastTopic = topic;
      return { updated: true };
    },
  }),
]);

// Create the agent
const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  contexts: [assistantContext],
});

// Simple test function
async function main() {
  agent.start();

  console.log("🤖 Personal Assistant Started!");
  console.log("💡 Testing memory functionality...\n");

  // Test 1: Tell the assistant your name
  console.log("Test 1: Telling assistant your name...");
  const result1 = await agent.send({
    context: assistantContext,
    args: { userId: "test-user" },
    input: { type: "text", data: "My name is Karas" },
  });
  console.log("Result 1:", result1);

  // Test 2: Ask if it remembers your name
  console.log("\nTest 2: Asking if it remembers your name...");
  const result2 = await agent.send({
    context: assistantContext,
    args: { userId: "test-user" },
    input: { type: "text", data: "Do you remember my name?" },
  });
  console.log("Result 2:", result2);

  console.log("\n✅ Test completed!");
}

main().catch(console.error);
