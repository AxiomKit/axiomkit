export * from "./precompilers";
import type { Address, Hash } from "viem";
import * as viemChains from "viem/chains";

export const _SupportedChainList = Object.keys([
  viemChains.seiDevnet,
  viemChains.seiTestnet,
  viemChains.sei,
]) as Array<keyof typeof viemChains>;

export interface Transaction {
  hash: Hash;
  from: Address;
  to: string;
  value: bigint;
  data?: `0x${string}`;
  chainId?: number;
}
