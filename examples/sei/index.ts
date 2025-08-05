import { groq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  extension,
  input,
  validateEnv,
} from "@axiomkit/core";
import { SeiChain } from "sei/dist";
import { formatEther, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import * as z from "zod/v4";
const env = validateEnv(
  z.object({
    SEI_PRIVATE_KEY: z.string().min(1, "SEI_PRIVATE_KEY is required"),
    SEI_RPC_URL: z.string().min(1, "SEI_RPC_URL is required"),
  })
);

const seiChain = new SeiChain({
  rpcUrl: env.SEI_RPC_URL,
  privateKey: env.SEI_PRIVATE_KEY as `0x${string}`,
  chain: viemChains.seiTestnet,
});

type SeiMemory = {
  wallet: string;
  transactions: string[];
  lastTransaction: string | null;
  balance: number;
};

const account = privateKeyToAccount(env.SEI_PRIVATE_KEY as `0x${string}`);
const initialWalletAddress = account.address;

const template = ({
  wallet,
  lastTransaction,
  transactions,
  balance,
}: SeiMemory) => `Axiomkit Sei Trader/Assistant Status Report:

Wallet Address: ${wallet}
Current Balance: ${balance} SEI
Last Transaction ID: ${lastTransaction ?? "N/A"}
Transaction History (Most Recent First):
${
  transactions.length > 0
    ? transactions.join("\n")
    : "No recent transactions found."
}

RPC Provider: Helius (High-performance Sei RPC with full archival data)
Note: "Failed to query long-term storage" errors often indicate rate limiting. Please wait and retry. For persistent issues, respect the API limits.
`;
const actionResponse = (message: string) => ({
  data: message,
  content: message,
});
const seiAgentContext = context({
  type: "sei",
  schema: {
    wallet: z.string(),
  },
  key: ({ wallet }: { wallet: string }) => wallet,
  create({ args }): SeiMemory {
    console.log("Current Sei Memory");
    return {
      wallet: args.wallet,
      transactions: [],
      lastTransaction: null,
      balance: 0,
    };
  },
  render({ memory }) {
    return template(memory);
  },
})
  .setOutputs({
    message: {
      schema: z.string().describe("The message to send to the user"),
    },
  })
  .setActions([
    action({
      name: "getBalance",
      description:
        "Get the balance of a wallet address. If no address is provided, it will check the balance of the current active wallet.",
      schema: {
        address: z
          .string()
          .optional() // Make address optional
          .describe(
            "The sei wallet address to check balance for. Optional, defaults to the current active wallet."
          ),
      },
      async handler({ address }, { memory }) {
        const targetAddress = address || memory.wallet;
        console.log("What Current Address", targetAddress);
        const balance = await seiChain.client.getBalance({
          address: targetAddress as `0x${string}`,
          blockTag: `safe`,
        });
        if (!targetAddress) {
          return actionResponse(
            "Error: No wallet address provided and no primary wallet set in memory. Please provide an address or ensure your primary wallet is configured."
          );
        }

        const seiBalance = Number(formatEther(balance));
        if (targetAddress.toLowerCase() === memory.wallet.toLowerCase()) {
          memory.balance = seiBalance; // Update memory if it's the current wallet
        }
        return actionResponse(
          `Balance for ${address}: ${seiBalance} SEI lamports)`
        );
      },
    }),

    action({
      name: "transferToken",
      description: "Transfer tokens from one Sei wallet to another.",
      schema: {
        to: z.string().describe("The Sei wallet address transfer to."),
        amount: z
          .number()
          .min(0.000001, "Amount must be greater than 0")
          .describe("The amount of SEI to transfer."),
      },
      async handler({ to, amount }, { memory }) {
        try {
          const addressTo = to as `0x${string}`;
          console.log("Address to transfer to:", addressTo);
          console.log("Amount to transfer:", amount);
          if (!addressTo) {
            return actionResponse(
              "Error: No recipient address provided. Please provide a valid Sei wallet address."
            );
          }
          const balance = await seiChain.client.getBalance({
            address: memory.wallet as `0x${string}`,
            blockTag: `safe`,
          });
          const seiBalance = Number(formatEther(balance));
          if (seiBalance < amount) {
            return actionResponse(
              `Error: Insufficient balance. Current balance is ${seiBalance} SEI.`
            );
          }
          const wallet = seiChain.getWalletClient();
          const transaction = await wallet.sendTransaction({
            to: addressTo as `0x${string}`,
            value: parseEther(amount.toString()),
          });
          console.log("Transaction sent:", transaction);
        } catch (error) {
          return actionResponse(
            `Error: Failed to transfer tokens. ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    }),
  ]);

const seiExtension = extension({
  name: "sei-cli",
  contexts: {
    sei: seiAgentContext,
  },
  inputs: {
    cli: input({
      schema: z.object({
        text: z.string(),
      }),
      subscribe(send, agent) {
        const readline = require("readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const prompt = () => {
          rl.question("> ", async (text: string) => {
            if (text.trim()) {
              console.log(`User: ${text}`);
              const logs = await agent.send({
                context: seiAgentContext,
                // Pass the initialWalletAddress to the context creation args
                args: { wallet: initialWalletAddress },
                input: { type: "cli", data: { text } },
                handlers: {
                  onLogStream(log, done) {
                    if (done) {
                      if (log.ref === "output") {
                        const content = log.content || log.data;
                        if (content && !content.includes("attributes_schema")) {
                          console.log(`Assistant: ${content}`);
                        }
                      } else if (log.ref === "thought") {
                      }
                    }
                  },
                  onThinking(thought) {
                    console.log(`Thinking: ${thought.content}`);
                  },
                },
              });
            }
            prompt();
          });
        };

        console.log(
          "\nType your message and press Enter to send it to the agent.\n"
        );
        prompt();

        return () => {
          rl.close();
        };
      },
    }),
  },
  actions: [],
});
// Create Dreams instance
const seiAxiom = createAgent({
  model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  extensions: [seiExtension],
});

await seiAxiom.start();

console.log("✅ Sei Axiom gent started!");
console.log(`Wallet: `);
console.log("\nAvailable commands:");
console.log("  - Check balance: 'What is my Sei balance?'");
console.log("  - Get block height: 'What is the current block height?'");
console.log("  - Transfer tokens: 'Transfer 1 SEI to 0xRecipientAddress'");

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\nShutting down...");
  await seiAxiom.stop();
  console.log("✅ Shutdown complete");
  process.exit(0);
});
