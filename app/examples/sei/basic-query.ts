import { groq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  provider,
  input,
  validateEnv,
  output,
  LogLevel,
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
  create(params: any, agent: any): SeiMemory {
    const { args } = params;
    console.log("Initializing SEI wallet context for:", args.wallet);
    return {
      wallet: args.wallet,
      balance: "0",
      balanceChecked: false,
    };
  },
  render({ memory }: { memory: SeiMemory }) {
    return `SEI Wallet: ${memory.wallet}
Current Balance: ${memory.balance} SEI`;
  },
  maxSteps: 2,
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
      async handler({}, { memory }: { memory: SeiMemory }) {
        try {
          // Prevent multiple calls
          if (memory.balanceChecked) {
            return actionResponse(
              `Balance already checked: ${memory.balance} SEI`
            );
          }

          console.log("Checking balance for wallet:", memory.wallet);

          // Get the native SEI balance
          const balance = await seiChain.getERC20Balance();

          // Update memory with the current balance
          memory.balance = balance;
          memory.balanceChecked = true;

          return balance;
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
  logLevel: LogLevel.DISABLED,
  providers: [seiProvider],
});

async function main() {
  console.log("Starting SEI Agent...");
  await seiAxiom.start({
    id: "sei-agent",
  });

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
      outputs: {
        balance: output({
          description: "Display the SEI balance information",
          schema: z.string().describe("The balance information message"),
          handler: async (data: string, ctx: any) => {
            console.log("💰 Balance Output Handler:");
            console.log(`   ${data}`);
            return { data, processed: true };
          },
        }),
      },
      // handlers: {
      //   onLogStream(log: any, done: boolean) {
      //     if (log.ref === "action_result") {
      //       console.log(`🟢 Action result: ${log.data?.content || "Success"}`);
      //     } else if (log.ref === "output" && done) {
      //       console.log(`📤 Final Output: ${log.content || log.data}`);
      //     }
      //   },
      //   onThinking(thought: any) {
      //     console.log(`Thinking: ${thought.content}`);
      //   },
      // },
    });

    console.log("Response completed!");
    // console.log("📊 Response logs:", response);

    // Show the final response
    const finalOutput = response.find(
      (log: any) => log.ref === "output" && log.content
    );

    if (finalOutput) {
      console.log("✅ Final Response:", finalOutput.data);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await seiAxiom.stop();
    console.log("Agent stopped.");
  }
}

main();
