"use client";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { createAgent, context } from "@axiomkit/core";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

const ChatAgentContextArgsSchema = z.object({ userId: z.string() });

// Memory type for the chat context
interface ChatAgentMemory {
  messages: ChatMessage[];
  lastSeen: string | null;
}

const ChatAgentContextDef = context({
  type: "chat",
  schema: ChatAgentContextArgsSchema as any,
  key: (args: any) => args.userId,
  create: ({ args }) => ({
    messages: [],
    lastSeen: null,
  }),
  instructions: (state) =>
    `You are helping user ${state.args.userId}. Be friendly and helpful.`,
  render: (state) =>
    `\n    Chat with ${
      state.args.userId
    }\n    Recent messages: ${state.memory.messages
      .slice(-3)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}\n  `,
  maxSteps: 1,
});

// Define the Zod schema for the custom:userMessage input
const UserMessageInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
});
type UserMessageInputType = z.infer<typeof UserMessageInputSchema>;

// Define the context value for the React Provider
interface AxiomKitAgentContextValue {
  agent: ReturnType<typeof createAgent>; // Type the agent correctly
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
}

// Create the React Context
const AxiomKitAgentContext = createContext<AxiomKitAgentContextValue | null>(
  null
);

// AxiomKitAgentProvider component
export function AxiomKitAgentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [agent] = useState(() =>
    createAgent({
      contexts: [ChatAgentContextDef],
      model: groq("qwen/qwen3-32b"),
      inputs: {
        "custom:userMessage": {
          schema: UserMessageInputSchema,
          handler: async (data, ctx) => {
            const state = ctx.memory as ChatAgentMemory;

            if (state && Array.isArray(state.messages)) {
              state.messages.push({ role: "user", content: data.message });
            }
            return { data };
          },
          format: (ref) =>
            `[InputRef ${
              (ref.data as UserMessageInputType).userId
            }] Player Message: "${(ref.data as UserMessageInputType).message}"`,
          context: ChatAgentContextDef,
        },
      },
    })
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Effect to start the agent when the component mounts
  useEffect(() => {
    agent.start({ userId: "321321321" }).catch(console.error);
  }, [agent]);

  function extractOutputContent(response: string): string | null {
    const match = response.match(/<output[^>]*>([\s\S]*?)<\/output>/);
    return match ? match[1].trim() : null;
  }
  const sendMessage = async (userMessage: string) => {
    setMessages((prevMsgs) => [
      ...prevMsgs,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await agent.send({
        context: ChatAgentContextDef,
        args: { userId: "321321321" },
        input: {
          type: "custom:userMessage",
          data: {
            userId: "321321321",
            message: userMessage,
          },
        },
      });

      let agentReply = "[No response]";
      console.log("Log Response", response);
      if (response && response.length > 0) {
        for (const logEntry of response) {
          if (
            logEntry &&
            typeof logEntry === "object" &&
            "data" in logEntry &&
            logEntry.data
          ) {
            if (typeof logEntry.data === "string") {
              const extracted = extractOutputContent(logEntry.data);
              if (extracted) {
                agentReply = extracted;
                break;
              } else {
                agentReply = logEntry.data;
              }
            } else if (
              typeof logEntry.data === "object" &&
              "response" in logEntry.data &&
              typeof logEntry.data.response === "string"
            ) {
              const extracted = extractOutputContent(logEntry.data.response);
              if (extracted) {
                agentReply = extracted;
                break;
              } else {
                agentReply = logEntry.data.response;
              }
            }
          }
        }
      }

      setMessages((prevMsgs) => [
        ...prevMsgs,
        { role: "agent", content: agentReply },
      ]);
    } catch (error) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          role: "agent",
          content: "[Error: Failed to get response from agent]",
        },
      ]);
    }
  };

  // Function to reset chat messages
  const reset = () => setMessages([]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ agent, messages, sendMessage, reset }),
    [agent, messages]
  );

  return (
    <AxiomKitAgentContext.Provider value={value}>
      {children}
    </AxiomKitAgentContext.Provider>
  );
}

// Custom hook to consume the AxiomKitAgentContext
export function useAxiomKitAgent() {
  const ctx = useContext(AxiomKitAgentContext);
  if (!ctx)
    throw new Error(
      "useAxiomKitAgent must be used within AxiomKitAgentProvider"
    );
  return ctx;
}
