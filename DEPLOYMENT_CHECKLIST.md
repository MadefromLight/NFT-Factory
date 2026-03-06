# CCIP Deployment Checklist

## ✅ Completed Steps

### 1. Smart Contract Development
- [x] Updated `hardhat.config.js` with multi-chain CCIP support
  - Ethereum Sepolia configured
  - Base Sepolia (primary)
  - Polygon Amoy (ready to enable)
  - Arbitrum Sepolia (ready to enable)
  
- [x] Created `CCIPNFTReceiver.sol`
  - Handles incoming cross-chain messages
  - Message replay protection
  - Token recovery mechanism
  
- [x] Upgraded `Marketplace.sol` with CCIP functions
  - `executeCrossChainPurchase()` function
  - Chain support configuration
  - CCIP receiver management

### 2. CRE Workflow Development
- [x] Created TypeScript CRE workflow for royalty distribution
  - Automatic fee splitting
  - Cross-chain payment distribution
  - Alert notifications via webhook
  
- [x] Set up CRE workflows directory structure
  - `/cre-workflows/royalty-distribution/main.ts`
  - Configuration templates
  - Documentation

### 3. Documentation
- [x] Created comprehensive integration guide (`CCIP_INTEGRATION_GUIDE.md`)
- [x] Deployment scripts ready (`deploy/05-deploy-ccip-infrastructure.js`)

---

## 📋 Next Steps - Action Required

### Step 1: Install Dependencies ⚠️ **REQUIRED**

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/core
npm install @chainlink/contracts-ccip
```

If the installation fails due to network issues, try:
```bash
npm install @chainlink/contracts-ccip --registry https://registry.npmjs.org
```

---

### Step 2: Verify CCIP Router Addresses 🔍 **REQUIRED**

Visit official Chainlink docs to get current router addresses:
- **Base Sepolia**: https://docs.chain.link/ccip/supported-networks/v1_2_0/testnet
- **Ethereum Sepolia**: Same page

Update these in your deployment script:
```javascript
// In deploy/05-deploy-ccip-infrastructure.js
const CCIP_ROUTER_ADDRESS = "ACTUAL_BASE_SEPOLIA_ROUTER"; // TODO: Verify!
```

---

### Step 3: Fund Your Wallet 💰 **REQUIRED**

You'll need testnet tokens:

#### Base Sepolia:
1. **ETH for gas**: Visit [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. **LINK for CCIP**: Visit [Chainlink Faucet](https://faucets.chain.link/base-sepolia)

#### Ethereum Sepolia:
1. **ETH for gas**: Visit [Alchemy Faucet](https://sepoliafaucet.net/)
2. **LINK for CCIP**: Visit [Chainlink Faucet](https://faucets.chain.link/ethereum-sepolia)

**Recommended amounts:**
- 0.5 ETH on each chain (for gas)
- 10 LINK on each chain (for CCIP fees)

---

### Step 4: Deploy Contracts 🚀 **READY TO EXECUTE**

Once dependencies are installed and wallet funded:

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/core

# Deploy CCIP infrastructure
npx hardhat run deploy/05-deploy-ccip-infrastructure.js --network base-sepolia
```

**Expected output:**
```
Deploying CCIP Cross-Chain NFT Infrastructure...

=== Using Existing Marketplace ===
Marketplace: 0x...

=== Step 1: CCIP Router Configuration ===
CCIP Router: 0x...

=== Step 2: Deploying CCIP NFT Receiver ===
CCIPNFTReceiver deployed to: 0x...
✓ Deployment confirmed!

=== Step 3: Configuring Marketplace ===
✓ CCIP receiver set!

=== Step 4: Adding Supported Chains ===
✓ Ethereum Sepolia added!

=== Deployment Summary ===
{
  "contracts": {
    "marketplace": "0x...",
    "ccipReceiver": "0x...",
    "ccipRouter": "0x..."
  }
}
```

**Save the output!** You'll need these addresses.

---

### Step 5: Update Environment Variables 🔧

After deployment, update `.env`:

