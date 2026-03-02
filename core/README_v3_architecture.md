# NFT Factory v3 Architecture

## Overview
This branch contains the v3 architecture implementation featuring a tier-certified, subscription-based NFT creation and marketplace system.

## Key Features
- **Tier-Certified NFT Creation**: Organizations must subscribe to create certified NFT collections
- **Subscription Tiers**: 5-tier system (Coal, Bronze, Silver, Gold, Platinum) with varying quotas and benefits
- **Dynamic Fees**: Marketplace fees vary based on subscription tier
- **Verification System**: Collections undergo verification for quality assurance
- **Upgradeable Contracts**: All contracts maintain upgradeability for future enhancements

## Contract Structure
- **FactoryV2**: Deploys upgradeable NFT collections with subscription validation
- **SimpleCollectibleV2**: ERC-721 NFT contract with tier/class metadata encoding
- **SubscriptionNFT**: Soulbound tokens representing organization tier and minting rights
- **Marketplace**: Tier-certified NFT marketplace with dynamic fees

## Deployment Addresses (Base Sepolia)
- **SubscriptionNFT Proxy**: 0xd06Ee9B51be61D913315CD0e22D06bE787c5cbe5
- **FactoryV2 Proxy**: 0xe90335369A7cdD7570EF99988DB3ADce85D89055
- **SimpleCollectibleV2 Implementation**: 0x545874d3c81699C4Da951c91801f9D9C166cF368
- **Marketplace Proxy**: 0xCE4274c33dB9E32926120E7497d67E4335024a38

## Testing
Run the following to verify contract functionality:
```bash
cd core
npx hardhat run simple_contract_test.js --network baseSepolia
```

## Architecture Benefits
- Enhanced governance through subscription-based approval
- Quality control via verification and compliance mechanisms
- Diversified revenue streams (subscriptions, minting fees, marketplace fees)
- Scalable tier-based pricing model
- Maintained security and upgradeability

## Next Steps
- Integrate subscription purchase flow in frontend
- Connect client application to new contract system
- Implement comprehensive testing for end-to-end workflows