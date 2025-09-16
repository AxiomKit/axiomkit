import { parseUnits, formatUnits } from "viem";

export function formatSei(amount: string | number, decimals: number): bigint {
  const amountStr = typeof amount === "number" ? amount.toString() : amount;
  return parseUnits(amountStr, decimals);
}

export function formatWei(amount: number, decimals: number): number {
  return Number(formatUnits(BigInt(amount), decimals));
}
