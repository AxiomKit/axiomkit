import fetch, { Request, Response } from "node-fetch";

// Set up global polyfills for Node.js v16 compatibility
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = fetch as any;
}
if (typeof globalThis.Request === "undefined") {
  globalThis.Request = Request as any;
}
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = Response as any;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { AxiomSeiWallet } from "@axiomkit/sei";
import { type Address } from "viem";
import { validateEnv } from "@axiomkit/core";

// IMPORTANT: Ensure stdout is reserved for MCP JSON only.
// Redirect all non-error console output to stderr to avoid breaking MCP protocol.
const originalError = console.error.bind(console);
const redirectToStderr =
  (fnName: "log" | "info" | "warn" | "debug") =>
  (...args: any[]) =>
    originalError(...args);
console.log = redirectToStderr("log");
console.info = redirectToStderr("info");
console.warn = redirectToStderr("warn");
console.debug = redirectToStderr("debug");

// Create an MCP server for SEI blockchain operations
const server = new McpServer({
  name: "SEI MCP Agent",
  version: "1.0.0",
});

// Initialize Axiom Sei Wallet
let seiWallet: AxiomSeiWallet | null = null;

// Initialize the SEI wallet
function initializeSeiWallet() {
  const env = validateEnv(
    z.object({
      SEI_PRIVATE_KEY: z.string().min(1, "SEI_PRIVATE_KEY is required"),
      SEI_RPC_URL: z.string().min(1, "SEI_RPC_URL is required"),
    })
  );
  const rpcUrl = env.SEI_RPC_URL;
  const privateKey = env.SEI_PRIVATE_KEY;

  try {
    seiWallet = new AxiomSeiWallet({
      rpcUrl,
      privateKey: privateKey as `0x${string}`,
    });
    console.error(
      `SEI wallet initialized for address: ${seiWallet.walletAdress}`
    );
    return true;
  } catch (error) {
    console.error("Failed to initialize SEI wallet:", error);
    return false;
  }
}

// Tool: Get SEI or ERC-20 token balance
server.tool(
  "get_balance",
  {
    tokenAddress: z
      .string()
      .optional()
      .describe(
        "ERC-20 token contract address (optional, defaults to native SEI)"
      ),
  },
  async ({ tokenAddress }) => {
    if (!seiWallet) {
      return {
        content: [
          {
            type: "text",
            text: "Error: SEI wallet not initialized. Please set SEI_PRIVATE_KEY environment variable.",
          },
        ],
      };
    }

    try {
      const balance = await seiWallet.getERC20Balance(tokenAddress as Address);
      const tokenName = tokenAddress ? `Token (${tokenAddress})` : "SEI";

      return {
        content: [
          {
            type: "text",
            text: `Balance: ${balance} ${tokenName}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting balance: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Tool: Transfer SEI or ERC-20 tokens
server.tool(
  "transfer_tokens",
  {
    amount: z.string().describe("Amount to transfer (e.g., '1.5')"),
    recipient: z.string().describe("Recipient wallet address"),
    ticker: z
      .string()
      .optional()
      .describe("Token ticker symbol (optional, defaults to native SEI)"),
  },
  async ({ amount, recipient, ticker }) => {
    if (!seiWallet) {
      return {
        content: [
          {
            type: "text",
            text: "Error: SEI wallet not initialized. Please set SEI_PRIVATE_KEY environment variable.",
          },
        ],
      };
    }

    try {
      const result = await seiWallet.ERC20Transfer(
        amount,
        recipient as Address,
        ticker
      );

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error transferring tokens: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Tool: Get token address from ticker symbol
server.tool(
  "get_token_address",
  {
    ticker: z.string().describe("Token ticker symbol (e.g., 'SEI', 'USDC')"),
  },
  async ({ ticker }) => {
    if (!seiWallet) {
      return {
        content: [
          {
            type: "text",
            text: "Error: SEI wallet not initialized. Please set SEI_PRIVATE_KEY environment variable.",
          },
        ],
      };
    }

    try {
      const tokenAddress = await seiWallet.getTokenAddressFromTicker(ticker);

      if (!tokenAddress) {
        return {
          content: [
            {
              type: "text",
              text: `No token found for ticker: ${ticker}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Token address for ${ticker}: ${tokenAddress}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting token address: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Tool: Get wallet information
server.tool("get_wallet_info", {}, async () => {
  if (!seiWallet) {
    return {
      content: [
        {
          type: "text",
          text: "Error: SEI wallet not initialized. Please set SEI_PRIVATE_KEY environment variable.",
        },
      ],
    };
  }

  try {
    const balance = await seiWallet.getERC20Balance();

    return {
      content: [
        {
          type: "text",
          text: `Wallet Address: ${seiWallet.walletAdress}\nSEI Balance: ${balance}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error getting wallet info: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
    };
  }
});

async function main() {
  // Initialize SEI wallet
  if (!initializeSeiWallet()) {
    console.error(
      "Failed to initialize SEI wallet. Server will start but tools will not work."
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SEI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
