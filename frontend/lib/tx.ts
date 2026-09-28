import { createPublicClient, encodeFunctionData, http, maxUint256, parseGwei, type Abi, type Address, type Chain, type Hex } from "viem";
import { CHAINS, RPC } from "./wallet";

const FALLBACK_RPC = "https://rpc.testnet.arc.io";

/** Build a client that never throws on unknown chain ids (e.g. wallet on Ethereum mainnet). */
function safeClient(chainId: number) {
  const chain: Chain | undefined = CHAINS[chainId];
  const url = RPC[chainId] ?? FALLBACK_RPC;
  return chain
    ? createPublicClient({ chain, transport: http(url) })
    : createPublicClient({ transport: http(url) });
}

/** Send a contract write through the injected wallet and wait for the receipt. */
export async function writeAndWait(
  eth: any,
  account: Address,
  chainId: number,
  to: Address,
  abi: Abi,
  functionName: string,
  args: readonly unknown[] = []
): Promise<Hex> {
  const { createWalletClient, custom } = await import("viem");
  const client = createWalletClient({ account, chain: CHAINS[chainId], transport: custom(eth) });
  const hash = await client.sendTransaction({
    account,
    to,
    data: encodeFunctionData({ abi, functionName, args: args as never }),
    maxFeePerGas: parseGwei("30"),
    maxPriorityFeePerGas: parseGwei("1"),
  });
  const publicClient = safeClient(chainId);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function readContract<T>(
  chainId: number,
  to: Address,
  abi: Abi,
  functionName: string,
  args: readonly unknown[] = []
): Promise<T> {
  const client = safeClient(chainId);
  return client.readContract({
    address: to,
    abi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<T>;
}

export { maxUint256 };
