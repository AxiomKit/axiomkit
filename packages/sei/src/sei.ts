import * as viemChains from "viem/chains";
import { WalletProvider } from "./providers/wallet";
import { createPublicClient, http, type Abi, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
export const seiChains: Record<string, viemChains.Chain> = {
  mainnet: viemChains.sei,
  testnet: viemChains.seiTestnet,
  devnet: viemChains.seiDevnet,
};
export type SeiChainName = keyof typeof seiChains;
export interface SeiChainConfig {
  chain: viemChains.Chain;
  rpcUrl: string;
  privateKey: `0x${string}`;
}

export class SeiChain {
  public chain: viemChains.Chain;
  public client: PublicClient;
  private signer;

  constructor(config: SeiChainConfig) {
    this.chain = config.chain;
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl, config.chain),
    });

    console.log("What Wrong with Signer", config.privateKey);
    this.signer = privateKeyToAccount(config.privateKey);
  }

  // public async readContract(call: unknown) {
  //   const { functionName, address, abi, args } = call as {
  //     functionName: string;
  //     address: `0x${string}`;
  //     abi: Abi;
  //     args?: any[];
  //   };

  //   const data = await this.client.readContract({
  //     address: address,
  //     abi: abi,
  //     functionName: functionName,
  //     args: args ? [...args] : [],
  //   });
  //   return data;
  // }

  // public async writeContract(call: unknown) {
  //   const { functionName, address, abi, args } = call as {
  //     functionName: string;
  //     address: `0x${string}`;
  //     abi: Abi;
  //     args: any[];
  //   };
  // }

  public getClient() {
    return this.client;
  }
}
