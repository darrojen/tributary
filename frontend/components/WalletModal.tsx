"use client";

import { useEffect, useState } from "react";
import { useWallet, type WalletInfo } from "../lib/wallet";

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, connectWith, connecting, connectTarget, refreshWallets, error, clearError } = useWallet();
  const [confirming, setConfirming] = useState<WalletInfo | undefined>();

  useEffect(() => {
    if (open) {
      refreshWallets();
      clearError();
    }
  }, [open, refreshWallets, clearError]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showRequesting = connecting && connectTarget;
  const target = connectTarget ?? confirming;

  async function pick(w: WalletInfo) {
    setConfirming(w);
    try {
      await connectWith(w.rdns);
      onClose();
    } catch (e: any) {
      if (e?.code !== 4001) console.error(e); // 4001 = user rejected
    } finally {
      setConfirming(undefined);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {showRequesting || confirming ? (
          <>
            <div className="modal-head">
              <button className="icon-btn" onClick={onClose} aria-label="Back">
                ‹
              </button>
              <span className="modal-title">{target?.name}</span>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="requesting">
              <div className="requesting-icon">
                <img src={target?.icon} alt="" width={44} height={44} />
              </div>
              <h3>Requesting Connection</h3>
              <p>Open the {target?.name} browser extension to connect your wallet</p>
              <div className="spinner" />
            </div>
          </>
        ) : (
          <>
            <div className="modal-head">
              <span />
              <span className="modal-title">Connect wallet</span>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="modal-sub">Get started by connecting your preferred wallet below.</p>
            {error && (
              <div className="modal-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}
            {wallets.length > 0 ? (
              <div className="wallet-list">
                {wallets.map((w) => (
                  <button key={w.rdns} className="wallet-row" onClick={() => pick(w)}>
                    <img src={w.icon} alt="" width={28} height={28} />
                    <span>{w.name}</span>
                    <span className="wallet-arrow">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-wallets">
                <p>No wallet detected in this browser.</p>
                <p className="dim">
                  Install <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a> or{" "}
                  <a href="https://rabby.io" target="_blank" rel="noreferrer">Rabby</a>, then reopen this
                  dialog.
                </p>
              </div>
            )}
            <div className="modal-foot">
              By connecting your wallet, you agree to our{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>{" "}
              and our{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </div>
          </>
        )}
      </div>
    </div>
  );
}
