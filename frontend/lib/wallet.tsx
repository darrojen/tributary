"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { arc, arcTestnet } from "viem/chains";

/** Arc ships as built-in viem chains — docs.arc.io/arc/references/connect-to-arc */
export const SUPPORTED = [arcTestnet, arc];
const CHAINS: Record<number, Chain> = {
  [arcTestnet.id]: arcTestnet,
  [arc.id]: arc,
};
const RPC: Record<number, string> = {
  [arcTestnet.id]: "https://rpc.testnet.arc.io",
  [arc.id]: "https://rpc.mainnet.arc.io",
};

type WalletState = {
  address?: `0x${string}`;
  chainId?: number;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchTo: (chainId: number) => Promise<void>;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
};

const Ctx = createContext<WalletState>(null as never);

export function useWallet() {
  return useContext(Ctx);
}

function getEthereum(): any {
  if (typeof window === "undefined") return undefined;
  return (window as any).ethereum;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [connecting, setConnecting] = useState(false);

  const eth = getEthereum();

  const publicClient = chainId
    ? createPublicClient({ chain: CHAINS[chainId], transport: http(RPC[chainId]) })
    : undefined;
  const walletClient =
    address && eth
      ? createWalletClient({
          account: address,
          chain: chainId ? CHAINS[chainId] : undefined,
          transport: custom(eth),
        })
      : undefined;

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      alert("Install MetaMask (or any EVM wallet) to use Tributary.");
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const cid: string = await eth.request({ method: "eth_chainId" });
      setAddress(accounts[0] as `0x${string}`);
      setChainId(parseInt(cid, 16));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(undefined);
  }, []);

  const switchTo = useCallback(async (target: number) => {
    const eth = getEthereum();
    if (!eth) return;
    const chain = CHAINS[target];
    const hexId = `0x${target.toString(16)}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e: any) {
      if (e?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: [chain.blockExplorers?.default.url ?? ""],
            },
          ],
        });
      } else {
        throw e;
      }
    }
    setChainId(target);
  }, []);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;
    const onAccounts = (accs: string[]) =>
      setAddress(accs[0] ? (accs[0] as `0x${string}`) : undefined);
    const onChain = (cid: string) => setChainId(parseInt(cid, 16));
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  return (
    <Ctx.Provider
      value={{ address, chainId, connecting, connect, disconnect, switchTo, publicClient, walletClient }}
    >
      {children}
    </Ctx.Provider>
  );
}

export { CHAINS, RPC };
