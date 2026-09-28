"use client";

import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { arcTestnet } from "viem/chains";
import { useWallet } from "../lib/wallet";
import { writeAndWait } from "../lib/tx";
import { USDC_ADDRESS, SPLIT_ADDRESS } from "../lib/addresses";
import { SPLIT_ABI, ERC20_ABI } from "../lib/abis";

type SplitRow = { id: bigint; payees: string[]; sharesBps: number[] };

const SPLIT_CREATED = parseAbiItem(
  "event SplitCreated(uint256 indexed id, address indexed owner, address[] payees, uint16[] sharesBps)"
);
/** Deploy block of TributarySplit on Arc testnet. */
const FROM_BLOCK = 64_323_000n;
const CHUNK = 10_000n;
let scannedThrough: bigint = FROM_BLOCK - 1n;
const maxUint = 2n ** 256n - 1n;

async function fetchSplitRows(client: ReturnType<typeof createPublicClient>): Promise<SplitRow[]> {
  const latest = await client.getBlockNumber();
  const rows: SplitRow[] = [];
  let from = scannedThrough + 1n;
  while (from <= latest) {
    const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n;
    try {
      const logs = await client.getLogs({ address: SPLIT_ADDRESS, event: SPLIT_CREATED, fromBlock: from, toBlock: to });
      for (const l of logs) {
        const a = l.args as { id: bigint; payees: string[]; sharesBps: number[] };
        rows.push({ id: a.id, payees: a.payees ?? [], sharesBps: a.sharesBps ?? [] });
      }
    } catch {
      /* skip failed slice */
    }
    scannedThrough = to;
    from = to + 1n;
  }
  return rows;
}

export function SplitsPanel() {
  const { address, chainId, walletClient } = useWallet();
  const [rows, setRows] = useState<SplitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const client = createPublicClient({ chain: arcTestnet, transport: http("https://rpc.testnet.arc.io") });

    const load = async () => {
      try {
        const fresh = await fetchSplitRows(client);
        if (fresh.length === 0) return;
        setRows((prev) => {
          const merged = new Map(prev.map((r) => [r.id.toString(), r]));
          for (const r of fresh) merged.set(r.id.toString(), r);
          return [...merged.values()].sort((a, b) => (a.id > b.id ? -1 : 1));
        });
      } catch {
        /* keep previous */
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refresh]);

  const onCreate = useCallback(() => setRefresh((r) => r + 1), []);

  return (
    <div>
      <CreateSplitForm onDone={onCreate} />
      <h2 className="section-title">
        Live splits <span className="count-badge">{rows.length}</span>
      </h2>
      {loading && rows.length === 0 && <div className="empty">Loading splits from Arc…</div>}
      {!loading && rows.length === 0 && (
        <div className="empty">
          No splits yet. A split fans one deposit out to many payees, instantly — tip jars,
          subscriptions, team payouts.
        </div>
      )}
      <div className="grid">
        {rows.map((s) => (
          <SplitCard key={s.id.toString()} s={s} myAddress={address} chainId={chainId} walletClient={walletClient} onChanged={onCreate} />
        ))}
      </div>
    </div>
  );
}

function CreateSplitForm({ onDone }: { onDone: () => void }) {
  const { address, chainId, walletClient } = useWallet();
  const [rows, setRows] = useState([
    { payee: "", pct: 50 },
    { payee: "", pct: 50 },
  ]);
  const [busy, setBusy] = useState(false);

  const total = rows.reduce((s, r) => s + (Number(r.pct) || 0), 0);

  async function create() {
    if (!walletClient || !chainId || !address || total !== 100) return;
    setBusy(true);
    try {
      await writeAndWait(walletClient, address, chainId, SPLIT_ADDRESS, SPLIT_ABI, "createSplit", [
        rows.map((r) => r.payee),
        rows.map((r) => Math.round(Number(r.pct) * 100)),
      ]);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  function updateRow(i: number, field: "payee" | "pct", value: string) {
    const next = [...rows];
    if (field === "payee") next[i].payee = value;
    else next[i].pct = Number(value);
    setRows(next);
  }

  return (
    <div className="card form-card">
      <h3>Create a split</h3>
      {rows.map((row, i) => (
        <div className="row split-row" key={i}>
          <label>
            Payee {i + 1}
            <input value={row.payee} onChange={(e) => updateRow(i, "payee", e.target.value)} placeholder="0x…" />
          </label>
          <label className="pct">
            %
            <input type="number" min={0} max={100} value={row.pct} onChange={(e) => updateRow(i, "pct", e.target.value)} />
          </label>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="row">
        <button className="btn btn-ghost" onClick={() => setRows([...rows, { payee: "", pct: 0 }])} disabled={rows.length >= 10}>
          + Add payee
        </button>
        <span className={total === 100 ? "ok" : "warn"}>{total}% allocated</span>
        <button
          className="btn btn-primary"
          onClick={create}
          disabled={busy || !address || total !== 100 || rows.some((r) => r.payee.length < 42)}
        >
          {busy ? "Creating…" : "Create split"}
        </button>
      </div>
      {!address && <p className="hint">Connect a wallet to create a split. Anyone can watch them below.</p>}
    </div>
  );
}

function SplitCard({
  s,
  myAddress,
  chainId,
  walletClient,
  onChanged,
}: {
  s: SplitRow;
  myAddress?: string;
  chainId?: number;
  walletClient?: any;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState("");

  const isParty =
    !!myAddress && s.payees.some((p) => p && myAddress.toLowerCase() === p.toLowerCase());

  async function run(step: "approve" | "deposit") {
    if (!walletClient || !chainId || !myAddress) return;
    setBusy(step);
    try {
      if (step === "approve") {
        await writeAndWait(walletClient, myAddress as `0x${string}`, chainId, USDC_ADDRESS, ERC20_ABI, "approve", [SPLIT_ADDRESS, maxUint]);
      } else {
        await writeAndWait(walletClient, myAddress as `0x${string}`, chainId, SPLIT_ADDRESS, SPLIT_ABI, "depositAndSplit", [
          s.id,
          BigInt(Math.floor(Number(amount) * 1e6)),
        ]);
        onChanged();
      }
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="card stream">
      <div className="stream-head">
        <span className="stream-id">#{s.id.toString()}</span>
        <span className="chip live">SPLIT</span>
      </div>
      <div className="meta">
        {s.payees.map((p, i) => (
          <div key={p ?? i}>
            <b>{(s.sharesBps?.[i] ?? 0) / 100}%</b> → {short(p)}
          </div>
        ))}
      </div>
      {myAddress && (
        <div className="row">
          <input className="inline-input" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Deposit amount" />
          <button className="btn btn-ghost btn-sm" onClick={() => run("approve")} disabled={!!busy}>
            Approve
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => run("deposit")} disabled={!!busy || Number(amount) <= 0}>
            Deposit &amp; split
          </button>
        </div>
      )}
      {isParty && <div className="hint">You're a payee on this split.</div>}
    </div>
  );
}

function short(a?: string) {
  if (!a || a.length < 10) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
