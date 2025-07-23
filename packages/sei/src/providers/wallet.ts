import { http, type Address, type Chain, type PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export class WalletProvider {
  public chain: Chain;
  private account: PrivateKeyAccount;
  constructor(
    accountOrPrivateKey: PrivateKeyAccount | `0x${string}`,
    chain: Chain
  ) {
    this.chain = chain;
    if (typeof accountOrPrivateKey === "string") {
      this.account = privateKeyToAccount(accountOrPrivateKey);
    } else {
      this.account = accountOrPrivateKey;
    }
  }

  getAddress(): Address {
    return this.account.address;
  }

  getCurrentChain(): Chain {
    return this.chain;
  }

  private createHttpTransport = () => {
    const chain = this.chain;

    if (chain.rpcUrls.custom) {
      return http(chain.rpcUrls.custom.http[0]);
    }
    return http(chain.rpcUrls.default.http[0]);
  };
}
