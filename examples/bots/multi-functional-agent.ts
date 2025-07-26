import { createAgent, context } from "@axiomkit/core";
import { createCliExtension } from "./extension";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

// Create a unified context that can handle multiple functions
const multiFunctionalContext = context({
  type: "multi-functional",
  schema: { sessionId: z.string() } as any,
  create: () => ({
    chatHistory: [],
    calculations: [],
    translations: [],
    writingTasks: [],
    projects: [],
    currentMode: "chat",
  }),
  render: (state: any) => `
    Multi-Functional Assistant Session: ${state.args.sessionId}
    Current Mode: ${state.memory.currentMode}
    Chat History: ${state.memory.chatHistory.length} messages
    Calculations: ${state.memory.calculations.length} performed
    Translations: ${state.memory.translations.length} done
    Writing Tasks: ${state.memory.writingTasks.length} created
    Projects: ${state.memory.projects.length} managed
  `,
  instructions: [
    "You are a multi-functional AI assistant with several capabilities:",
    "",
    "1. CHAT MODE - For general conversations:",
    "   - Be friendly and helpful",
    "   - Remember conversation history",
    "   - Respond naturally to greetings and questions",
    "",
    "2. CALCULATOR MODE - For mathematical calculations:",
    "   - When users ask math questions, calculate the result",
    "   - Show your work step by step for complex problems",
    "   - Support basic operations: +, -, *, /, ^, sqrt, percentages",
    "   - Always provide the final answer clearly",
    "",
    "3. TRANSLATOR MODE - For language translation:",
    "   - Translate text between different languages",
    "   - If no target language is specified, ask for it",
    "   - Support common languages: English, Spanish, French, German, Chinese, Japanese, Korean",
    "   - Provide accurate and natural translations",
    "",
    "4. WRITING MODE - For writing assistance:",
    "   - Help with writing, editing, and content creation",
    "   - Provide grammar and style feedback",
    "   - Generate creative content when requested",
    "   - Offer suggestions for improvement",
    "",
    "5. PROJECT MODE - For project management:",
    "   - Help manage tasks and projects",
    "   - Track progress and deadlines",
    "   - Organize information and create plans",
    "",
    "AUTOMATIC MODE DETECTION:",
    "- Math expressions (numbers, %, +, -, *, /) → Calculator mode",
    "- Translation keywords (translate, in Spanish, to French) → Translator mode",
    "- Writing keywords (write, edit, blog, story) → Writing mode",
    "- Project keywords (project, task, manage, organize) → Project mode",
    "- General conversation → Chat mode",
    "",
    "Always respond appropriately for the detected mode and maintain context-specific memory.",
  ],
});

// Create a simple CLI extension for the multi-functional context
const multiFunctionalCliExtension = createCliExtension({
  name: "multi-functional",
  instructions: [
    "You are a multi-functional AI assistant.",
    "Handle different types of requests: chat, calculations, translation, writing, and project management.",
    "Automatically detect the type of request and respond appropriately.",
  ],
});

// Create the multi-functional agent
const agent = createAgent({
  model: groq("gemma2-9b-it"),
  contexts: [multiFunctionalContext],
  extensions: [multiFunctionalCliExtension],
});

// Start the agent
async function main() {
  await agent.start();
  console.log("🤖 Multi-Functional AI Assistant started!");
  console.log("I can help you with:");
  console.log("💬 General chat and conversations");
  console.log("🧮 Mathematical calculations");
  console.log("🌍 Language translation");
  console.log("✍️ Writing and editing");
  console.log("📋 Project and task management");
  console.log("");
  console.log("Examples:");
  console.log("- 'Hello, how are you?' (Chat)");
  console.log("- 'What is 15% of 200?' (Calculator)");
  console.log("- 'Translate hello to Spanish' (Translator)");
  console.log("- 'Help me write a blog post about AI' (Writing)");
  console.log("- 'Create a new project called MyApp' (Project)");
  console.log("");
  console.log("Type 'exit' to quit.");
}

main();
