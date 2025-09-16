import type { AxiomSeiWallet } from "@/core/sei-wallet-client";
import { parseAbi, type Address } from "viem";

const erc20BalanceAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
]);

export async function getBalance(
  agent: AxiomSeiWallet,
  tokenAddress: Address
): Promise<bigint> {
  const balance = await agent.publicClient.readContract({
    address: tokenAddress,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [agent.walletAdress],
  });

  return balance;
}

const erc20DecimalsAbi = parseAbi(["function decimals() view returns (uint8)"]);
export async function getTokenDecimals(
  agent: AxiomSeiWallet,
  tokenAddress: Address
): Promise<number> {
  const decimals = await agent.publicClient.readContract({
    address: tokenAddress,
    abi: erc20DecimalsAbi,
    functionName: "decimals",
  });

  return decimals;
}
