import type { AxiomSeiWallet } from "@/core/sei-wallet-client";

export async function isContract(
  agent: AxiomSeiWallet,
  address: `0x${string}`
): Promise<boolean> {
  try {
    const code = await agent.publicClient.getCode({ address });
    return code !== "0x";
  } catch (error) {
    return false;
  }
}
