"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { NETWORK_CHAIN, NETWORK_RPC } from "./network";

/** Arc ships as built-in viem chains — docs.arc.io/arc/references/connect-to-arc */
export const SUPPORTED = [NETWORK_CHAIN];
export const CHAINS: Record<number, Chain> = {
  [arcTestnet.id]: arcTestnet,
  [arc.id]: arc,
};
export const RPC: Record<number, string> = {
  [arcTestnet.id]: "https://rpc.testnet.arc.io",
  [arc.id]: "https://rpc.mainnet.arc.io",
};
/** RPC for the network this build targets. */
export { NETWORK_RPC };

/* ---------------- EIP-6963 multi-wallet discovery ---------------- */

export type WalletInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type DetectedProvider = {
  info: WalletInfo;
  provider: any;
};

const DISCOVERED: DetectedProvider[] = [];

export function startDiscovery() {
  if (typeof window === "undefined") return;
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail?.info || !detail?.provider) return;
    const existing = DISCOVERED.findIndex((w) => w.info.uuid === detail.info.uuid);
    if (existing >= 0) DISCOVERED[existing] = detail;
    else DISCOVERED.push(detail);
    window.dispatchEvent(new Event("tributary:wallets-changed"));
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function getDiscoveredWallets(): WalletInfo[] {
  return DISCOVERED.map((w) => w.info);
}

function findProvider(rdns: string): any | undefined {
  return DISCOVERED.find((w) => w.info.rdns === rdns)?.provider;
}

/* ---------------- Wallet context ---------------- */

type WalletState = {
  address?: `0x${string}`;
  chainId?: number;
  connecting: boolean;
  connectTarget?: WalletInfo;
  wallets: WalletInfo[];
  error: string;
  connectWith: (rdns: string) => Promise<void>;
  disconnect: () => void;
  switchTo: (chainId: number) => Promise<void>;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  refreshWallets: () => void;
  clearError: () => void;
};

const Ctx = createContext<WalletState>(null as never);

export function useWallet() {
  return useContext(Ctx);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [connecting, setConnecting] = useState(false);
  const [connectTarget, setConnectTarget] = useState<WalletInfo | undefined>();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    startDiscovery();
    const t = setTimeout(() => startDiscovery(), 250); // second sweep for late announcers
    const onChange = () => setWallets(getDiscoveredWallets());
    window.addEventListener("tributary:wallets-changed", onChange);
    setWallets(getDiscoveredWallets());
    return () => {
      clearTimeout(t);
      window.removeEventListener("tributary:wallets-changed", onChange);
    };
  }, []);

  // Silent eager-connect restore
  useEffect(() => {
    const restore = async () => {
      for (const w of DISCOVERED) {
        try {
          const accounts: string[] = await w.provider.request({ method: "eth_accounts" });
          if (accounts?.[0]) {
            const cid: string = await w.provider.request({ method: "eth_chainId" });
            setAddress(accounts[0] as `0x${string}`);
            setChainId(parseInt(cid, 16));
            break;
          }
        } catch {
          /* keep scanning */
        }
      }
    };
    restore();
  }, [tick]);

  // Never crash on an unsupported chain — fall back to a chain-agnostic client.
  const publicClient = useMemo(() => {
    if (!chainId) return undefined;
    const chain = CHAINS[chainId];
    return chain
      ? createPublicClient({ chain, transport: http(RPC[chainId]) })
      : createPublicClient({ transport: http(NETWORK_RPC) });
  }, [chainId]);

  const walletClient = useMemo(() => {
    if (!address) return undefined;
    const detected = DISCOVERED.find((w) => w.info.rdns === activeRdns) ?? DISCOVERED[0];
    if (!detected) return undefined;
    return createWalletClient({
      account: address,
      chain: chainId ? CHAINS[chainId] : undefined,
      transport: custom(detected.provider),
    });
  }, [address, chainId]);

  const connectWith = useCallback(async (rdns: string) => {
    const provider = findProvider(rdns);
    if (!provider) return;
    setError("");
    setConnecting(true);
    setConnectTarget(getDiscoveredWallets().find((w) => w.rdns === rdns));
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      const cid: string = await provider.request({ method: "eth_chainId" });
      activeRdns = rdns;
      setAddress(accounts[0] as `0x${string}`);
      setChainId(parseInt(cid, 16));
    } catch (e: any) {
      const name = getDiscoveredWallets().find((w) => w.rdns === rdns)?.name ?? "wallet";
      if (e?.code === 4001) setError(`Connection request was rejected in ${name}.`);
      else if (e?.code === -32002)
        setError(`${name} already has a pending request — open the extension and approve it, then try again.`);
      else setError(e?.message ? `${name}: ${String(e.message).slice(0, 140)}` : `Could not connect to ${name}.`);
      throw e;
    } finally {
      setConnecting(false);
      setConnectTarget(undefined);
    }
  }, []);

  const disconnect = useCallback(() => {
    activeRdns = "";
    setAddress(undefined);
  }, []);

  const refreshTick = useCallback(() => setTick((t) => t + 1), []);
  const clearError = useCallback(() => setError(""), []);

  const switchTo = useCallback(async (target: number) => {
    const detected = DISCOVERED.find((w) => w.info.rdns === activeRdns) ?? DISCOVERED[0];
    if (!detected) return;
    const chain = CHAINS[target];
    const hexId = `0x${target.toString(16)}`;
    try {
      await detected.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e: any) {
      // MetaMask often wraps 4902 (unrecognized chain) inside -32603 — treat any
      // non-rejection failure as "try adding the chain", which is always safe.
      const code = e?.code ?? e?.data?.originalError?.code;
      if (code !== 4001) {
        await detected.provider.request({
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
    const detected = DISCOVERED.find((w) => w.info.rdns === activeRdns) ?? DISCOVERED[0];
    if (!detected) return;
    const onAccounts = (accs: string[]) =>
      setAddress(accs[0] ? (accs[0] as `0x${string}`) : undefined);
    const onChain = (cid: string) => setChainId(parseInt(cid, 16));
    detected.provider.on?.("accountsChanged", onAccounts);
    detected.provider.on?.("chainChanged", onChain);
    return () => {
      detected.provider.removeListener?.("accountsChanged", onAccounts);
      detected.provider.removeListener?.("chainChanged", onChain);
    };
  }, [wallets]);

  return (
    <Ctx.Provider
      value={{
        address,
        chainId,
        connecting,
        connectTarget,
        wallets,
        error,
        connectWith,
        disconnect,
        switchTo,
        publicClient,
        walletClient,
        refreshWallets: refreshTick,
        clearError,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

let activeRdns = "";

export { CHAINS as chains };
