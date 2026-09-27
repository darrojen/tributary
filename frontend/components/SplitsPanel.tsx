"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../lib/wallet";
import { readContract, writeAndWait } from "../lib/tx";
import { SPLIT_ADDRESS, USDC_ADDRESS } from "../lib/addresses";
import { SPLIT_ABI, ERC20_ABI } from "../lib/abis";

type SplitData = { payees: string[]; sharesBps: number[] };
const maxUint = 2n ** 256n - 1n;

export function SplitsPanel() {
  const { address, chainId } = useWallet();
  const [ids, setIds] = useState<bigint[]>([]);
  const [splits, setSplits] = useState<Map<string, SplitData>>(new Map());
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!address || !chainId) return;
    let alive = true;
    const load = async () => {
      try {
        const myIds = await readContract<bigint[]>(chainId, SPLIT_ADDRESS, SPLIT_ABI, "splitIdsFor", [address]);
        if (!alive) return;
        setIds(myIds);
        const entries = await Promise.all(
          myIds.map(async (id) => {
            const s = await readContract<SplitData>(chainId, SPLIT_ADDRESS, SPLIT_ABI, "splitOf", [id]);
            return [id.toString(), s] as const;
          })
        );
        if (alive) setSplits(new Map(entries));
      } catch {
        /* not deployed yet */
      }
    };
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address, chainId, refresh]);

  if (!address) return <div className="empty">Connect a wallet to see your splits.</div>;

  return (
    <div>
      <CreateSplitForm onDone={() => setRefresh((r) => r + 1)} />
      <h2 className="section-title">Your splits</h2>
      {ids.length === 0 && (
        <div className="empty">
          No splits yet. A split fans one deposit out to many payees, instantly — tip jars,
          subscriptions, team payouts.
        </div>
      )}
      <div className="grid">
        {ids.map((id) => {
          const s = splits.get(id.toString());
          if (!s) return null;
          return <SplitCard key={id.toString()} id={id} data={s} onChanged={() => setRefresh((r) => r + 1)} />;
        })}
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
    if (!walletClient || !chainId || total !== 100) return;
    setBusy(true);
    try {
      await writeAndWait(walletClient, address!, chainId, SPLIT_ADDRESS, SPLIT_ABI, "createSplit", [
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
            className="btn ghost small"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
            disabled={rows.length <= 1}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="row">
        <button className="btn ghost" onClick={() => setRows([...rows, { payee: "", pct: 0 }])} disabled={rows.length >= 10}>
          + Add payee
        </button>
        <span className={total === 100 ? "ok" : "warn"}>{total}% allocated</span>
        <button
          className="btn"
          onClick={create}
          disabled={busy || total !== 100 || rows.some((r) => r.payee.length < 42)}
        >
          {busy ? "Creating…" : "Create split"}
        </button>
      </div>
    </div>
  );
}

function SplitCard({ id, data, onChanged }: { id: bigint; data: SplitData; onChanged: () => void }) {
  const { chainId, walletClient, address } = useWallet();
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState("");

  async function run(step: "approve" | "deposit") {
    if (!walletClient || !chainId) return;
    setBusy(step);
    try {
      if (step === "approve") {
        await writeAndWait(walletClient, address!, chainId, USDC_ADDRESS, ERC20_ABI, "approve", [SPLIT_ADDRESS, maxUint]);
      } else {
        await writeAndWait(walletClient, address!, chainId, SPLIT_ADDRESS, SPLIT_ABI, "depositAndSplit", [
          id,
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
        <span className="stream-id">#{id.toString()}</span>
        <span className="chip live">SPLIT</span>
      </div>
      <div className="meta">
        {data.payees.map((p, i) => (
          <div key={p}>
            <b>{data.sharesBps[i] / 100}%</b> → {short(p)}
          </div>
        ))}
      </div>
      <div className="row">
        <input className="inline-input" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Deposit amount" />
        <button className="btn ghost" onClick={() => run("approve")} disabled={!!busy}>
          Approve
        </button>
        <button className="btn" onClick={() => run("deposit")} disabled={!!busy || Number(amount) <= 0}>
          Deposit &amp; split
        </button>
      </div>
    </div>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
