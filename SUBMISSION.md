# DoraHacks BUIDL form — Arc Microgrants (paste-ready)

## Vision
Money that moves on schedules still moves like it's 1955: payroll runs on Fridays, subscriptions bill monthly, revenue splits settle whenever someone remembers to run the spreadsheet. Blockchains fixed settlement but made continuous payment economically absurd — gas costs more than the drip. Arc changes the economics: gas IS USDC, ~$0.001 per transaction, sub-second finality. Tributary builds on that foundation — per-second payment streams and instant percentage splits, self-custodial, no middleman, no admin key. Payroll that drips. Splits that pay atomically. Money that moves like data.

## Category
- Payments (primary)
- DeFi
- Stablecoins
- Smart contracts / tooling

## Infrastructure where your BUIDL is deployed
- L1s: **Arc**
- L2s: — (leave empty)
- Appchains: — (leave empty)
- Other open source ecosystems (optional): EVM / Solidity

## Links
- GitHub: https://github.com/darrojen/tributary
- Website: (Vercel URL after deploy)
- Demo video: (YouTube link after recording — script in DEMO.md)

## Project details
- Project name: Tributary
- Team: Darlington Aj
- Contact: darlington.ajaezo@gmail.com
- Builder profiles: https://x.com/AjaezoDarl6031 · https://github.com/darrojen
- First time deploying to Arc: Yes
- Prior Circle/Arc funding for this project: No

## ⚠️ Required at submission (mainnet, not "coming soon")
- Live deployment on Arc mainnet (Vercel URL)
- Arc mainnet contract address or tx hash (TributaryFlow + TributarySplit addresses from deploy)

## In two sentences, what does your project do?
Tributary turns USDC into programmable flow on Arc: payment streams that drip USDC by the second, and splits that fan one deposit out to up to ten payees instantly — all self-custodial, settled on-chain, no admin key. It's payroll, subscriptions, vesting, and revenue sharing as two ~200-line contracts and a clean UI, at ~$0.001 per transaction.

## What does it use Arc for?
1. **USDC as native gas** — value and fees are one asset; no ETH anywhere in the stack; every fee displays in dollars.
2. **~$0.001 transactions + sub-second finality** — what makes per-second accrual and frequent settlement economically viable.
3. **Native USDC ERC-20 interface (0x3600…0000)** — approve/transferFrom directly on the gas token, no wrapped USDC; plus Arc's EWMA-stabilized EIP-1559 fee market for predictable top-up costs.

## Anything else we should see?
Three things: (1) 11/11 Foundry tests cover the accounting edge cases that matter for money — accrual capped at stream balance, pause/resume clock resets, refund-on-close, split dust absorption. (2) The protocol has no admin key and no upgradeability — funds only ever move per stream/split logic. (3) A design proof: our test suite caught that unpausing would have billed paused time; we fixed the contract, not the test. Contracts are ~200 lines each and auditably small. Demo video + live links at the top of the README.