```bash
# Add after successful deployment
CCIP_RECEIVER_ADDRESS=0x...  # From deployment output
CCIP_ROUTER_BASE_SEPOLIA=0x...
CCIP_ROUTER_ETH_SEPOLIA=0x...
```

---

### Step 6: Deploy Sender Contract on Ethereum Sepolia 📤

Create and deploy the sender contract:

```bash
# Create sender contract file first (see CCIP_INTEGRATION_GUIDE.md)
# Then deploy:
npx hardhat run deploy/06-deploy-ccip-sender.js --network sepolia
```

*(We'll create this deployment script in the next phase)*

---

### Step 7: Test Cross-Chain Purchase 🧪

Once everything is deployed:

```javascript
// Test script we'll provide
// This will initiate a purchase from Ethereum Sepolia
// And verify it executes on Base Sepolia
```

---

### Step 8: Set Up CRE Workflow ☁️

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/cre-workflows

# Install dependencies
npm install

# Configure
cp config.example.json config.json
# Edit config.json with your addresses

# Simulate locally (optional)
cre simulate royalty-distribution --config config.json

# Deploy to Chainlink DON (requires Early Access)
cre deploy royalty-distribution --config config.json --network base-sepolia
```

---

## 🔍 Verification Steps

After deployment, verify everything works:

### 1. Check Contract Addresses
```bash
npx hardhat console --network base-sepolia
```

```javascript
const Marketplace = await ethers.getContractFactory("Marketplace");
const marketplace = await Marketplace.attach("YOUR_MARKETPLACE");
console.log("CCIP Receiver:", await marketplace.ccipReceiver());
console.log("Supported Chains:", await marketplace.getSupportedChains());
```

### 2. Monitor CCIP Messages

Visit [CCIP Explorer](https://ccip.chain.link/) and enter:
- Your CCIP receiver address
- Transaction hash from cross-chain purchase

### 3. Test CRE Workflow Simulation

```bash
cd cre-workflows
npm run simulate
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: npm install fails
```
Solution: Use alternative registry or clear cache
npm cache clean --force
npm install @chainlink/contracts-ccip --registry https://registry.npmjs.org
```

### Issue 2: Deployment fails with "insufficient funds"
```
Solution: You need more testnet ETH
- Get more from faucet
- Or reduce gas price in hardhat.config.js
```

### Issue 3: CCIP message not delivered
```
Solution: Check the following:
1. Verify router addresses are correct
2. Ensure CCIP receiver has ETH for gas refunds
3. Check CCIP explorer for message status
4. Verify source chain selector matches destination
```

### Issue 4: "Unsupported chain" error
```
Solution: Enable the chain in marketplace
await marketplace.setChainSupport(CHAIN_SELECTOR, true);
```

---

## 📊 Success Criteria

✅ All of these should be true:
- [ ] CCIPNFTReceiver contract deployed on Base Sepolia
- [ ] Marketplace configured with CCIP receiver
- [ ] Ethereum Sepolia enabled as supported chain
- [ ] Wallet has LINK tokens on both chains
- [ ] CCIP router addresses verified and updated
- [ ] Deployment transaction confirmed on block explorer

---

## 🎯 What You'll Achieve

Once complete:
1. **Cross-chain NFT purchases** from Ethereum Sepolia → Base Sepolia
2. **Automated royalty distribution** via CRE workflows
3. **Extensible architecture** to add Polygon, Arbitrum, etc.
4. **Production-ready** cross-chain marketplace infrastructure

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs**: Review terminal output carefully
2. **Verify addresses**: Double-check all contract addresses
3. **Test incrementally**: Don't skip verification steps
4. **Ask for help**: 
   - Chainlink Discord: https://discord.gg/chainlink
   - Email: abimbola.zeuslabs@gmail.com

---

## 🚀 Ready to Deploy?

When you're ready, let me know and I'll:
1. Help you install dependencies
2. Guide you through deployment step-by-step
3. Create test scripts for validation
4. Set up monitoring dashboards

**Just say**: "Let's deploy!" when ready.
