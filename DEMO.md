# Tributary — demo script & submission copy

## 90-second demo video script

1. **Hook (0:00–0:10)** — "Arc's gas token *is* USDC. Tributary asks: if money is the fuel, why isn't it flowing? This is programmable USDC flow — live on Arc."
2. **Stream creation (0:10–0:35)** — connect wallet, create a stream: recipient, $1/hr, 5 USDC funded. Point at the LIVE card: accrued counter ticking up **in real dollars, every 100ms**. "Per-second payroll, subscriptions, vesting — no lockups, no middleman."
3. **Control (0:35–0:55)** — hit **Settle now** (USDC lands, explorer link), then **Pause** (counter freezes), **Close** (refund returns to payer). "Either party can stop anytime; accounting settles to the second."
4. **Splits (0:55–1:15)** — create a 60/40 split, deposit 5 USDC, both legs pay atomically. "One deposit fans out to ten payees — creator revenue, team payouts."
5. **Why Arc (1:15–1:30)** — "Every one of those transactions cost a fraction of a cent, paid **in USDC itself**. Streams like this are only economical because Arc made gas a stablecoin." End card: repo + explorer links.

Record with OBS (free) or Loom. Show the explorer at least once — verification signals credibility.

## Submission form copy (paste-ready)

**Short description:**
> Tributary turns USDC into programmable flow on Arc: per-second payment streams and instant percentage splits, in one tiny contracts + app package. Because Arc's native gas token *is* USDC (~$0.001/tx, sub-second finality), continuous money becomes practical — payroll that drips by the second, splits that pay out atomically, all self-custodial with no admin key. Deployed live on Arc; 11 Foundry tests; verified contracts.

**What it uses Arc for:**
- USDC as native gas — the entire app runs on a single dollar-denominated asset, fees included; no ETH anywhere
- ~$0.001 transactions + sub-second finality — what makes per-second accrual and frequent settlement economically viable
- Native USDC ERC-20 interface (`0x3600…0000`) — approve/transferFrom directly against the gas token, no wrapper
- EWMA-stabilized EIP-1559 fee market — predictable settlement costs for scheduled top-ups

## Pre-submission checklist
- [ ] Deployed on **testnet** for the demo; redeploy on **mainnet** before submitting (grants require mainnet)
- [ ] Contracts verified on the explorer
- [ ] Frontend on Vercel with mainnet addresses in env vars
- [ ] README: replace the three `_add after deploy_` placeholders (live app, explorer, video)
- [ ] GitHub repo public, includes this README + DEPLOY.md
- [ ] Demo video linked (90s is plenty)
- [ ] Builder profile: GitHub / X / Farcaster handle ready
- [ ] Payout wallet ready to receive USDC on Arc
- [ ] Submit at the DoraHacks page (rolling review — earlier is better; deadline Oct 14, 2026 23:59 ET)
