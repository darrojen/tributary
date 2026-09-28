# Deploying Tributary to Arc Testnet — your runbook

Everything is built and tested (11/11 contract tests, frontend builds clean). This is the part **you** do — about 15 minutes.

## 0. What you need
- A fresh burner wallet (MetaMask/Rabby) — **use a key dedicated to this project**, never your main wallet
- Foundry is already installed in your WSL Ubuntu (`~/.foundry/bin`)

## 1. Fund your deployer (free)
1. Go to the faucet: **https://faucet.circle.com**
2. Paste your burner wallet address, select **Arc Testnet** + **USDC** → receive 20 testnet USDC (limit: 20 per address every 2h)
3. Add the network to your wallet: RPC `https://rpc.testnet.arc.io` · Chain ID `5042002` · Symbol `USDC`

## 2. Set your key
In the project root:
```bash
cp .env.example .env
# edit .env → DEPLOYER_PRIVATE_KEY=0x<your burner key>
```

## 3. Deploy
Run inside WSL (Foundry lives there):
```bash
wsl
export PATH="$HOME/.foundry/bin:$PATH"
cd /mnt/c/Users/Darl/Desktop/DoraHacks/001
npm run deploy:testnet
```
The script broadcasts both contracts and verifies them on the explorer. Note the two printed addresses:
- `TributaryFlow: 0x…`
- `TributarySplit: 0x…`

## 4. Point the frontend at your contracts
```bash
cp frontend/.env.example frontend/.env.local
# edit: NEXT_PUBLIC_FLOW_ADDRESS=0x…   NEXT_PUBLIC_SPLIT_ADDRESS=0x…
```

## 5. Run it locally
The fast path (deps already installed in WSL at ~/tf):
```bash
# after copying your .env.local into ~/tf, from WSL:
cd ~/tf && . ~/.nvm/nvm.sh && npm run dev
# → http://localhost:3000
```
(Or on Windows: `cd frontend && npm install && npm run dev` — slower, AV scans.)

## 6. Demo loop
1. Faucet 20 USDC → your wallet
2. **Streams**: create a stream to a second address, $1/hr, 5 USDC funded → watch the LIVE card tick in real dollars → Settle / Pause / Close (refund returns)
3. **Splits**: create a 60/40 split between two addresses → deposit 5 USDC → both legs pay atomically

## 7. Mainnet (when you're ready for the submission)
Fund ~$1–5 real USDC on Arc mainnet (exchange withdrawal to Arc, or a CCTP bridge UI), then:
```bash
npm run deploy:mainnet
```
Gas cost: **under $0.10**. Update `.env.local` with the mainnet addresses, redeploy the frontend (Vercel: import the repo, add the two NEXT_PUBLIC_ vars, deploy).

## Troubleshooting
- `forge: command not found` → you skipped `export PATH="$HOME/.foundry/bin:$PATH"` (there's a junk 0-byte `forge` file in `C:\Users\Darl` that shadows the real one — you can delete it)
- Deploy tx pending forever → base fee floor is 20 Gwei on Arc; the script already sets 30 Gwei max fee
- `insufficient funds` → faucet again (2h cooldown per address) or use a second address
