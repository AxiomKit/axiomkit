import chalk from "chalk";
import { formatEther, type Address } from "viem";

import { getBalance, getTokenDecimals } from "@/utils/get-balance";
import { formatWei } from "@/utils/format";
import type { AxiomSeiWallet } from "@/core/sei-wallet-client";

/**
 * Get ERC-20 token balance for a wallet
 * @param agent AxiomSei Wallet instance
 * @param contractAddress Optional ERC-20 token contract address
 * @returns Promise with formatted balance as string
 */
export async function get_erc20_balance(
  agent: AxiomSeiWallet,
  contractAddress?: Address
): Promise<string> {
  console.log(
    chalk.blue(
      `Querying balance of ${contractAddress ? contractAddress : "SEI"} for ${
        agent.walletAdress
      }...`
    )
  );
  try {
    if (!contractAddress) {
      if (!agent.publicClient) {
        throw new Error("Public client not initialized");
      }

      if (!agent.walletAdress) {
        throw new Error("Wallet address not specified");
      }

      const balance = await agent.publicClient.getBalance({
        address: agent.walletAdress,
      });

      return formatEther(balance);
    }

    // Handle ERC-20 token balance
    if (!agent.publicClient || !agent.walletAdress) {
      throw new Error("Public client or wallet address not initialized");
    }

    const balance = await getBalance(agent, contractAddress);
    if (balance === null || balance === undefined) {
      throw new Error(
        `Failed to retrieve balance for contract: ${contractAddress}`
      );
    }

    const decimals = await getTokenDecimals(agent, contractAddress);
    if (decimals === null || decimals === undefined) {
      throw new Error(
        `Failed to retrieve token decimals for contract: ${contractAddress}`
      );
    }

    const formatBalance = formatWei(Number(balance), decimals);
    return formatBalance.toString() || "0";
  } catch (error) {
    const errorMsg = error instanceof Error ? error?.message : String(error);
    console.error(errorMsg);
    throw error;
  }
}
