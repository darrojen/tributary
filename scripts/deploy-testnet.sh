#!/usr/bin/env bash
# Deploy Tributary to Arc TESTNET (chain 5042002).
# Requires: DEPLOYER_PRIVATE_KEY in .env (funded with testnet USDC from faucet.circle.com)
set -euo pipefail
cd "$(dirname "$0")/../contracts"

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "❌ Set DEPLOYER_PRIVATE_KEY in .env first (see .env.example)"
  exit 1
fi

echo "🌊 Deploying Tributary to Arc Testnet (chain 5042002)..."
forge script script/Deploy.s.sol \
  --rpc-url arc_testnet \
  --broadcast \
  --verify \
  --verifier etherscan \
  --verifier-url "https://explorer.testnet.arc.io/api"

echo ""
echo "✅ Done. Copy the deployed addresses into frontend/.env.local:"
echo "   NEXT_PUBLIC_FLOW_ADDRESS=<TributaryFlow address>"
echo "   NEXT_PUBLIC_SPLIT_ADDRESS=<TributarySplit address>"
