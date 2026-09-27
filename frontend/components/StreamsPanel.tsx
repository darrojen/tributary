"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "../lib/wallet";
import { readContract, writeAndWait } from "../lib/tx";
import { USDC_ADDRESS, FLOW_ADDRESS, EXPLORER, fmtUsdc } from "../lib/addresses";
import { FLOW_ABI, ERC20_ABI } from "../lib/abis";

type StreamData = {
  payer: string;
  recipient: string;
  ratePerSecond: bigint;
  balance: bigint;
  start: bigint;
  paused: boolean;
  accrued: bigint;
};

const maxUint = 2n ** 256n - 1n;

export function StreamsPanel() {
  const { address, chainId } = useWallet();
  const [ids, setIds] = useState<bigint[]>([]);
  const [streams, setStreams] = useState<Map<string, StreamData>>(new Map());
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!address || !chainId) return;
    let alive = true;
    const load = async () => {
      try {
        const myIds = await readContract<bigint[]>(chainId, FLOW_ADDRESS, FLOW_ABI, "streamIdsFor", [address]);
        if (!alive) return;
        setIds(myIds);
        const entries = await Promise.all(
          myIds.map(async (id) => {
            const s = await readContract<StreamData>(chainId, FLOW_ADDRESS, FLOW_ABI, "streamOf", [id]);
            return [id.toString(), s] as const;
          })
        );
        if (alive) setStreams(new Map(entries));
      } catch {
        /* contract not deployed yet */
      }
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address, chainId, refresh]);

  if (!address) return <div className="empty">Connect a wallet to see your streams.</div>;

  return (
    <div>
      <CreateStreamForm onDone={() => setRefresh((r) => r + 1)} />
      <h2 className="section-title">Your streams</h2>
      {ids.length === 0 && (
        <div className="empty">No streams yet. Create one above — it drips USDC every second.</div>
      )}
      <div className="grid">
        {ids.map((id) => {
          const s = streams.get(id.toString());
          if (!s) return null;
          return <StreamCard key={id.toString()} id={id} s={s} myAddress={address} onChanged={() => setRefresh((r) => r + 1)} />;
        })}
      </div>
    </div>
  );
}

function CreateStreamForm({ onDone }: { onDone: () => void }) {
  const { address, chainId, walletClient } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [ratePerHour, setRatePerHour] = useState("1");
  const [funding, setFunding] = useState("10");
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(false);

  const ratePerSecond = useMemo(() => {
    const micro = BigInt(Math.floor(Number(ratePerHour) * 1e6) || 0);
    return micro / 3600n;
  }, [ratePerHour]);

  const fundingRaw = BigInt(Math.floor(Number(funding) * 1e6) || 0);

  async function approve() {
    if (!walletClient || !chainId) return;
    setBusy("approve");
    try {
      await writeAndWait(walletClient, address!, chainId, USDC_ADDRESS, ERC20_ABI, "approve", [
        FLOW_ADDRESS,
        maxUint,
      ]);
    } finally {
      setBusy("");
    }
  }

  async function create() {
    if (!walletClient || !chainId) return;
    setBusy("create");
    try {
      await writeAndWait(walletClient, address!, chainId, FLOW_ADDRESS, FLOW_ABI, "createStream", [
        recipient,
        ratePerSecond,
        fundingRaw,
      ]);
      setDone(true);
      setRecipient("");
      onDone();
      setTimeout(() => setDone(false), 4000);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="card form-card">
      <h3>Create a stream</h3>
      <label>
        Recipient address
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
      </label>
      <div className="row">
        <label>
          Rate (USDC/hour)
          <input value={ratePerHour} onChange={(e) => setRatePerHour(e.target.value)} />
        </label>
        <label>
          Funding (USDC)
          <input value={funding} onChange={(e) => setFunding(e.target.value)} />
        </label>
      </div>
      <div className="row">
        <button className="btn ghost" onClick={approve} disabled={!!busy}>
          1. Approve USDC
        </button>
        <button className="btn" onClick={create} disabled={!!busy || recipient.length < 42 || fundingRaw <= 0n || ratePerSecond <= 0n}>
          {busy === "create" ? "Creating…" : "2. Create stream"}
        </button>
        {done && <span className="ok">✅ Stream created!</span>}
      </div>
      <p className="hint">
        {ratePerHour} USDC/hr = {ratePerSecond.toString()} micro-USDC per second. One-time unlimited
        approval, then every stream reuses it.
      </p>
    </div>
  );
}

function StreamCard({
  id,
  s,
  myAddress,
  onChanged,
}: {
  id: bigint;
  s: StreamData;
  myAddress: string;
  onChanged: () => void;
}) {
  const { chainId, walletClient, address } = useWallet();
  const [liveAccrued, setLiveAccrued] = useState(s.accrued);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLiveAccrued(s.accrued), [s.accrued]);
  useEffect(() => {
    if (s.paused) return;
    const t = setInterval(() => setLiveAccrued((a) => a + s.ratePerSecond / 10n), 100);
    return () => clearInterval(t);
  }, [s.paused, s.ratePerSecond]);

  const act = useCallback(
    async (fn: string, args: readonly unknown[]) => {
      if (!walletClient || !chainId) return;
      setBusy(true);
      try {
        await writeAndWait(walletClient, address!, chainId, FLOW_ADDRESS, FLOW_ABI, fn, args);
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [walletClient, chainId, address, onChanged]
  );

  const isPayer = myAddress.toLowerCase() === s.payer.toLowerCase();
  const explorer = EXPLORER[chainId ?? 0] ?? "";
  const perSec = Number(s.ratePerSecond) / 1e6;

  return (
    <div className="card stream">
      <div className="stream-head">
        <span className="stream-id">#{id.toString()}</span>
        <span className={s.paused ? "chip paused" : "chip live"}>{s.paused ? "PAUSED" : "LIVE"}</span>
        <a
          className="explorer"
          href={`${explorer}/address/${s.recipient}`}
          target="_blank"
          rel="noreferrer"
          title="View recipient on explorer"
        >
          ↗
        </a>
      </div>
      <div className="accrual">
        <span className="accrued-amount">${fmtUsdc(liveAccrued)}</span>
        <span className="accrued-label">accrued &amp; unpaid</span>
      </div>
      <div className="meta">
        <div>
          <b>From</b> {short(s.payer)} {isPayer && <span className="chip you">YOU PAY</span>}
        </div>
        <div>
          <b>To</b> {short(s.recipient)} {!isPayer && <span className="chip you">YOU RECEIVE</span>}
        </div>
        <div>
          <b>Rate</b> ${perSec.toFixed(6)}/sec · ${(perSec * 3600).toFixed(2)}/hr
        </div>
        <div>
          <b>Stream balance</b> ${fmtUsdc(s.balance)}
        </div>
        <div>
          <b>Started</b> {new Date(Number(s.start) * 1000).toLocaleString()}
        </div>
      </div>
      <div className="actions">
        <button className="btn" disabled={busy} onClick={() => act("settle", [id])}>
          Settle now
        </button>
        <button className="btn ghost" disabled={busy} onClick={() => act("setPaused", [id, !s.paused])}>
          {s.paused ? "Resume" : "Pause"}
        </button>
        <button className="btn danger" disabled={busy} onClick={() => act("closeStream", [id])}>
          Close
        </button>
      </div>
    </div>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
