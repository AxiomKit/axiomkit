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
      async handler({}, { memory }) {
        try {
          // Prevent multiple calls
          if (memory.balanceChecked) {
            return actionResponse(`Balance already checked: ${memory.balance} SEI`);
          }

          console.log("Checking balance for wallet:", memory.wallet);

          // Get the native SEI balance
          const balance = await seiChain.getERC20Balance();

          // Update memory with the current balance
          memory.balance = balance;
          memory.balanceChecked = true;

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
      subscribe(send, agent) {
        // This is a simple input that doesn't need subscription
        return () => {};
      },
    }),
  },
});

const seiAxiom = createAgent({
  model: groq("llama-3.1-8b-instant"),
  logLevel: LogLevel.DISABLED,
  providers: [seiProvider],
});

async function main() {
  console.log("Starting SEI Agent with Output Examples...");
  await seiAxiom.start();

  const query = "What is my SEI balance?";

  console.log(`Query: ${query}`);
  console.log(`Wallet: ${initialWalletAddress}`);

  try {
    // Example 1: Simple string output
    console.log("\n🔵 Example 1: Simple String Output");
    console.log("=" .repeat(50));

    const response1 = await seiAxiom.send({
      context: seiAgentContext,
      args: { wallet: initialWalletAddress },
      input: { type: "text", data: { text: query } },
      outputs: {
        balance: output({
          description: "Display the SEI balance information",
          schema: z.string().describe("The balance information message"),
          handler: async (data, ctx) => {
            console.log("💰 Balance Output Handler:");
            console.log(`   ${data}`);
            return { data, processed: true };
          },
        }),
      },
      handlers: {
        onLogStream(log, done) {
          if (log.ref === "action_result") {
            console.log(`🟢 Action result: ${log.data?.content || "Success"}`);
          } else if (log.ref === "output" && done) {
            console.log(`📤 Final Output: ${log.content || log.data}`);
          }
        },
      },
    });

    console.log("✅ Example 1 completed!");

    // Example 2: Structured object output
    console.log("\n🔵 Example 2: Structured Object Output");
    console.log("=" .repeat(50));

    const response2 = await seiAxiom.send({
      context: seiAgentContext,
      args: { wallet: initialWalletAddress },
      input: { type: "text", data: { text: "Show me my wallet details" } },
      outputs: {
        walletInfo: output({
          description: "Display comprehensive wallet information",
          schema: z.object({
            wallet: z.string().describe("The wallet address"),
            balance: z.string().describe("The SEI balance"),
            timestamp: z.number().describe("When the info was retrieved"),
            status: z.string().describe("The status of the query"),
          }),
          handler: async (data, ctx) => {
            console.log("📊 Wallet Info Output Handler:");
            console.log(`   Wallet: ${data.wallet}`);
            console.log(`   Balance: ${data.balance} SEI`);
            console.log(`   Timestamp: ${new Date(data.timestamp).toISOString()}`);
            console.log(`   Status: ${data.status}`);
            
            return {
              data: {
                ...data,
                processed: true,
              },
              processed: true,
            };
          },
        }),
      },
      handlers: {
        onLogStream(log, done) {
          if (log.ref === "action_result") {
            console.log(`🟢 Action result: ${log.data?.content || "Success"}`);
          } else if (log.ref === "output" && done) {
            console.log(`📤 Final Output: ${log.content || log.data}`);
          }
        },
      },
    });

    console.log("✅ Example 2 completed!");

    // Example 3: Multiple outputs
    console.log("\n🔵 Example 3: Multiple Outputs");
    console.log("=" .repeat(50));

    const response3 = await seiAxiom.send({
      context: seiAgentContext,
      args: { wallet: initialWalletAddress },
      input: { type: "text", data: { text: "Give me a summary and details" } },
      outputs: {
        summary: output({
          description: "Brief summary of the wallet",
          schema: z.string().describe("A brief summary message"),
          handler: async (data, ctx) => {
            console.log("📝 Summary Output Handler:");
            console.log(`   ${data}`);
            return { data, processed: true };
          },
        }),
        details: output({
          description: "Detailed wallet information",
          schema: z.object({
            address: z.string(),
            balance: z.string(),
            network: z.string(),
          }),
          handler: async (data, ctx) => {
            console.log("🔍 Details Output Handler:");
            console.log(`   Address: ${data.address}`);
            console.log(`   Balance: ${data.balance} SEI`);
            console.log(`   Network: ${data.network}`);
            return { data, processed: true };
          },
        }),
      },
      handlers: {
        onLogStream(log, done) {
          if (log.ref === "action_result") {
            console.log(`🟢 Action result: ${log.data?.content || "Success"}`);
          } else if (log.ref === "output" && done) {
            console.log(`📤 Final Output: ${log.content || log.data}`);
          }
        },
      },
    });

    console.log("✅ Example 3 completed!");

    console.log("\n🎉 All examples completed successfully!");
    console.log("📊 Response logs summary:");
    console.log(`   Example 1: ${response1.length} logs`);
    console.log(`   Example 2: ${response2.length} logs`);
    console.log(`   Example 3: ${response3.length} logs`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await seiAxiom.stop();
    console.log("Agent stopped.");
  }
}

main();
