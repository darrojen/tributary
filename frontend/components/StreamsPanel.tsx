"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { NETWORK_CHAIN, NETWORK_RPC, NETWORK_EXPLORER, LISTING_FROM_BLOCK } from "../lib/network";
import { useWallet } from "../lib/wallet";
import { writeAndWait } from "../lib/tx";
import { USDC_ADDRESS, FLOW_ADDRESS, EXPLORER, fmtUsdc } from "../lib/addresses";
import { FLOW_ABI, ERC20_ABI } from "../lib/abis";

type StreamRow = {
  id: bigint;
  payer: string;
  recipient: string;
  ratePerSecond: bigint;
  balance: bigint;
  start: bigint;
  paused: boolean;
  accrued: bigint;
};

const STREAM_CREATED = parseAbiItem(
  "event StreamCreated(uint256 indexed id, address indexed payer, address indexed recipient, uint256 ratePerSecond, uint256 funded, uint64 start)"
);
/** Earliest block scanned for StreamCreated events (deploy block, or 0 = whole chain). */
const FROM_BLOCK = LISTING_FROM_BLOCK;
/** Arc public RPC caps getLogs ranges — scan in slices below the cap. */
const CHUNK = 10_000n;
let scannedThrough: bigint = FROM_BLOCK - 1n;

async function fetchCreatedIds(client: ReturnType<typeof createPublicClient>): Promise<bigint[]> {
  const latest = await client.getBlockNumber();
  const ids: bigint[] = [];
  let from = scannedThrough + 1n;
  while (from <= latest) {
    const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n;
    try {
      const logs = await client.getLogs({ address: FLOW_ADDRESS, event: STREAM_CREATED, fromBlock: from, toBlock: to });
      for (const l of logs) ids.push((l.args as { id: bigint }).id);
    } catch {
      /* skip failed slice, retry next cycle */
    }
    scannedThrough = to;
    from = to + 1n;
  }
  return ids;
}

const maxUint = 2n ** 256n - 1n;

export function StreamsPanel() {
  const { address, chainId, walletClient } = useWallet();
  const [rows, setRows] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const client = createPublicClient({ chain: NETWORK_CHAIN, transport: http(NETWORK_RPC) });

    const load = async () => {
      try {
        const newIds = await fetchCreatedIds(client);
        if (newIds.length === 0) return;
        const fetched: StreamRow[] = [];
        for (const id of newIds.sort((a, b) => (a > b ? -1 : 1))) {
          const s = await client.readContract({
            address: FLOW_ADDRESS,
            abi: FLOW_ABI,
            functionName: "streamOf",
            args: [id],
          });
          const [payer, recipient, rate, balance, start, paused, accrued] = s as [string, string, bigint, bigint, bigint, boolean, bigint];
          if (payer === "0x0000000000000000000000000000000000000000") continue; // closed
          fetched.push({ id, payer, recipient, ratePerSecond: rate, balance, start, paused, accrued });
        }
        if (alive && fetched.length > 0) {
          setRows((prev) => {
            const merged = new Map(prev.map((r) => [r.id.toString(), r]));
            for (const r of fetched) merged.set(r.id.toString(), r);
            return [...merged.values()].sort((a, b) => (a.id > b.id ? -1 : 1));
          });
        }
      } catch {
        /* keep previous rows */
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refresh]);

  const onCreate = useCallback(() => setRefresh((r) => r + 1), []);

  return (
    <div>
      <CreateStreamForm onDone={onCreate} />
      <h2 className="section-title">
        Live streams <span className="count-badge">{rows.length}</span>
      </h2>
      {loading && rows.length === 0 && <div className="empty">Loading streams from Arc…</div>}
      {!loading && rows.length === 0 && (
        <div className="empty">No streams yet. Create one above — it drips USDC every second.</div>
      )}
      <div className="grid">
        {rows.map((s) => (
          <StreamCard key={s.id.toString()} s={s} myAddress={address} chainId={chainId} walletClient={walletClient} onChanged={onCreate} />
        ))}
      </div>
    </div>
  );
}

