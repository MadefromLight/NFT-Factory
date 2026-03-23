# NFT Factory - Complete Deployment Guide

## Comprehensive deployment instructions for all platform components

---

## Table of Contents

1. [Smart Contract Deployment](#smart-contract-deployment)
2. [Client Frontend Deployment](#client-frontend-deployment)
3. [Backend Services Deployment](#backend-services-deployment)
4. [Admin Panel Deployment](#admin-panel-deployment)
5. [Chainlink CCIP Integration](#chainlink-ccip-integration)
6. [Production Checklist](#production-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Smart Contract Deployment

### Prerequisites

- Node.js v18+ installed
- Base Sepolia testnet ETH (get from [faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
- Alchemy API key ([get here](https://alchemy.com))
- BaseScan API key ([get here](https://basescan.io))
- Private key for deployment wallet

### Step 1: Setup Core Contracts

```bash
cd core
npm install
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key
BASESCAN_API_KEY=your_basescan_api_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### Step 2: Compile Contracts

```bash
npx hardhat compile
```

Expected output should show successful compilation without errors.

### Step 3: Run Tests

```bash
# Run all tests
npx hardhat test

# Generate gas report (optional)
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage --network localhost
```

Ensure all tests pass before deployment.

### Step 4: Deploy to Base Sepolia

Deploy the commerce infrastructure:

```bash
# Deploy Factory contract
npx hardhat run deploy/01-deploy-factory.js --network baseSepolia

# Deploy subscription system
npx hardhat run deploy/02-deploy-subscription-system.js --network baseSepolia

# Upgrade to FactoryV2 (optional)
npx hardhat run deploy/03-upgrade-factoryv2.js --network baseSepolia

# Deploy commerce infrastructure
npx hardhat run deploy/04-deploy-commerce-infrastructure.js --network baseSepolia

# Deploy CCIP infrastructure
npx hardhat run deploy/05-deploy-ccip-infrastructure.js --network baseSepolia
```

Save all deployed contract addresses from the output.

### Step 5: Verify Contracts

Verify contracts on BaseScan:

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

For each deployed contract, run verification separately.

### Step 6: Update Client Configuration

Update client environment variables with deployed addresses:

```env
NEXT_PUBLIC_FACTORY_PROXY_ADDRESS=<deployed_address>
NEXT_PUBLIC_COLLECTION_IMPLEMENTATION=<deployed_address>
NEXT_PUBLIC_SUBSCRIPTION_NFT=<deployed_address>
NEXT_PUBLIC_MARKETPLACE_ADDRESS=<deployed_address>
```

---

## Client Frontend Deployment

### Option 1: Vercel CLI (Recommended)

```bash
cd client

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin v3-architecture
```

#### Step 2: Configure Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select: `MadefromLight/NFT-Factory`
4. Configure settings:
   ```
   Framework Preset: Next.js
   Root Directory: client
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

#### Step 3: Add Environment Variables

Add these in Vercel's environment settings:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=d53916a1cd392d59c255e0b115c9d442
NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# Deployed Contract Addresses
NEXT_PUBLIC_FACTORY_PROXY_ADDRESS=0x211C3c71Aa0Aac76eaA989CA193D03b132358960
NEXT_PUBLIC_COLLECTION_IMPLEMENTATION=0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0
NEXT_PUBLIC_SUBSCRIPTION_NFT=0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e
```

#### Step 4: Deploy

Click "Deploy" and wait 3-5 minutes for build completion.

### Post-Deployment Testing

Test the deployed site:

1. ✅ Navigate to deployment URL
2. ✅ Click "Connect Wallet" button
3. ✅ Verify Coinbase Wallet / Base wallet appears
4. ✅ Connect wallet successfully
5. ✅ Verify wallet address displays in UI
6. ✅ Test navigation to protected routes
7. ✅ Check browser console for errors

### Known Build Warnings (Safe to Ignore)

```
1. Module not found: '@react-native-async-storage/async-storage'
   - Optional MetaMask SDK dependency for React Native
   - Doesn't affect web functionality

2. TypeScript warnings in utils/index.ts
   - Read operations work correctly
   - Non-blocking for deployment
```

---

## Backend Services Deployment

### Server Backend Deployment

#### Deploy to Vercel

```bash
cd server

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

Configure in Vercel:
- Root Directory: `server`
- Build Command: `npm run build`
- Output Directory: `dist`

#### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

Set environment variables in Railway dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`

#### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create nft-factory-server

# Deploy
git push heroku main

# Set environment variables
heroku config:set MONGODB_URI=your_uri
heroku config:set JWT_SECRET=your_secret
```

---

## Admin Panel Deployment

### Admin Frontend (React + Vite)

#### Deploy to Vercel

```bash
cd admin-frontend

# Build
npm run build

# Deploy
vercel --prod
```

Configuration:
- Root Directory: `admin-frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

#### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Admin Backend (TypeScript + Node.js)

#### Deploy to Railway

```bash
cd admin-backend
railway up
```

Environment variables needed:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PINATA_API_KEY`
- `PINATA_SECRET_KEY`
- `RPC_URL`
- `PRIVATE_KEY`
- `FACTORY_V2_ADDRESS`
- `SUBSCRIPTION_NFT_ADDRESS`

#### Deploy to Render

```bash
# Install Render CLI
npm install -g render-cli

# Deploy
render up
```

---

## Chainlink CCIP Integration

### Overview

Enable cross-chain NFT purchases and automated royalty distribution using Chainlink CCIP (Cross-Chain Interoperability Protocol) and CRE (Chainlink Runtime Environment).

### Architecture

```
Ethereum Sepolia → CCIP Network → Base Sepolia → Marketplace → CRE Workflow
(User initiates)   (Chainlink DON)  (Receiver)    (Execute)     (Distribute)
```

### Step 1: Install CCIP Dependencies

```bash
cd core
npm install @chainlink/contracts-ccip
```

### Step 2: Get Testnet Tokens

**Base Sepolia:**
- ETH for gas: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- LINK for CCIP: [Chainlink Faucet](https://faucets.chain.link/base-sepolia)

**Ethereum Sepolia:**
- ETH for gas: [Alchemy Faucet](https://sepoliafaucet.net/)
- LINK for CCIP: [Chainlink Faucet](https://faucets.chain.link/ethereum-sepolia)

**Recommended amounts:**
- 0.5 ETH on each chain (for gas)
- 10 LINK on each chain (for CCIP fees)

### Step 3: Verify CCIP Router Addresses

Check official [Chainlink CCIP docs](https://docs.chain.link/ccip/supported-networks/v1_2_0/testnet) for current addresses:

As of deployment date:
- **Base Sepolia Router**: `0xF694EF887Cda952B5FD5391A765D1eFE3aC8E947` (verify!)
- **Ethereum Sepolia Router**: `0x0BF3e630bE0dEe57F88d2734fC17bB54c5B1451f` (verify!)

⚠️ **Always verify router addresses from official docs as they may change!**

### Step 4: Deploy CCIP Infrastructure

```bash
cd core
npx hardhat run deploy/05-deploy-ccip-infrastructure.js --network base-sepolia
```

This will:
1. Deploy CCIPNFTReceiver contract
2. Configure marketplace with CCIP receiver
3. Enable Ethereum Sepolia as supported chain
4. Save deployment info

### Step 5: Deploy Sender Contract (Ethereum Sepolia)

Create sender contract `/core/contracts/CCIPNFTSender.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPSender} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPSender.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CCIPNFTSender is CCIPSender {
    constructor(address router) CCIPSender(router) {}
    
    function sendCrossChainPurchase(
        uint64 destinationChainSelector,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    ) external payable returns (bytes32 messageId) {
        // Implementation
    }
}
```

Deploy to Ethereum Sepolia:

```bash
npx hardhat run deploy/06-deploy-ccip-sender.js --network sepolia
```

### Step 6: Configure CRE Workflows

```bash
cd cre-workflows
npm install

# Copy configuration
cp config.example.json config.json

# Edit config.json with your addresses
```

Example configuration:

```json
{
  "marketplaceAddress": "YOUR_MARKETPLACE_ADDRESS",
  "ccipRouterAddress": "0xF694EF887Cda952B5FD5391A765D1eFE3aC8E947",
  "supportedChains": {
    "ethereum-sepolia": {
      "selector": "16015289601813375307",
      "enabled": true
    },
    "base-sepolia": {
      "selector": "10344971235874465080",
      "enabled": true
    }
  },
  "feeDistribution": {
    "platformFeeBps": 250,
    "maxCreatorRoyaltyBps": 500
  }
}
```

### Step 7: Test Cross-Chain Purchase

```javascript
// Using ethers.js
const senderContract = new ethers.Contract(
  SENDER_ADDRESS,
  SenderABI,
  signer
);

const tx = await senderContract.sendCrossChainPurchase(
  "10344971235874465080", // Base Sepolia selector
  nftContractOnBase,
  tokenId,
  price,
  { value: price }
);

await tx.wait();
console.log("Cross-chain purchase initiated!");
```

Monitor at [CCIP Explorer](https://ccip.chain.link/)

### Step 8: Deploy CRE Workflow

```bash
cd cre-workflows
cre deploy royalty-distribution --config config.json --network base-sepolia
```

Fund CCIP receiver with ETH for gas:

```bash
cast send --value 0.1ether CCIP_RECEIVER_ADDRESS
```

---

## Production Checklist

### Before Mainnet Deployment

#### Smart Contracts
- [ ] All tests passing (target: >90% coverage)
- [ ] Gas optimization implemented
- [ ] Security audit completed
- [ ] Contracts verified on block explorer
- [ ] Owner/multi-sig wallet configured
- [ ] Emergency pause mechanisms tested
- [ ] Upgrade mechanism tested

#### Frontend
- [ ] Wallet connection tested on production
- [ ] All contract interactions working
- [ ] Error handling implemented
- [ ] Loading states displaying correctly
- [ ] Mobile responsive design verified
- [ ] SEO meta tags configured
- [ ] Analytics tracking enabled
- [ ] Custom domain configured (if needed)

#### Backend
- [ ] Database migrations applied
- [ ] API endpoints secured with authentication
- [ ] Rate limiting configured
- [ ] Logging and monitoring setup
- [ ] Error tracking (Sentry/LogRocket)
- [ ] Backup strategy implemented
- [ ] SSL/TLS certificates active

#### Security
- [ ] Private keys stored securely (use Vault/AWS Secrets Manager)
- [ ] Multi-sig wallet for admin functions
- [ ] Timelock for critical operations
- [ ] Bug bounty program considered
- [ ] Incident response plan documented

#### Monitoring
- [ ] Application Performance Monitoring (APM)
- [ ] Real-time alerting configured
- [ ] Blockchain event monitoring
- [ ] Database performance metrics
- [ ] User analytics dashboard

---

## Troubleshooting

### Smart Contract Deployment Issues

**Issue: Insufficient funds for deployment**
```
Solution: 
- Ensure wallet has enough testnet ETH
- Reduce gas price in hardhat.config.js
- Use a different RPC endpoint
```

**Issue: Contract verification fails**
```
Solution:
- Verify API key is correct
- Check contract address matches deployment
- Ensure proper network selected
- Wait a few blocks before verifying
```

**Issue: CCIP message not delivered**
```
Solution:
1. Verify router addresses are correct
2. Ensure CCIP receiver has ETH for gas refunds
3. Check CCIP explorer for message status
4. Verify source chain selector matches destination
```

### Frontend Build Issues

**Issue: Build fails with "Module not found"**
```bash
# Solution: Check build logs
cd client
npm install --legacy-peer-deps
npm run build

# If still failing, check package.json for missing dependencies
```

**Issue: Wallet connection doesn't work**
```
Checklist:
1. Verify WalletConnect project ID is valid
2. Check Base Sepolia RPC endpoint is accessible
3. Ensure wallet extension is installed and unlocked
4. Verify contract addresses are correct in .env.local
5. Check browser console for errors
```

**Issue: Transaction fails**
```
Common causes:
- Wrong network (should be Base Sepolia)
- Insufficient testnet ETH for gas
- Incorrect contract addresses
- Slippage too low (for DEX interactions)
- User rejected transaction
```

### Backend Issues

**Issue: MongoDB connection fails**
```
Solution:
- Verify MongoDB URI is correct
- Check IP whitelist in Atlas
- Ensure network access is allowed
- Verify database name exists
```

**Issue: JWT authentication fails**
```
Solution:
- Verify JWT_SECRET is set
- Check token expiration time
- Ensure clock synchronization
- Clear browser cache and cookies
```

**Issue: IPFS upload fails**
```
Solution:
- Verify Pinata API credentials
- Check file size limits
- Ensure proper file format
- Review rate limiting
```

### CCIP Integration Issues

**Issue: npm install fails for @chainlink/contracts-ccip**
```bash
# Solutions:
npm cache clean --force
npm install @chainlink/contracts-ccip --registry https://registry.npmjs.org

# Or use yarn:
yarn add @chainlink/contracts-ccip
```

**Issue: Deployment fails with "unsupported chain"**
```
Solution:
- Enable chain in marketplace contract
await marketplace.setChainSupport(CHAIN_SELECTOR, true);
- Verify chain selector is correct
- Check hardhat.config.js has chain configured
```

**Issue: CRE workflow simulation fails**
```bash
# Check:
cd cre-workflows
npm run simulate

# Verify:
- Config.json has correct addresses
- Marketplace has events emitted
- CRE SDK is properly installed
```

---

## Additional Resources

### Documentation
- [Base Documentation](https://docs.base.org)
- [Chainlink CCIP Docs](https://docs.chain.link/ccip)
- [Chainlink CRE Docs](https://docs.chain.link/cre)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Community Support
- [Chainlink Discord](https://discord.gg/chainlink)
- [Base Discord](https://discord.gg/buildonbase)
- [GitHub Issues](https://github.com/MadefromLight/NFT-Factory/issues)

### Tools
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Chainlink Faucet](https://faucets.chain.link/)
- [BaseScan Explorer](https://sepolia.basescan.org/)
- [CCIP Explorer](https://ccip.chain.link/)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## Contact & Support

For deployment assistance or questions:
- **Email**: abimbola.zeuslabs@gmail.com
- **GitHub**: Open an issue
- **Documentation**: Check README.md and ARCHITECTURE.md

---

**Last Updated**: March 23, 2026  
**Version**: 3.0.0  
**Status**: Production Ready ✅
