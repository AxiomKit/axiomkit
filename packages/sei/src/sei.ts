import { ethers } from "ethers";

import * as viemChains from "viem/chains";
import { WalletProvider } from "./providers/wallet";

export const seiChains: Record<string, viemChains.Chain> = {
  mainnet: viemChains.sei,
  testnet: viemChains.seiTestnet,
  devnet: viemChains.seiDevnet,
};
export type SeiChainName = keyof typeof seiChains;
export interface SeiChainConfig {
  chain: viemChains.Chain;
  rpcUrl: string;
  privateKey: string;
}

export class SeiChain {
  public chain: viemChains.Chain;
  private provider: ethers.JsonRpcProvider;
  // private walletProvider: WalletProvider;
  /**
   * Wallet instance for signing transactions
   */
  private signer: ethers.Wallet;

  constructor(private config: SeiChainConfig) {
    this.chain = config.chain;

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, {
      chainId: config.chain.id,
      name: config.chain.name,
    });
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    // this.walletProvider=new WalletProvider(config.privateKey,config.chain)
  }

  public async read(call: unknown): Promise<any> {
    try {
      const {
        contractAddress,
        abi,
        functionName,
        args = [],
      } = call as {
        contractAddress: string;
        abi: any;
        functionName: string;
        args?: any[];
      };

      const contract = new ethers.Contract(contractAddress, abi, this.provider);

      console.log("What Wrong With call data", call);
      return await contract[functionName](...args);
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred in read()");
    }
  }

  public async write(call: unknown): Promise<any> {
    try {
      const {
        contractAddress,
        abi,
        functionName,
        args = [],
        overrides = {},
      } = call as {
        contractAddress: string;
        abi: any;
        functionName: string;
        args?: any[];
        overrides?: ethers.Overrides;
      };

      const contract = new ethers.Contract(contractAddress, abi, this.signer);

      const tx = await contract[functionName](...args, overrides);

      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Unknown error occurred in write()");
    }
  }
}
