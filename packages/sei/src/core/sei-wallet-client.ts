// Import polyfills first to ensure they're set up before viem
import "../polyfills.js";

import * as viemChains from "viem/chains";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sei } from "viem/chains";
import { erc20_transfer, get_erc20_balance } from "@/tokens/erc-20";
import { getTokenAddressFromTicker } from "@/providers/dexscreener";

export interface AxiomSeiWalletConfig {
  rpcUrl: string;
  privateKey: `0x${string}`;
  chain?: viemChains.Chain;
}

/**
 * Config for initializing a AxiomSeiWallet with a define basic configuration
 */
export class AxiomSeiWallet {
  public publicClient: PublicClient;
  public walletClient: WalletClient;
  public walletAdress: Address;

  constructor(config: AxiomSeiWalletConfig) {
    this.publicClient = createPublicClient({
      chain: config.chain || sei,
      transport: http(config.rpcUrl),
    });
    const account = privateKeyToAccount(config.privateKey);
    this.walletAdress = account.address;
    this.walletClient = createWalletClient({
      account,
      chain: config.chain || sei,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Gets the ERC20 token balance
   * @param contract_address Optional ERC-20 token contract address. If not provided, gets native SEI balance
   * @returns Promise with formatted balance as string
   */
  async getERC20Balance(contractAddress?: Address): Promise<string> {
    return get_erc20_balance(this, contractAddress);
  }

  /**
   * Gets a token address from its ticker symbol
   * @param ticker The token ticker symbol (e.g., "SEI", "USDC")
   * @returns Promise with token address or null if not found
   */
  async getTokenAddressFromTicker(ticker: string): Promise<Address | null> {
    return getTokenAddressFromTicker(ticker);
  }

  /**
   * Transfers SEI tokens or ERC-20 tokens
   * @param amount Amount to transfer as a string (e.g., "1.5" for 1.5 tokens)
   * @param recipient Recipient address
   * @param ticker Optional token ticker (if not provided, transfers native SEI)
   * @returns Promise with transaction result
   */
  async ERC20Transfer(
    amount: string,
    recipient: Address,
    ticker?: string
  ): Promise<string> {
    return erc20_transfer(this, amount, recipient, ticker);
  }
}
