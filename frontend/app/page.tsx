"use client";

import { useEffect, useState } from "react";
import { useWallet, SUPPORTED, CHAINS } from "../lib/wallet";
import { useWalletModal } from "../components/ModalHost";
import { readContract } from "../lib/tx";
import { USDC_ADDRESS, FLOW_ADDRESS, SPLIT_ADDRESS, EXPLORER, fmtUsdc } from "../lib/addresses";
import { ERC20_ABI } from "../lib/abis";
import { StreamsPanel } from "../components/StreamsPanel";
import { SplitsPanel } from "../components/SplitsPanel";
import { TributaryLockup, TributaryMark } from "../components/Logo";
import { arcTestnet } from "viem/chains";

const ZERO = "0x0000000000000000000000000000000000000000";

export default function Home() {
  const [tab, setTab] = useState<"streams" | "splits">("streams");
  const { address, chainId, connecting, disconnect, switchTo, wallets } = useWallet();
  const { openWalletModal } = useWalletModal();
  const [usdcBalance, setUsdcBalance] = useState<bigint | undefined>();

  const contractsReady = FLOW_ADDRESS !== ZERO && SPLIT_ADDRESS !== ZERO;
  const onSupported = !!chainId && SUPPORTED.some((c) => c.id === chainId);
  const isTestnet = chainId === arcTestnet.id;
  const explorer = EXPLORER[chainId ?? 0];

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
    <div className="shell">
      <div className="bg-grid" aria-hidden />
      <div className="bg-glow" aria-hidden />

      <header className="nav">
        <TributaryLockup />
        <nav className="nav-links">
          <a href="#streams" onClick={() => setTab("streams")}>Streams</a>
          <a href="#splits" onClick={() => setTab("splits")}>Splits</a>
          <a href="https://docs.arc.io" target="_blank" rel="noreferrer">Arc Docs</a>
        </nav>
        <div className="nav-right">
          {address ? (
            <>
              <span className="pill pill-green">
                <span className="dot" /> {fmtUsdc(usdcBalance)} USDC
              </span>
              <span className="pill pill-dark">{short(address)}</span>
              <button className="btn btn-ghost btn-sm" onClick={disconnect}>Exit</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={openWalletModal} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {!contractsReady && (
          <div className="notice notice-amber">
            <span className="notice-icon">◇</span>
            <div>
              <b>Contracts not configured.</b> Run <code>npm run deploy:testnet</code>, then set{" "}
              <code>NEXT_PUBLIC_FLOW_ADDRESS</code> and <code>NEXT_PUBLIC_SPLIT_ADDRESS</code> in{" "}
              <code>frontend/.env.local</code> and restart.
            </div>
          </div>
        )}

        {address && chainId && !onSupported && (
          <div className="notice notice-amber">
            <span className="notice-icon">◇</span>
            <div>
              <b>Unsupported network.</b> Tributary runs on Arc.
              <button className="btn btn-primary btn-sm inline-cta" onClick={() => switchTo(arcTestnet.id)}>
                Switch to Arc Testnet
              </button>
            </div>
          </div>
        )}

        <section className="hero">
          <div className="hero-badge">
            <span className="dot" /> Live on Arc · {isTestnet ? "Testnet" : "Mainnet"}
          </div>
          <h1>
            Money that moves
            <br />
            <em>like data.</em>
          </h1>
          <p className="hero-sub">
            Programmable USDC flows on Arc — payment streams that drip by the second, splits that
            fan out atomically. Self-custodial. No admin key. Gas paid in dollars, because on Arc,
            gas <b>is</b> USDC.
          </p>
          <div className="hero-meta">
            <span className="meta-item">
              <b>$0.001</b> avg tx cost
            </span>
            <span className="meta-sep" />
            <span className="meta-item">
              <b>&lt;1s</b> finality
            </span>
            <span className="meta-sep" />
            <span className="meta-item">
              <b>0</b> admin keys
            </span>
            <span className="meta-sep" />
            <span className="meta-item">
              <b>11/11</b> tests passing
            </span>
          </div>
        </section>

        <section className="console" id={tab}>
          <div className="console-head">
            <div className="console-tabs">
              <button className={tab === "streams" ? "ctab active" : "ctab"} onClick={() => setTab("streams")}>
                <TributaryMark size={13} color="currentColor" /> Streams
              </button>
              <button className={tab === "splits" ? "ctab active" : "ctab"} onClick={() => setTab("splits")}>
                <span className="ctab-glyph">✂</span> Splits
              </button>
            </div>
            <div className="console-net">
              <span className="dot dot-green" />
              {(chainId && CHAINS[chainId]?.name) || "Arc"}
              {explorer && (
                <a className="net-link" href={explorer} target="_blank" rel="noreferrer">
                  Explorer ↗
                </a>
              )}
            </div>
          </div>
          <div className="console-body">
            {tab === "streams" ? <StreamsPanel /> : <SplitsPanel />}
          </div>
        </section>

        <section className="why">
          <div className="why-card">
            <div className="why-num">01</div>
            <h3>Gas is the payment</h3>
            <p>Arc's native gas token is USDC. One asset for value and fees — nothing extra to bridge, nothing to price in a second currency.</p>
          </div>
          <div className="why-card">
            <div className="why-num">02</div>
            <h3>Continuous by default</h3>
            <p>Accrual is computed from block time, not polled jobs. A stream owes money by the second, exactly, capped at its funded balance.</p>
          </div>
          <div className="why-card">
            <div className="why-num">03</div>
            <h3>No keys, no custodian</h3>
            <p>No admin, no upgradeability, no pauses at protocol level. Funds move only per stream and split logic — auditable in ~400 lines.</p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="foot-left">
          <TributaryMark size={18} color="#9aa7ba" />
          <span>Tributary — built on Arc</span>
        </div>
        <div className="foot-links">
          <a href="https://docs.arc.io" target="_blank" rel="noreferrer">Arc Docs</a>
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">Testnet Faucet</a>
          <a href="https://github.com/darrojen/tributary" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
