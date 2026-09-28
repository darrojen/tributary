import { arc, arcTestnet, type Chain } from "viem/chains";

/**
 * Which Arc network this build targets.
 *   NEXT_PUBLIC_NETWORK=testnet  → Arc testnet (chain 5042002)
 *   NEXT_PUBLIC_NETWORK=mainnet  → Arc mainnet (chain 5042)
 * Contract addresses come from NEXT_PUBLIC_FLOW_ADDRESS / NEXT_PUBLIC_SPLIT_ADDRESS
 * and must belong to the same network. NEXT_PUBLIC_* vars are inlined at build time,
 * so changing networks requires a rebuild/redeploy.
 */
export const NETWORK_NAME = (process.env.NEXT_PUBLIC_NETWORK ?? "testnet").toLowerCase();
export const IS_MAINNET = NETWORK_NAME === "mainnet";
export const NETWORK_CHAIN: Chain = IS_MAINNET ? arc : arcTestnet;
export const CHAIN_ID: number = NETWORK_CHAIN.id; // 5042 | 5042002
export const NETWORK_RPC = IS_MAINNET
  ? "https://rpc.mainnet.arc.io"
  : "https://rpc.testnet.arc.io";
export const NETWORK_LABEL = IS_MAINNET ? "Mainnet" : "Testnet";
export const NETWORK_EXPLORER = IS_MAINNET
  ? "https://explorer.arc.io"
  : "https://testnet.arcscan.app";

/** Earliest block scanned for StreamCreated/SplitCreated events.
 *  Set to the contract deploy block (from the explorer) for fast first paint.
 *  Defaults to 0 = scan the whole chain (slower but always correct). */
export const LISTING_FROM_BLOCK = BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK ?? "0");
