# Web3 Commerce Infrastructure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the NFT Factory Web3 Commerce Infrastructure platform. The platform consists of modular smart contracts designed for merchant-centric commerce with built-in escrow, redemption, and verification systems.

## Prerequisites

### System Requirements
- Node.js v18+
- npm or yarn
- Hardhat
- Base network access (testnet or mainnet)

### Wallet Requirements
- Private key for deployment wallet
- Sufficient ETH for gas fees
- Base network RPC endpoint

### Environment Setup
1. Clone the repository
2. Install dependencies:
```bash
cd core
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

## Environment Configuration

Create a `.env` file in the `core` directory with the following variables:

```env
# Network Configuration
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key
BASESCAN_API_KEY=your_basescan_api_key

# Base Network RPC URLs
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contract Configuration
PLATFORM_FEE_RECIPIENT=0xYourPlatformFeeRecipientAddress
PLATFORM_FEE_BPS=250  # 2.5%

# Commerce Configuration
BASE_REDEMPTION_FEE=10000000000000000  # 0.01 ETH in wei
DEFAULT_TIME_LOCK=604800  # 7 days in seconds
```

## Deployment Process

### 1. Test Deployment (Base Sepolia)

First, test the deployment on Base Sepolia testnet:

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base Sepolia
npx hardhat deploy --network baseSepolia --tags commerce
```

### 2. Mainnet Deployment

After successful testing, deploy to Base mainnet:

```bash
# Deploy commerce infrastructure
npx hardhat deploy --network baseMainnet --tags commerce

# Verify contracts on BaseScan
npx hardhat verify --network baseMainnet <IMPLEMENTATION_ADDRESS>
```

## Contract Deployment Order

The deployment script automatically handles the correct deployment order:

1. **MerchantRegistry** - Core merchant verification system
2. **EscrowManager** - Time-lock escrow mechanisms  
3. **RedemptionManager** - Advanced redemption logic
4. **NFTFactory** - Enhanced factory with commerce integration
5. **SimpleCollectible** - Collection implementation

## Post-Deployment Configuration

### 1. Update Client Configuration

Update the client-side constants with new contract addresses:

```javascript
// client/constants/index.js
const CONTRACT_ADDRESSES = {
  merchantRegistry: "0x...",
  escrowManager: "0x...",
  redemptionManager: "0x...",
  nftFactory: "0x...",
  // ... other addresses
};
```

### 2. Configure Merchant Tiers

Set up merchant tier requirements:

```javascript
// Via MerchantRegistry contract
await merchantRegistry.setTierRequirements([
  0,    // STARTER: 0 trust score required
  300,  // PROFESSIONAL: 300 trust score required
  600,  // ENTERPRISE: 600 trust score required
  800   // PREMIUM: 800 trust score required
]);
```

### 3. Configure Commerce Features

Enable/disable commerce features as needed:

```javascript
// Via NFTFactory contract
await nftFactory.updateCommerceConfig({
  escrowEnabled: true,
  redemptionEnabled: true,
  merchantVerificationRequired: true,
  minMerchantTrustScore: 300
});
```

## Testing the Deployment

### 1. Merchant Registration Test

```javascript
// Register a test merchant
await merchantRegistry.registerMerchant(
  "Test Business",
  "Digital Goods", 
  "https://test.com",
  "Test business description"
);

// Submit verification documents
await merchantRegistry.submitDocument(0, "QmDocumentHash"); // BUSINESS_REGISTRATION
await merchantRegistry.submitDocument(1, "QmIDHash");       // GOVERNMENT_ID

// Verify merchant (admin only)
await merchantRegistry.verifyMerchant(
  merchantAddress,
  2,    // VERIFIED status
  500   // Trust score
);
```

### 2. Collection Deployment Test

```javascript
// Deploy commerce-enabled collection
await nftFactory.deployWithMerchant(
  "Test Collection",
  "TEST",
  ["ipfs://QmToken1", "ipfs://QmToken2"],
  [ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.2")],
  merchantAddress
);
```

### 3. Escrow Transaction Test

```javascript
// Create escrow for NFT purchase
await escrowManager.createEscrow(
  sellerAddress,
  nftContractAddress,
  tokenId,
  7 * 24 * 60 * 60, // 7 days time lock
  { value: purchaseAmount }
);

// Release escrow after time lock
await escrowManager.releaseEscrow(escrowId);
```

### 4. Redemption Test

```javascript
// Request redemption
await redemptionManager.requestRedemption(
  merchantAddress,
  nftContractAddress,
  tokenId,
  0, // PHYSICAL_DELIVERY
  "ipfs://QmRedemptionDetails",
  7 * 24 * 60 * 60 // 7 days time lock
);

// Complete redemption
await redemptionManager.completeRedemption(
  redemptionId,
  "ipfs://QmProofOfRedemption",
  true, // Create soulbound token
  "ipfs://QmSoulboundToken"
);
```

## Monitoring and Maintenance

### 1. Contract Monitoring

Monitor contract events and state:

```javascript
// Listen to key events
merchantRegistry.on("MerchantVerified", (merchant, status) => {
  console.log(`Merchant ${merchant} verified with status ${status}`);
});

escrowManager.on("EscrowCreated", (escrowId, buyer, seller, amount) => {
  console.log(`Escrow ${escrowId} created: ${buyer} -> ${seller} for ${ethers.utils.formatEther(amount)} ETH`);
});
```

### 2. Gas Optimization

Monitor gas usage and optimize:

```bash
# Generate gas report
REPORT_GAS=true npx hardhat test

# Check contract sizes
npx hardhat size-contracts
```

### 3. Security Audits

Regular security checks:

```bash
# Run security analysis
npx hardhat audit

# Check for common vulnerabilities
npx hardhat check
```

## Troubleshooting

### Common Issues

1. **Deployment fails with "insufficient funds"**
   - Ensure deployment wallet has sufficient ETH for gas
   - Check network configuration and RPC endpoint

2. **Contract verification fails**
   - Verify API keys are correct
   - Check contract addresses match deployment output
   - Ensure proper network selection

3. **Merchant registration fails**
   - Verify merchantRegistry contract is properly deployed
   - Check merchant address is not already registered
   - Ensure business name is not empty

4. **Escrow creation fails**
   - Verify NFT ownership
   - Check time lock parameters are within limits
   - Ensure sufficient purchase amount

### Emergency Procedures

1. **Pause contracts** (owner only):
```javascript
await merchantRegistry.pause();
await escrowManager.pause();
await redemptionManager.pause();
await nftFactory.pause();
```

2. **Emergency fund withdrawal** (owner only):
```javascript
await escrowManager.emergencyWithdraw();
```

3. **Contract upgrades** (owner only):
```javascript
// Deploy new implementation
const NewImplementation = await ethers.getContractFactory("NewContract");
const newImpl = await NewImplementation.deploy();

// Upgrade proxy
await upgrades.upgradeProxy(proxyAddress, newImpl);
```

## Production Checklist

Before going live, ensure:

- [ ] All contracts deployed and verified
- [ ] Comprehensive testing completed
- [ ] Security audit performed
- [ ] Gas optimization implemented
- [ ] Monitoring systems configured
- [ ] Emergency procedures documented
- [ ] Client integration tested
- [ ] Documentation updated
- [ ] Team trained on operations

## Support

For deployment issues or questions:
- Check the [documentation](./README.md)
- Review [contract architecture](./docs/architecture.md)
- Contact the development team

---

**Note**: This deployment guide is for the Web3 Commerce Infrastructure platform. Always test thoroughly on testnet before mainnet deployment.