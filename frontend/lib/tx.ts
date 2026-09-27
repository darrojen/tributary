import { createPublicClient, encodeFunctionData, http, maxUint256, parseGwei, type Abi, type Address, type Hex } from "viem";
import { CHAINS, RPC } from "./wallet";

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
  const publicClient = createPublicClient({ chain: CHAINS[chainId], transport: http(RPC[chainId]) });
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
  const { createPublicClient } = await import("viem");
  const client = createPublicClient({ chain: CHAINS[chainId], transport: http(RPC[chainId]) });
  return client.readContract({
    address: to,
    abi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<T>;
}

export { maxUint256 };
