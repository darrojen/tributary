#!/usr/bin/env bash
# Deploy Tributary to Arc MAINNET (chain 5042).
# Requires: DEPLOYER_PRIVATE_KEY in .env, funded with a small amount of real USDC on Arc.
# Cost estimate: < $0.10 total (two contract deploys at ~20 Gwei base fee).
set -euo pipefail
cd "$(dirname "$0")/../contracts"

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "❌ Set DEPLOYER_PRIVATE_KEY in .env first (see .env.example)"
  exit 1
fi

read -p "⚠️  This deploys to Arc MAINNET with real USDC gas. Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

echo "🌊 Deploying Tributary to Arc Mainnet (chain 5042)..."
forge script script/Deploy.s.sol \
  --rpc-url arc_mainnet \
  --broadcast \
  --verify \
  --verifier etherscan \
  --verifier-url "https://explorer.arc.io/api"

echo ""
echo "✅ Mainnet deployment complete. Update frontend/.env.local with the new addresses."
