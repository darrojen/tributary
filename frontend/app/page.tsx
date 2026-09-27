"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet, SUPPORTED, CHAINS } from "../lib/wallet";
import { readContract } from "../lib/tx";
import { USDC_ADDRESS, FLOW_ADDRESS, fmtUsdc } from "../lib/addresses";
import { ERC20_ABI } from "../lib/abis";
import { StreamsPanel } from "../components/StreamsPanel";
import { SplitsPanel } from "../components/SplitsPanel";
import { arcTestnet } from "viem/chains";

const ZERO = "0x0000000000000000000000000000000000000000";

export default function Home() {
  const [tab, setTab] = useState<"streams" | "splits">("streams");
  const { address, chainId, connecting, connect, disconnect, switchTo } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<bigint | undefined>();

  const contractsReady = FLOW_ADDRESS !== ZERO;
  const onSupported = !!chainId && SUPPORTED.some((c) => c.id === chainId);

  useEffect(() => {
    if (!address || !chainId || !onSupported) return;
    let alive = true;
    const load = () =>
      readContract<bigint>(chainId, USDC_ADDRESS, ERC20_ABI, "balanceOf", [address])
        .then((b) => alive && setUsdcBalance(b))
        .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address, chainId, onSupported]);

  return (
    <main className="container">
      <header className="header">
        <div className="brand">
          <LogoMark />
          <div>
            <h1>Tributary</h1>
            <p className="tagline">Gas is dollars. So let the dollars flow.</p>
          </div>
        </div>
        <div className="wallet-zone">
          {address ? (
            <>
              <span className="chip you">{short(address)}</span>
              <span className="chip live">${fmtUsdc(usdcBalance)}</span>
              <button className="btn ghost small" onClick={disconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn" onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {!contractsReady && (
        <div className="banner warn">
          Contracts not configured yet — run <code>npm run deploy:testnet</code>, then set{" "}
          <code>NEXT_PUBLIC_FLOW_ADDRESS</code> and <code>NEXT_PUBLIC_SPLIT_ADDRESS</code> in{" "}
          <code>frontend/.env.local</code>.
        </div>
      )}

      {address && chainId && !onSupported && (
        <div className="banner warn">
          Wrong network.{" "}
          <button className="btn small" onClick={() => switchTo(arcTestnet.id)}>
            Switch to Arc Testnet
          </button>
        </div>
      )}

      {address && chainId === arcTestnet.id && (
        <div className="banner info">
          Testnet mode — get free testnet USDC at{" "}
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">
            faucet.circle.com
          </a>
        </div>
      )}

      <section className="stats">
        <div className="stat">
          <span className="stat-label">Your USDC</span>
          <span className="stat-value">${fmtUsdc(usdcBalance)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Network</span>
          <span className="stat-value">{(chainId && CHAINS[chainId]?.name) || "—"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Gas token</span>
          <span className="stat-value">USDC 💧</span>
        </div>
      </section>

      <nav className="tabs">
        <button className={tab === "streams" ? "tab active" : "tab"} onClick={() => setTab("streams")}>
          ⏱ Streams
        </button>
        <button className={tab === "splits" ? "tab active" : "tab"} onClick={() => setTab("splits")}>
          ✂️ Splits
        </button>
      </nav>

      {tab === "streams" ? <StreamsPanel /> : <SplitsPanel />}

      <footer className="footer">
        Built on{" "}
        <a href="https://docs.arc.io" target="_blank" rel="noreferrer">
          Arc
        </a>{" "}
        — the L1 where USDC is the native gas token
      </footer>
    </main>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function LogoMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-label="Tributary logo">
      <circle cx="22" cy="22" r="20" fill="#0A1428" stroke="#2775CA" strokeWidth="2" />
      <circle cx="22" cy="22" r="14" fill="none" stroke="#2775CA" strokeWidth="1" opacity="0.35" />
      <circle cx="22" cy="22" r="17" fill="none" stroke="#2775CA" strokeWidth="0.75" opacity="0.2" />
      <path d="M22 9 C27 16, 31 19.5, 31 25 A9 9 0 1 1 13 25 C13 19.5, 17 16, 22 9 Z" fill="#2775CA" />
      <text x="22" y="29.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">
        $
      </text>
    </svg>
  );
}
