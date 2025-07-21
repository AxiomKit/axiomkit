import { ethers } from "ethers";
import type { IChain } from "@axiomkit/core";
import * as viemChains from "viem/chains";

export const seiChains: Record<string, viemChains.Chain> = {
  mainnet: viemChains.sei,
  testnet: viemChains.seiTestnet,
  devnet: viemChains.seiDevnet,
};
export type SeiChainName = keyof typeof seiChains;
export interface SeiChainConfig {
  chainName: SeiChainName;
  rpcUrl: string;
  privateKey: string;
}

export class SeiChain implements IChain {
  public chainId: string;
  private provider: ethers.JsonRpcProvider;
  /**
   * Wallet instance for signing transactions
   */
  private signer: ethers.Wallet;

  constructor(private config: SeiChainConfig) {
    console.log("What Problem", config.chainName);
    this.chainId = config.chainName;

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, {
      chainId: seiChains["mainet"].id,
      name: config.chainName,
    });
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
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
