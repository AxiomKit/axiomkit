import * as viemChains from "viem/chains";

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface SeiChainConfig {
  chain: viemChains.Chain;
  rpcUrl: string;
  privateKey: `0x${string}`;
}

export class SeiChain {
  public chain: viemChains.Chain;
  public client: PublicClient;
  private walletClient: WalletClient;

  constructor(config: SeiChainConfig) {
    this.chain = config.chain;
    this.client = createPublicClient({
      chain: config.chain,
      transport: http(),
    });

    // this.signer = privateKeyToAccount(config.privateKey);
    this.walletClient = createWalletClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
      account: privateKeyToAccount(config.privateKey),
    });
  }

  public getClient() {
    return this.client;
  }
  public getWalletClient() {
    return this.walletClient;
  }
}
