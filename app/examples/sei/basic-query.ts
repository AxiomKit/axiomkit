import { groq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  provider,
  input,
  validateEnv,
} from "@axiomkit/core";
import { AxiomSeiWallet } from "sei/dist";

import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import * as z from "zod/v4";

const env = validateEnv(
  z.object({
    SEI_PRIVATE_KEY: z.string().min(1, "SEI_PRIVATE_KEY is required"),
    SEI_RPC_URL: z.string().min(1, "SEI_RPC_URL is required"),
  })
);

const seiChain = new AxiomSeiWallet({
  rpcUrl: env.SEI_RPC_URL,
  privateKey: env.SEI_PRIVATE_KEY as `0x${string}`,
  chain: viemChains.seiTestnet,
});

type SeiMemory = {
  wallet: string;
  balance: string;
  balanceChecked: boolean;
};

const account = privateKeyToAccount(env.SEI_PRIVATE_KEY as `0x${string}`);
const initialWalletAddress = account.address;

const template = ({ wallet, balance }: SeiMemory) => `SEI Wallet Assistant

Wallet Address: ${wallet}
Current Balance: ${balance} SEI

I can help you check your SEI balance and answer questions about your wallet.`;

const actionResponse = (message: string) => ({
  data: { content: message },
  content: message,
});

const seiAgentContext = context({
  type: "sei",
  schema: {
    wallet: z.string(),
  },
  key: ({ wallet }: { wallet: string }) => wallet,
  create({ args }): SeiMemory {
    console.log("Initializing SEI wallet context for:", args.wallet);
    return {
      wallet: args.wallet,
      balance: "0",
      balanceChecked: false,
    };
  },
  render({ memory }) {
    return `SEI Wallet: ${memory.wallet}
Current Balance: ${memory.balance} SEI`;
  },
  maxSteps: 1,
  instructions: `You are a simple SEI balance checker. When asked about balance, call getBalance action once and respond with the result.`,
})
  .setOutputs({
    text: {
      schema: z.string().describe("The message to send to the user"),
    },
  })
  .setActions([
    action({
      name: "getBalance",
      description: "Get the SEI balance of the current wallet.",
      schema: z.object({}),
      async handler({}, { memory }) {
        try {
          console.log("Checking balance for wallet:", memory.wallet);

          // Get the native SEI balance
          const balance = await seiChain.getERC20Balance();

          // Update memory with the current balance
          memory.balance = balance;

          return actionResponse(`Your SEI balance is ${balance} SEI`);
        } catch (error) {
          console.error("Error getting balance:", error);
          return actionResponse(
            `Error: Failed to get balance. ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    }),
  ]);

// Custom Provider for Sei implementation
const seiProvider = provider({
  name: "sei-provider",
  contexts: {
    sei: seiAgentContext,
  },
  inputs: {
    text: input({
      schema: z.object({
        text: z.string(),
      }),
    }),
  },
});

const seiAxiom = createAgent({
  model: groq("qwen/qwen3-32b"),
  providers: [seiProvider],
});

async function main() {
  console.log("Starting SEI Agent...");
  await seiAxiom.start();

  const query = "What is my SEI balance?";

  console.log(`Query: ${query}`);
  console.log(`Wallet: ${initialWalletAddress}`);

  try {
    // Use the Axiom framework properly with a simple approach
    console.log("🔵 Using Axiom framework to process query...");

    const response = await seiAxiom.send({
      context: seiAgentContext,
      args: { wallet: initialWalletAddress },
      input: { type: "text", data: { text: query } },
      handlers: {
        onLogStream(log, done) {
          // if (done && log.ref === "output") {
          //   const content = log.content || log.data;
          //   if (content && !content.includes("attributes_schema")) {
          //     console.log(`Assistant: ${content}`);
          //   }
          // } else if (log.ref === "action_call") {
          //   console.log(`🔵 Action called: ${log.name}`); }
          if (log.ref === "action_result") {
            console.log(`🟢 Action result: ${log.data?.content || "Success"}`);
          }
        },
        onThinking(thought) {
          console.log(`Thinking: ${thought.content}`);
        },
      },
    });

    console.log("Response completed!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await seiAxiom.stop();
    console.log("Agent stopped.");
  }
}

main();
