# Submit today — everything is paste-ready

You can submit the DoraHacks form **right now**. Fill the two mainnet fields with the
testnet deployment (clearly labeled), then upgrade them in the "update BUIDL" edit after
mainnet goes live. DoraHacks lets you edit until the deadline (Oct 14, 23:59 ET).

---

## The form, field by field (copy/paste)

**Project name:** `Tributary`

**BUIDL logo:** repo `/frontend/app/icon.svg` (the Tributary branching-flow mark)

**Vision** *(from SUBMISSION.md)*:

> Money that moves on schedules still moves like it's 1955: payroll runs on Fridays,
> subscriptions bill monthly, revenue splits settle whenever someone remembers to run the
> spreadsheet. Blockchains fixed settlement but made continuous payment economically absurd —
> gas costs more than the drip. Arc changes the economics: gas IS USDC, ~$0.001 per
> transaction, sub-second finality. Tributary builds on that foundation — per-second payment
> streams and instant percentage splits, self-custodial, no middleman, no admin key. Payroll
> that drips. Splits that pay atomically. Money that moves like data.

**In two sentences, what does your project do?**

> Tributary turns USDC into a programmable rail: per-second streams and instant percentage
> splits — payroll, subscriptions, and revenue sharing that settle continuously and
> self-custodially, at roughly a tenth of a cent per transaction.

**What does it use Arc for?**

> 1. **USDC as native gas** — value and fees are one asset; no ETH anywhere in the stack; every fee displays in dollars.
> 2. **~$0.001 transactions + sub-second finality** — what makes per-second accrual and frequent settlement economically viable.
> 3. **Native USDC ERC-20 interface (0x3600…0000)** — approve/transferFrom directly on the gas token, no wrapped USDC; plus Arc's EWMA-stabilized EIP-1559 fee market for predictable costs.

**Anything else we should see?**

> Three things: (1) 11/11 Foundry tests cover the accounting edge cases that matter for
> money — accrual capped at stream balance, pause/resume clock resets, refund-on-close,
> split dust absorption. (2) The protocol has no admin key and no upgradeability — funds
> only ever move per stream/split logic. (3) A design proof: our test suite caught that
> unpausing would have billed paused time; we fixed the contract, not the test. Contracts
> are ~200 lines each and auditably small.

**GitHub:** `https://github.com/darrojen/tributary`

**Live URL (before Vercel):** your tunnel from *Step 1* below — e.g.
`https://<random>.trycloudflare.com` or `https://<hash>.loca.lt`

**Contract address / tx hash (Arc):** paste both testnet addresses **labeled as testnet**:

> Testnet deployment (mainnet deploy in progress, will update):
> • TributaryFlow `0x7f4380541d577f48dff6cdf5b49884c9cf611a05`
>   https://testnet.arcscan.app/address/0x7f4380541d577f48dff6cdf5b49884c9cf611a05
> • TributarySplit `0x99f01f48799c0c210085dbba21adc1a5a3fb9f3c`
>   https://testnet.arcscan.app/address/0x99f01f48799c0c210085dbba21adc1a5a3fb9f3c
> • First stream funding tx: https://testnet.arcscan.app/tx/0xe5f4…

**Demo video:** `Demo video recording this week — link will be added.` *(replace later)*

**Category:** Payments (primary) · DeFi · Stablecoins
**Infrastructure deployed on:** L1s: Arc
**First time deploying to Arc:** Yes
**Contact:** darlington.ajaezo@gmail.com · https://github.com/darrojen · https://x.com/AjaezoDarl6031

---

## Step 1 — a public URL in 10 minutes (no mainnet needed)

The app runs locally on :3000 and shows a live on-chain stream to anyone who opens it.
Expose it:

```bash
# Option A — Cloudflare (fastest, no account): keep the window open while judges look
cloudflared tunnel --url http://localhost:3000

# Option B — localtunnel (no install, has an interstitial password page)
npx localtunnel --port 3000
```

Either printed URL is a legitimate "live URL" for the form. For a URL that never dies,
do Step 2.

## Step 2 — Vercel (10 minutes, do it once)

1. Repo is already pushed: `github.com/darrojen/tributary`.
2. **vercel.com → Add New → Project → Import** `darrojen/tributary`.
3. **Root Directory:** `frontend`
4. Framework preset: **Next.js** (detected). Keep default build settings.
5. **Environment Variables** (Production):
   ```
   NEXT_PUBLIC_NETWORK=testnet
   NEXT_PUBLIC_FLOW_ADDRESS=0x7f4380541d577f48dff6cdf5b49884c9cf611a05
   NEXT_PUBLIC_SPLIT_ADDRESS=0x99f01f48799c0c210085dbba21adc1a5a3fb9f3c
   NEXT_PUBLIC_FROM_BLOCK=64323000
   ```
6. Deploy → `https://tributary-xxxx.vercel.app` is your live URL.
7. When mainnet lands, change the four values (MAINNET.md §5), redeploy, update the two
   form fields. That's the whole upgrade path.

## Step 3 — submit on DoraHacks

dorahacks.io → Arc Microgrants → Submit BUIDL. Paste the fields above, attach the logo,
submit. Then take your time on mainnet + video and edit the BUIDL as each lands.

---

## After submitting — the three upgrades, by leverage

| When | What | Effect on the form |
|------|------|--------------------|
| Today | Vercel testnet URL (Step 2) | "Live URL" field becomes permanent & stable |
| This week | Demo video (script: DEMO.md) | "Demo video" field gets a real link |
| Before Oct 14 | Mainnet deploy (MAINNET.md) | Contract field → mainnet address; eligibility locked |
