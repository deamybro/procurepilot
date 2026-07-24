import { formatUnits, parseUnits } from "viem";

export const TOKEN_DECIMALS = 6;

export function toAtomic(amount: string): bigint {
  return parseUnits(amount, TOKEN_DECIMALS);
}

export function fromAtomic(amount: bigint): string {
  return formatUnits(amount, TOKEN_DECIMALS);
}

export function addAmounts(...amounts: string[]): string {
  return fromAtomic(amounts.reduce((sum, amount) => sum + toAtomic(amount), 0n));
}

export function subtractAmounts(a: string, b: string): string {
  return fromAtomic(toAtomic(a) - toAtomic(b));
}

export function calculateFee(
  providerCost: string,
  config:
    | { type: "FLAT"; amount: string }
    | { type: "PERCENT"; basisPoints: number },
): string {
  if (config.type === "FLAT") return fromAtomic(toAtomic(config.amount));
  return fromAtomic(
    (toAtomic(providerCost) * BigInt(config.basisPoints)) / 10_000n,
  );
}
