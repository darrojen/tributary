# 🌊 Tributary

**Programmable USDC flows on Arc — stream money by the second, split payments by percentage.**

> Gas is dollars. So let the dollars flow.

Tributary is a tiny payments protocol built for [Arc](https://docs.arc.io), Circle's L1 where **USDC is the native gas token**. It turns static USDC balances into *flow*: continuous per-second streams (payroll, subscriptions, vesting) and instant percentage splits (teams, creator revenue, tip jars) — all self-custodial, all settling in under a second, all costing ~$0.001 per interaction.

## Why Arc makes this possible

| Arc capability | What Tributary does with it |
|---|---|
| **USDC is native gas** | One currency for value *and* fees — no ETH plumbing anywhere. Users see everything in dollars. |
| **~$0.001 per transaction** | Per-second streams are economically viable; settle as often as you like. |
| **Sub-second finality** | Streams settle and splits pay out instantly — money moves like it should. |
| **Native USDC ERC-20 interface** (`0x3600…0000`) | `approve` / `transferFrom` work directly on the gas token; no wrapped USDC. |

## What it does

**⏱ Streams** — `TributaryFlow.sol`
- Fund a stream with USDC; it drips to the recipient **every second** (`ratePerSecond` in 6-decimal units)
- Accounting is exact: accrual is computed from `block.timestamp` and **capped at the stream balance**
- Either party can **pause/resume** (pending accrual settles first, paused time never counts) or **close** (recipient paid in full, remainder refunded to payer)
- `settle()` is **permissionless** — anyone can trigger payment; the recipient always gets paid
- `fundAndSettle()` for one-tx top-up + payout (cron-friendly)

**✂️ Splits** — `TributarySplit.sol`
- One deposit fans out to up to **10 payees by basis points** in a single transaction
- Shares are updatable; rounding dust is absorbed by the last payee (contract never holds a balance)
- Perfect for team payouts, revenue sharing, subscription bundles

## Architecture

```
contracts/
  src/FlowBase.sol        # shared safe USDC pull/push (low-level calls, no interface dep)
  src/TributaryFlow.sol   # per-second streams: create, fund, settle, pause, close
  src/TributarySplit.sol  # percentage splits: create, setShares, depositAndSplit
  script/Deploy.s.sol     # Foundry deploy (testnet & mainnet)
  test/                   # 11 Foundry tests — all passing ✅
frontend/                 # Next.js 14 + wagmi/viem + RainbowKit (Arc chains built-in)
scripts/                  # deploy-testnet.sh / deploy-mainnet.sh
```

Key design choices:
- **6-decimal USDC everywhere** (Arc's *native* gas accounting is 18 decimals internally; the ERC-20 interface apps use is 6 — Tributary only touches the ERC-20 side, per Arc docs)
- No oracle, no admin key, no upgradeability — funds are only ever moved by stream/split logic
- Streams are pure bookkeeping between two parties; splits are atomic push-payment (zero contract-held funds)

## Run it

### 1. Deploy contracts (testnet)

```bash
cp .env.example .env        # add DEPLOYER_PRIVATE_KEY
# get free testnet USDC: https://faucet.circle.com  (20 USDC / 2h, no account)
npm run deploy:testnet      # Foundry: builds, broadcasts, verifies on explorer.testnet.arc.io
```

Cost on mainnet would be **under $0.10** (two small contracts at ~20 Gwei ≈ $0.00000002/gas-unit).

### 2. Frontend

```bash
cp frontend/.env.local.example frontend/.env.local   # paste deployed addresses
cd frontend && npm install && npm run dev            # http://localhost:3000
```

Add **Arc Testnet** to your wallet: RPC `https://rpc.testnet.arc.io`, chain ID `5042002`, symbol `USDC`.

### 3. Try the demo loop

1. Faucet 20 testnet USDC → your wallet
2. **Streams**: create a stream to a second address at $5/hour funded with 10 USDC → watch it accrue live, settle, pause, close (refund lands back)
3. **Splits**: create a 60/40 split between two addresses → deposit 5 USDC → both pay out atomically

## Status & roadmap

Shipped: streams + splits, tests, deploy pipeline, full UI.
Next: ERC-1620 compatibility layer, stream NFTs (transferable positions), CCTP auto-top-up from other chains, backed by Arc's stable fee market.

## Submission

- **Live app (testnet):** _[add Vercel URL after deploy]_
- **Explorer:** _[add contract links after deploy]_
- **Video demo:** _[add link]_

Built for the [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants) program.
