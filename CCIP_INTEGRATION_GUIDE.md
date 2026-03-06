# Chainlink CCIP + CRE Integration Guide for NFT Factory

## Overview

This guide walks you through integrating Chainlink CCIP (Cross-Chain Interoperability Protocol) and CRE (Chainlink Runtime Environment) into the NFT Factory platform, enabling:

1. **Cross-chain NFT purchases** - Users can buy NFTs from any supported blockchain
2. **Automated royalty distribution** - Smart contract royalties automatically split across chains
3. **Multi-chain marketplace** - Expand your NFT marketplace to multiple blockchains

## Architecture

```
┌─────────────────┐
│ Ethereum Sepolia │ (Source Chain)
│   User Wallet    │
└────────┬────────┘
         │
         │ 1. Initiate Purchase (ETH/USDC + CCIP message)
         ▼
┌─────────────────┐
│  CCIP Network   │ (Chainlink DON)
│  Cross-Chain    │
│  Message Layer  │
└────────┬────────┘
         │
         │ 2. Verified Message + Tokens
         ▼
┌─────────────────┐
│  Base Sepolia   │ (Destination Chain)
│  CCIP Receiver  │
└────────┬────────┘
         │
         │ 3. Execute Purchase
         ▼
┌─────────────────┐
│   Marketplace   │
│  - Transfer NFT │
│  - Split Fees   │
└────────┬────────┘
         │
         │ 4. Trigger CRE Workflow
         ▼
┌─────────────────┐
│  CRE Workflow   │ (Off-chain Oracle)
│  - Calculate    │
│  - Distribute   │
└─────────────────┘
```

## Prerequisites

### 1. Testnet Tokens

You'll need testnet tokens on both chains:

