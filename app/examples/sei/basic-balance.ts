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

// --- Helpers ---
const actionResponse = (content: string) => ({ data: { content }, content });
const parseJSONSafe = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// --- Env ---
const env = validateEnv(
  z.object({
    SEI_PRIVATE_KEY: z.string().min(1),
    SEI_RPC_URL: z.string().min(1),
  })
);

// --- Wallet Setup ---
const seiChain = new AxiomSeiWallet({
  rpcUrl: env.SEI_RPC_URL,
  privateKey: env.SEI_PRIVATE_KEY as `0x${string}`,
  chain: viemChains.seiTestnet,
});
const account = privateKeyToAccount(env.SEI_PRIVATE_KEY as `0x${string}`);
const initialWalletAddress = account.address;

// --- Agent Memory ---
type SeiMemory = {
  wallet: string;
  transactions: string[];
  lastTransaction: string | null;
  balance: number;
};

const template = ({
  wallet,
  lastTransaction,
  transactions,
  balance,
}: SeiMemory) =>
  `Axiomkit Sei Assistant

Wallet: ${wallet}
Balance: ${balance} SEI
Last Tx: ${lastTransaction ?? "N/A"}
Tx History:
${transactions.length ? transactions.join("\n") : "No transactions"}
`;

// --- Context & Actions ---
const seiAgentContext = context({
  type: "sei",
  schema: { wallet: z.string() },
  key: ({ wallet }) => wallet,
  create: ({ args }): SeiMemory => ({
    wallet: args.wallet,
    transactions: [],
    lastTransaction: null,
    balance: 0,
  }),
  render: ({ memory }) => template(memory),
  maxSteps: 1,
  instructions:
    "You are a SEI blockchain assistant. Always return valid JSON params for actions.",
})
  .setOutputs({ text: { schema: z.string() } })
  .setActions([
    action({
      name: "getBalance",
      description: "Get wallet balance",
      schema: { address: z.string().optional() },
      async handler({ address }, { memory }) {
        try {
          const target = address || memory.wallet;
          if (!target)
            return actionResponse("Error: No wallet address provided.");
          const balance = await seiChain.getERC20Balance();
          return actionResponse(`Balance for ${target}: ${balance} SEI`);
        } catch (err) {
          return actionResponse(
            `Error fetching balance: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      },
    }),
  ]);

// --- CLI Input Provider ---
const seiProvider = provider({
  name: "sei-cli",
  contexts: { sei: seiAgentContext },
  inputs: {
    cli: input({
      schema: z.object({ text: z.string() }),
      subscribe(send, agent) {
        const rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const loop = () =>
          rl.question("> ", async (text: string) => {
            if (text.trim()) {
              try {
                await agent.send({
                  context: seiAgentContext,
                  args: { wallet: initialWalletAddress },
                  input: { type: "cli", data: { text } },
                  handlers: {
                    onLogStream(log, done) {
                      if (!done) return;
                      if (log.ref === "output")
                        console.log(`Assistant: ${log.content || log.data}`);
                      if (log.ref === "action_call" && log.content) {
                        if (parseJSONSafe(log.content) === null)
                          console.warn(
                            `⚠️ Malformed JSON in action ${log.name}: ${log.content}`
                          );
                      }
                      if (log.ref === "action_result" && log.data?.content)
                        console.log(`Result: ${log.data.content}`);
                    },
                  },
                });
              } catch (err: any) {
                console.error("Error:", err.message || err);
              }
            }
            loop();
          });

        console.log("\nType commands (e.g., 'What is my Sei balance?')\n");
        loop();
        return () => rl.close();
      },
    }),
  },
});

// --- Create & Start Agent ---
const seiAxiom = createAgent({
  model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  providers: [seiProvider],
});

await seiAxiom.start();
console.log("✅ Sei Axiom agent started!");
console.log(`Wallet: ${initialWalletAddress}`);
console.log("Commands: try 'What is my Sei balance?'");

// --- Graceful Shutdown ---
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await seiAxiom.stop();
  console.log("✅ Shutdown complete");
  process.exit(0);
});
