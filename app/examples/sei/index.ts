import { groq } from "@ai-sdk/groq";
import {
  action,
  context,
  createAgent,
  provider,
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
  maxSteps: 10,
  instructions: `You are a SEI blockchain assistant. When calling actions, always provide complete and valid JSON parameters. Never leave JSON incomplete or malformed.`,
})
  .setOutputs({
    text: {
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
          .optional()
          .describe(
            "The sei wallet address to check balance for. Optional, defaults to the current active wallet."
          ),
      },

      async handler({ address }, { memory }) {
        try {
          const targetAddress = address || memory.wallet;
          console.log("What Current Address", targetAddress);

          if (!targetAddress) {
            return actionResponse(
              "Error: No wallet address provided and no primary wallet set in memory. Please provide an address or ensure your primary wallet is configured."
            );
          }

          const balance = await seiChain.client.getBalance({
            address: targetAddress as `0x${string}`,
            blockTag: `safe`,
          });

          const seiBalance = Number(formatEther(balance));
          if (targetAddress.toLowerCase() === memory.wallet.toLowerCase()) {
            memory.balance = seiBalance; // Update memory if it's the current wallet
          }

          // If this is the current wallet and we have a recent transfer, use the updated balance from memory
          let finalBalance = seiBalance;
          if (
            targetAddress.toLowerCase() === memory.wallet.toLowerCase() &&
            memory.balance !== seiBalance
          ) {
            finalBalance = memory.balance;
            console.log(
              `📊 Using updated balance from memory: ${finalBalance} SEI (instead of ${seiBalance} SEI)`
            );
          }

          return actionResponse(`Balance for ${address}: ${finalBalance} SEI`);
        } catch (error) {
          return actionResponse(
            `Error: Failed to get balance. ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
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

          // Update memory with transaction details
          const transferId = `transfer_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          memory.transactions.unshift(
            `Transfer: ${amount} SEI to ${addressTo} (${transaction}) [ID: ${transferId}]`
          );
          memory.lastTransaction = transaction;

          // Update the balance in memory after the transfer
          memory.balance = memory.balance - amount;

          console.log(`✅ Transfer completed with ID: ${transferId}`);
          console.log(`   Amount: ${amount} SEI`);
          console.log(`   To: ${addressTo}`);
          console.log(`   Hash: ${transaction}`);
          console.log(`   New balance: ${memory.balance} SEI`);

          return actionResponse(
            `Successfully transferred ${amount} SEI to ${addressTo}. Transaction hash: ${transaction}. New balance: ${memory.balance} SEI`
          );
        } catch (error) {
          return actionResponse(
            `Error: Failed to transfer tokens. ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    }),

    action({
      name: "getSeiPrice",
      description: "Fetch the latest real-time price of the SEI token in USD.",

      async handler() {
        try {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd"
          );
          const data = await res.json();
          console.log("SEI price (USD):", data["sei-network"].usd);
          return actionResponse(
            `The current price of SEI is ${data["sei-network"].usd} USD.`
          );
        } catch (error) {
          return actionResponse(
            `Error: Failed to fetch SEI price. ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    }),
  ]);

// Custom Provider for Sei implementation
const seiProvider = provider({
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
              try {
                const logs = await agent.send({
                  context: seiAgentContext,
                  args: { wallet: initialWalletAddress },
                  input: { type: "cli", data: { text } },
                  handlers: {
                    onLogStream(log, done) {
                      try {
                        if (done) {
                          if (log.ref === "output") {
                            const content = log.content || log.data;
                            if (
                              content &&
                              !content.includes("attributes_schema")
                            ) {
                              console.log(`Assistant: ${content}`);
                            }
                          } else if (log.ref === "thought") {
                            // Handle thought logs if needed
                          } else if (log.ref === "action_call") {
                            // Handle action calls with validation
                            console.log(
                              `🔵 Action called: ${log.name} with ID: ${log.id}`
                            );
                            console.log(`   Content: ${log.content}`);
                            console.log(`   Data: ${JSON.stringify(log.data)}`);

                            // Validate action call content
                            if (log.content && log.content.trim()) {
                              try {
                                // Try to parse the content to catch JSON errors early
                                if (
                                  log.content.includes("{") ||
                                  log.content.includes("[")
                                ) {
                                  JSON.parse(log.content);
                                }
                              } catch (parseError) {
                                console.warn(
                                  `Warning: Action call ${log.name} has malformed JSON content:`,
                                  log.content
                                );
                              }
                            }
                          } else if (log.ref === "action_result") {
                            // Handle action results
                            console.log(
                              `🟢 Action result for: ${log.name} with ID: ${log.id}`
                            );
                            if (log.data && log.data.content) {
                              console.log(`   Result: ${log.data.content}`);
                            }
                          }
                        }
                      } catch (error) {
                        console.error("Error processing log:", error);
                      }
                    },
                    onThinking(thought) {
                      console.log(`Thinking: ${thought.content}`);
                    },
                  },
                });
              } catch (error) {
                console.error("Error sending message to agent:", error);

                // Handle specific JSON parsing errors
                if (
                  error instanceof Error &&
                  error.message.includes("Request timeout")
                ) {
                  console.log(
                    "Assistant: The request timed out. Please try again with a simpler request."
                  );
                } else if (
                  error instanceof Error &&
                  error.message.includes("JSON Parse error")
                ) {
                  console.log(
                    "Assistant: I encountered a JSON parsing error. This usually means the response was incomplete. Please try again with a simpler request."
                  );
                } else if (
                  error instanceof Error &&
                  error.message.includes("Unexpected EOF")
                ) {
                  console.log(
                    "Assistant: I encountered an incomplete response error. Please try again with a clearer request."
                  );
                } else {
                  console.log(
                    "Assistant: I encountered an error processing your request. Please try again."
                  );
                }
              }
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

const seiAxiom = createAgent({
  model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  providers: [seiProvider],
});

await seiAxiom.start();

console.log("✅ Sei Axiom agent started!");
console.log(`Wallet: ${initialWalletAddress}`);
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
