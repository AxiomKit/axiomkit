import * as viemChains from "viem/chains";

import { createPublicClient, http, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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
      transport: http(),
    });

    this.signer = privateKeyToAccount(config.privateKey);
  }

  public getClient() {
    return this.client;
  }
}
