import { Address } from "viem";

/** Arc native USDC ERC-20 interface address (identical on mainnet & testnet). */
export const USDC_ADDRESS: Address = "0x3600000000000000000000000000000000000000";
export const USDC_DECIMALS = 6;

/** Contract addresses — injected at deploy time via frontend/.env.local */
export const FLOW_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_FLOW_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";
export const SPLIT_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_SPLIT_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";

export const EXPLORER: Record<number, string> = {
  5042002: "https://testnet.arcscan.app",
  5042: "https://explorer.arc.io",
};

export function fmtUsdc(raw: bigint | undefined): string {
  if (raw === undefined) return "—";
  const whole = raw / 1_000_000n;
  const frac = (raw % 1_000_000n).toString().padStart(6, "0").slice(0, 2);
  return `${whole}.${frac}`;
}
