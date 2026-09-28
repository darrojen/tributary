"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="crash">
      <div className="crash-card">
        <div className="crash-mark">!</div>
        <h2>Something glitched</h2>
        <p>
          A client-side error occurred — usually a stale page from a server restart or a wallet
          mid-switch. Reload first; if it persists, switch your wallet network back to Arc and retry.
        </p>
        <code>{error.message?.slice(0, 200) || "Unknown error"}</code>
        <div className="crash-actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload app
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
