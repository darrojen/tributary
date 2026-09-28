# Mainnet deploy — runbook for the day you're funded

15 minutes of work. Cost: **<$0.10 in gas** (USDC itself is the gas on Arc). This doc is the
only thing standing between you and filling the form's two mainnet fields.

## 0. Prerequisites checklist

- [ ] WSL works, Foundry installed (`~/.foundry/bin`)
- [ ] Root `.env` exists — you'll put the **new** key in it
- [ ] ~$2–5 real USDC on **Arc mainnet** in the new wallet (see §2)

## 1. Make the fresh key (5 min)

⚠️ Do NOT reuse the old `.env` key — it appeared in chat transcripts, so treat it as burned.

Pick the easiest option:

**A. New MetaMask account (recommended — you need a wallet for the demo anyway)**
1. MetaMask → account menu → **Add account** (or Import if you generated externally)
2. Copy its private key: account details → *Show private key* (never share, never screenshot)

**B. Generate offline in WSL**
```bash
export PATH="$HOME/.foundry/bin:$PATH"
cast wallet new
```
Copy the address + private key. Import the key into MetaMask later when you want a UI.

## 2. Fund it with real USDC on Arc mainnet (~$2–5)

Get USDC onto Arc mainnet by one of:
- **Exchange withdrawal**: withdraw USDC from any exchange that supports Arc (or bare
  withdrawal to the Arc network if listed) directly to your new address
- **Circle-native path**: if your funds are USDC on another chain, use a CCTP-backed bridge
  UI that routes to Arc
- **Someone with USDC on Arc** sends it to your new address (cheapest — one transfer)

That USDC covers both the < $0.10 gas *and* the stream you'll create on mainnet for the demo.

## 3. Put the new key in `.env` (project root)

```
DEPLOYER_PRIVATE_KEY=0x<the NEW key>
```

## 4. Deploy (the one command)

In WSL:
```bash
export PATH="$HOME/.foundry/bin:$PATH"
cd /mnt/c/Users/Darl/Desktop/DoraHacks/001
npm run deploy:mainnet
```

The script sources `.env`, warns before broadcasting, and sets 30 Gwei max fee (the Arc
base-fee floor is 20 Gwei — lower fees get stuck). It prints:

```
TributaryFlow: 0x…
TributarySplit: 0x…
```

Verify both on the explorer: https://explorer.arc.io/address/<address>

If verification needs an API key, set `ARCSCAN_API_KEY` in `.env` (same place you got the
testnet one). Unverified contracts still work — the form only asks for the address/tx hash.

## 5. Flip the frontend to mainnet

In `frontend/.env.local` (and later on Vercel):

```
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_FLOW_ADDRESS=0x<from step 4>
NEXT_PUBLIC_SPLIT_ADDRESS=0x<from step 4>
NEXT_PUBLIC_FROM_BLOCK=<deploy block, from the explorer's contract page>
```

`NEXT_PUBLIC_*` is baked at build time → rebuild required. Locally: rerun the tar pipeline
(build in WSL `~/tf`, extract on Windows). On Vercel: just update the four env vars and
redeploy from the dashboard.

## 6. Recreate the demo on mainnet

1. Approve USDC → create stream ($1/hr, 5 USDC) to a second address you control
2. Watch the LIVE card tick — this is your demo video shot
3. Optional: a 60/40 split + deposit for the second scene

## 7. Update the submission

- DoraHacks form: replace the testnet block in the contract field with the mainnet
  addresses (+ explorer links), and the live URL if it changed
- README.md: swap the testnet contract block for mainnet
- Vercel: already handled in §5

Done — eligibility requirement met. Everything else (video, polish) is upside from there.

## Troubleshooting

- **`forge: command not found`** → you skipped the PATH export (junk 0-byte `forge` in
  `C:\Users\Darl` shadows the real one — safe to delete)
- **Tx pending forever** → fee below the 20 Gwei floor; the script already uses 30
- **`insufficient funds`** → mainnet USDC didn't arrive; check explorer balance first
- **Wrong chain from a wallet** → the app now targets whichever `NEXT_PUBLIC_NETWORK` was
  built in; check it says "Mainnet" in the hero badge