function CreateStreamForm({ onDone }: { onDone: () => void }) {
  const { address, chainId, walletClient } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [ratePerHour, setRatePerHour] = useState("1");
  const [funding, setFunding] = useState("5");
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(false);

  const ratePerSecond = useMemo(() => {
    const micro = BigInt(Math.floor(Number(ratePerHour) * 1e6) || 0);
    return micro / 3600n;
  }, [ratePerHour]);

  const fundingRaw = BigInt(Math.floor(Number(funding) * 1e6) || 0);

  async function approve() {
    if (!walletClient || !chainId || !address) return;
    setBusy("approve");
    try {
      await writeAndWait(walletClient, address, chainId, USDC_ADDRESS, ERC20_ABI, "approve", [FLOW_ADDRESS, maxUint]);
    } finally {
      setBusy("");
    }
  }

  async function create() {
    if (!walletClient || !chainId || !address) return;
    setBusy("create");
    try {
      await writeAndWait(walletClient, address, chainId, FLOW_ADDRESS, FLOW_ABI, "createStream", [
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
        <button className="btn btn-ghost" onClick={approve} disabled={!!busy || !address}>
          1. Approve USDC
        </button>
        <button
          className="btn btn-primary"
          onClick={create}
          disabled={!!busy || !address || recipient.length < 42 || fundingRaw <= 0n || ratePerSecond <= 0n}
        >
          {busy === "create" ? "Creating…" : "2. Create stream"}
        </button>
        {done && <span className="ok">✅ Stream created!</span>}
      </div>
      {!address && <p className="hint">Connect a wallet to create a stream. Anyone can watch them flow below.</p>}
    </div>
  );
}

function StreamCard({
  s,
  myAddress,
  chainId,
  walletClient,
  onChanged,
}: {
  s: StreamRow;
  myAddress?: string;
  chainId?: number;
  walletClient?: any;
  onChanged: () => void;
}) {
  const [liveAccrued, setLiveAccrued] = useState(s.accrued);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLiveAccrued(s.accrued), [s.accrued]);
  useEffect(() => {
    if (s.paused) return;
    const t = setInterval(() => setLiveAccrued((a) => a + s.ratePerSecond / 10n), 100);
    return () => clearInterval(t);
  }, [s.paused, s.ratePerSecond]);

  const isParty =
    !!myAddress &&
    (myAddress.toLowerCase() === s.payer.toLowerCase() || myAddress.toLowerCase() === s.recipient.toLowerCase());
  const isPayer = !!myAddress && myAddress.toLowerCase() === s.payer.toLowerCase();
  const explorer = EXPLORER[chainId ?? NETWORK_CHAIN.id] ?? NETWORK_EXPLORER;
  const perSec = Number(s.ratePerSecond) / 1e6;

  const act = useCallback(
    async (fn: string, args: readonly unknown[]) => {
      if (!walletClient || !chainId || !myAddress) return;
      setBusy(true);
      try {
        await writeAndWait(walletClient, myAddress as `0x${string}`, chainId, FLOW_ADDRESS, FLOW_ABI, fn, args);
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [walletClient, chainId, myAddress, onChanged]
  );

  return (
    <div className="card stream">
      <div className="stream-head">
        <span className="stream-id">#{s.id.toString()}</span>
        <span className={s.paused ? "chip paused" : "chip live"}>{s.paused ? "PAUSED" : "LIVE"}</span>
        {isParty && <span className="chip you">{isPayer ? "YOU PAY" : "YOU RECEIVE"}</span>}
        <a className="explorer" href={`${explorer}/address/${s.recipient}`} target="_blank" rel="noreferrer" title="View recipient on explorer">
          ↗
        </a>
      </div>
      <div className="accrual">
        <span className="accrued-amount">${fmtUsdc(liveAccrued)}</span>
        <span className="accrued-label">accrued &amp; unpaid</span>
      </div>
      <div className="meta">
        <div>
          <b>From</b> {short(s.payer)}
        </div>
        <div>
          <b>To</b> {short(s.recipient)}
        </div>
        <div>
          <b>Rate</b> ${perSec.toFixed(6)}/sec · ${(perSec * 3600).toFixed(2)}/hr
        </div>
        <div>
          <b>Stream balance</b> ${fmtUsdc(s.balance)}
        </div>
      </div>
      {isParty && (
        <div className="actions">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act("settle", [s.id])}>
            Settle now
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act("setPaused", [s.id, !s.paused])}>
            {s.paused ? "Resume" : "Pause"}
          </button>
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => act("closeStream", [s.id])}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function short(a?: string) {
  if (!a || a.length < 10) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