**Base Sepolia:**
- ETH for gas: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- LINK for CCIP: [Chainlink Faucet](https://faucets.chain.link/base-sepolia)

**Ethereum Sepolia:**
- ETH for gas: [Alchemy Faucet](https://sepoliafaucet.net/)
- LINK for CCIP: [Chainlink Faucet](https://faucets.chain.link/ethereum-sepolia)

### 2. Environment Setup

Update your `.env` file in `/core`:

```bash
# Existing variables...
PRIVATE_KEY=0x...
ALCHEMY_API_KEY=...
BASESCAN_API_KEY=...
ETHERSCAN_API_KEY=...

# Add CCIP Configuration
MARKETPLACE_ADDRESS=0x...  # Your deployed marketplace address
CCIP_ROUTER_BASE_SEPOLIA=0x...  # Will be provided below
CCIP_ROUTER_ETH_SEPOLIA=0x...   # Will be provided below
```

## Step-by-Step Implementation

### Phase 1: Deploy CCIP Infrastructure on Base Sepolia

#### 1.1 Install Dependencies

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/core
npm install @chainlink/contracts-ccip
```

#### 1.2 Find CCIP Router Addresses

Visit the [CCIP documentation](https://docs.chain.link/ccip/supported-networks/v1_2_0/testnet) for the latest router addresses:

**As of current deployment:**
- **Base Sepolia Router**: `0xF694EF887Cda952B5FD5391A765D1eFE3aC8E947` (verify before use)
- **Ethereum Sepolia Router**: `0x0BF3e630bE0dEe57F88d2734fC17bB54c5B1451f` (verify before use)

⚠️ **Important**: Always verify router addresses from official Chainlink docs as they may change!

#### 1.3 Update Deployment Script

Edit `/core/deploy/05-deploy-ccip-infrastructure.js`:

```javascript
const CCIP_ROUTER_ADDRESS = "0xF694EF887Cda952B5FD5391A765D1eFE3aC8E947"; // Base Sepolia
```

#### 1.4 Deploy

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/core
npx hardhat run deploy/05-deploy-ccip-infrastructure.js --network base-sepolia
```

This will:
1. Deploy the CCIPNFTReceiver contract
2. Configure it with your existing Marketplace
3. Enable Ethereum Sepolia as a supported chain

### Phase 2: Configure Source Chain (Ethereum Sepolia)

On Ethereum Sepolia, you'll need a sender contract. Create `/core/contracts/CCIPNFTSender.sol`:

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
        // Encode purchase message
        bytes memory message = abi.encode(
            msg.sender,      // buyer
            nftContract,     // NFT on destination
            tokenId,         // token ID
            amount,          // payment
            ""               // metadata
        );
        
        // Get fee for CCIP message
        uint256 fees = _getFee(destinationChainSelector, message);
        
        // Send via CCIP
        messageId = _send(
            destinationChainSelector,
            msg.sender,      // receiver (will be handled by CCIPNFTReceiver)
            message,
            Client.EVMTokenAmount[]({}), // No ERC20 tokens (sending ETH)
            address(this),   // fee token
            fees
        );
    }
    
    function _getFee(
        uint64 destChainSelector,
        bytes memory message
    ) internal view returns (uint256) {
        return _getFee(
            destChainSelector,
            message,
            Client.EVMTokenAmount[]({})
        );
    }
    
    receive() external payable {}
}
```

### Phase 3: Install and Configure CRE

#### 3.1 Install CRE CLI

```bash
npm install -g @chainlink/cre
```

#### 3.2 Create Account

1. Visit [cre.chain.link](https://cre.chain.link)
2. Sign up with your email
3. Save your API credentials

#### 3.3 Request Early Access (Optional - for production deployment)

```bash
cre account access
```

#### 3.4 Install CRE SDK

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/cre-workflows
npm install
```

#### 3.5 Configure Workflow

Create `/cre-workflows/config.json`:

```json
{
  "marketplaceAddress": "YOUR_MARKETPLACE_ADDRESS",
  "ccipRouterAddress": "0xF694EF887Cda952B5FD5391A765D1eFE3aC8E947",
  "supportedChains": {
    "ethereum-sepolia": {
      "selector": "16015289601813375307",
      "enabled": true,
      "rpcUrl": "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
    },
    "base-sepolia": {
      "selector": "10344971235874465080",
      "enabled": true,
      "rpcUrl": "https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"
    }
  },
  "feeDistribution": {
    "platformFeeBps": 250,
    "maxCreatorRoyaltyBps": 500
  },
  "alertWebhook": "https://your-webhook.com/alerts"
}
```

### Phase 4: Test the Integration

#### 4.1 Simulate CRE Workflow (Local Testing)

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/cre-workflows
cre simulate royalty-distribution --config config.json
```

#### 4.2 Test Cross-Chain Purchase

**From Ethereum Sepolia:**

```javascript
// Using ethers.js
const senderContract = new ethers.Contract(
  SENDER_ADDRESS,
  SenderABI,
  signer
);

const nftContractOnBase = "YOUR_NFT_CONTRACT_ON_BASE";
const tokenId = 1;
const price = ethers.parseEther("0.1");

const tx = await senderContract.sendCrossChainPurchase(
  "10344971235874465080", // Base Sepolia selector
  nftContractOnBase,
  tokenId,
  price,
  { value: price } // Include payment
);

await tx.wait();
console.log("Cross-chain purchase initiated!");
```

#### 4.3 Monitor Transaction

Track your CCIP messages at: [CCIP Explorer](https://ccip.chain.link/)

### Phase 5: Deploy to Production

#### 5.1 Deploy CRE Workflow

```bash
cd /Users/mac/NFT\ Factory/NFTFactory/cre-workflows
cre deploy royalty-distribution --config config.json --network base-sepolia
```

#### 5.2 Fund CCIP Receiver

The CCIP receiver needs ETH for gas refunds:

```bash
# Send ETH directly to the CCIPNFTReceiver address
cast send --value 0.1ether CCIP_RECEIVER_ADDRESS
```

## Adding More Chains

To add Polygon Amoy or Arbitrum Sepolia:

### 1. Update Hardhat Config

Already configured in `hardhat.config.js`:

```javascript
'polygon-amoy': {
  chainId: 80002,
  ccipBnSelector: '16281711391670634445',
  // ...
}
```

### 2. Deploy Sender Contract

Deploy `CCIPNFTSender.sol` on the new chain with the correct router address.

### 3. Update Marketplace Configuration

```javascript
// In deployment script or via transaction
await marketplace.setChainSupport(POLYGON_AMOY_SELECTOR, true);
```

### 4. Update CRE Config

Add to `config.json`:

```json
"polygon-amoy": {
  "selector": "16281711391670634445",
  "enabled": true,
  "rpcUrl": "..."
}
```

## Monitoring and Debugging

### 1. CCIP Message Status

Check message status programmatically:

```typescript
import { ccip } from "@chainlink/cre-sdk-ts/capabilities/ccip";

const ccipClient = new ccip.Client({ router });
const status = await ccipClient.getMessageStatus(runtime, messageId);
console.log("Message status:", status);
```

### 2. Event Logs

Monitor these events:

**On Marketplace:**
- `CrossChainPurchaseExecuted`
- `Sold`

**On CCIP Receiver:**
- `CrossChainPurchaseReceived`
- `MessageProcessed`

### 3. CRE Logs

Access CRE workflow logs:

```bash
cre logs royalty-distribution --network base-sepolia
```

## Security Considerations

1. **Message Verification**: Always verify CCIP messages came from authorized senders
2. **Replay Protection**: Track processed message IDs (already implemented)
3. **Rate Limiting**: Consider adding daily volume limits per chain
4. **Emergency Pause**: Use marketplace pause function if issues detected
5. **Multi-sig**: Consider using multi-sig for admin functions

## Cost Optimization

1. **Gas Efficiency**: Batch multiple royalty payments in one CCIP message
2. **Token Choice**: Use stablecoins (USDC) for predictable fees
3. **Confirmation Blocks**: Adjust based on security needs (3-12 blocks)
4. **CRE Triggers**: Use log triggers instead of polling for efficiency

## Next Steps

After completing this integration:

1. ✅ **Test thoroughly** on testnets before mainnet
2. 📊 **Set up monitoring** dashboard for cross-chain activity
3. 🔔 **Configure alerts** for failed transactions
4. 📝 **Document user flow** for cross-chain purchases
5. 🎨 **Update frontend** to show chain selection UI
6. 🧪 **Audit** smart contracts before mainnet deployment

## Resources

- [CCIP Documentation](https://docs.chain.link/ccip)
- [CRE Documentation](https://docs.chain.link/cre)
- [CCIP Supported Networks](https://docs.chain.link/ccip/supported-networks)
- [Chainlink Functions](https://docs.chain.link/functions)
- [NFT Factory GitHub](https://github.com/your-repo)

## Support

For issues or questions:
- Check the [Chainlink Discord](https://discord.gg/chainlink)
- Review [existing issues](https://github.com/your-repo/issues)
- Contact: Abimbola James - abimbola.zeuslabs@gmail.com

---

**Version**: 1.0.0  
**Last Updated**: March 3, 2026  
**Author**: NFT Factory Team
