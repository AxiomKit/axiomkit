import type { AxiomSeiWallet } from "@/core/sei-wallet-client";
import { getBalance } from "@/utils/get-balance";
import { isContract } from "@/utils/is-contract";
import type { Address } from "viem";

/**
 * Gets the ERC-721 token balance for a given wallet address
 *
 * @param agent Axiom Sei Wallet instance
 * @param token_address Address of the ERC-721 token contract
 * @returns Balance as a string
 */
export async function get_erc721_balance(
  agent: AxiomSeiWallet,
  token_address: Address
): Promise<string> {
  console.log(
    `Querying NFT balance for ${agent.walletAdress} at ${token_address}...`
  );

  try {
    const isTokenContract = await isContract(agent, token_address);
    if (!isTokenContract) {
      const errorMsg = `Address ${token_address} is not a contract`;
      throw new Error(errorMsg);
    }

    // Get the token balance
    const balance = await getBalance(agent, token_address);

    if (balance === null || balance === undefined) {
      const errorMsg = "Failed to retrieve token balance";
      throw new Error(errorMsg);
    }

    return String(balance);
  } catch (error) {
    const errorMsg = error instanceof Error ? error?.message : String(error);
    console.error(errorMsg);
    throw error;
  }
}
