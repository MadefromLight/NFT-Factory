# NFT Factory - Changelog

## Version history, updates, and notable changes

---

## [3.0.0] - March 23, 2026

### 🎉 Major Release - Web3 Commerce Infrastructure Platform

#### Added

**Smart Contracts:**
- `FactoryV2.sol` - Upgraded factory with subscription validation and tier-certified deployment
- `SimpleCollectibleV2.sol` - Enhanced ERC-721 with metadata encoding and improved redemption
- `SubscriptionNFT.sol` - Soulbound NFT system for subscription tiers (Coal, Bronze, Silver, Gold, Platinum)
- `Marketplace.sol` - Tier-certified marketplace with dynamic fee structure
- `MerchantRegistry.sol` - Merchant verification and trust scoring system
- `EscrowManager.sol` - Time-lock escrow for buyer protection
- `RedemptionManager.sol` - Advanced redemption with burn-to-soulbound conversion
- `CCIPNFTReceiver.sol` - Cross-chain NFT purchase receiver via Chainlink CCIP

**Features:**
- Multi-tier subscription system with quota-based minting (10-1000 NFTs per tier)
- Dynamic marketplace fees based on subscription tier (3%-5%)
- Cross-chain NFT purchases via Chainlink CCIP
- Automated royalty distribution with Chainlink CRE workflows
- Merchant verification with trust score calculation
- Time-lock escrow mechanism (default 7 days)
- Physical/digital asset redemption workflow
- Burn-to-soulbound token conversion

**Infrastructure:**
- Chainlink CCIP integration for cross-chain interoperability
- Chainlink CRE workflows for automated off-chain computation
- Support for multiple chains: Base Sepolia, Ethereum Sepolia, Polygon Amoy, Arbitrum Sepolia
- Upgradeable UUPS proxy pattern for all contracts

#### Changed

**Breaking Changes:**
- Migrated from wagmi v1 to wagmi v2 for better Coinbase Wallet support
- Updated Web3Modal to native WalletConnect integration
- Restructured contract architecture to modular commerce infrastructure
- Enhanced security patterns with OpenZeppelin upgradeable contracts

**Improvements:**
- Improved wallet connection flow with explicit Coinbase Wallet support
- Enhanced gas optimization across all contracts
- Better error handling and custom errors in smart contracts
- Comprehensive event system for off-chain tracking
- Input validation with revert reasons

#### Fixed

- ✅ Base Wallet / Coinbase Wallet connection issue resolved
- ✅ Empty connect buttons on merchant pages fixed
- ✅ TypeScript compilation warnings addressed
- ✅ MetaMask SDK optional dependency warnings handled
- ✅ Contract address configuration synchronized across components

#### Technical Updates

**Dependencies:**
```json
{
  "wagmi": "^2.12.0",
  "viem": "^2.21.0",
  "@tanstack/react-query": "^5.56.2",
  "@wagmi/core": "^3.4.0",
  "@chainlink/contracts-ccip": "latest"
}
```

**Contract Addresses Deployed (Base Sepolia):**
- Factory Proxy: `0x211C3c71Aa0Aac76eaA989CA193D03b132358960`
- Collection Implementation: `0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0`
- SubscriptionNFT: `0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e`
- Marketplace: `0xCE4274c33dB9E32926120E7497d67E4335024a38`
- FactoryV2: `0xe90335369A7cdD7570EF99988DB3ADce85D89055`

#### Documentation

- Created comprehensive README with setup instructions
- Added detailed deployment guide covering all components
- Documented technical architecture in ARCHITECTURE.md
- Maintained changelog for version tracking

---

## [2.5.0] - March 15, 2026

### 🔗 Chainlink CCIP Integration Complete

#### Added

**Cross-Chain Infrastructure:**
- Full Chainlink CCIP integration for cross-chain NFT purchases
- Royalty distribution workflow using Chainlink CRE
- Multi-chain support configuration in hardhat.config.js
- CCIP sender contract for Ethereum Sepolia
- Message replay protection for security

**Documentation:**
- CCIP_INTEGRATION_GUIDE.md - Step-by-step implementation guide
- CHAINLINK_INTEGRATION_COMPLETE.md - Implementation summary
- DEPLOYMENT_CHECKLIST.md - CCIP deployment checklist

**CRE Workflows:**
- `/cre-workflows/royalty-distribution/main.ts` - Automated royalty splitting
- Configuration templates for CRE deployment
- Simulation and deployment scripts

#### Features

**Cross-Chain Purchase Flow:**
```
Ethereum Sepolia → CCIP Network → Base Sepolia → Marketplace → CRE Workflow
(Initiate)        (Verify)       (Receive)      (Execute)    (Distribute)
```

**Royalty Distribution:**
- Automatic fee calculation based on subscription tier
- Cross-chain payment distribution to recipients
- Webhook alerts for failed payments
- Comprehensive logging and monitoring

#### Technical Specifications

**Supported Chains:**
- Base Sepolia (Destination) - Chain Selector: `10344971235874465080`
- Ethereum Sepolia (Source) - Chain Selector: `16015289601813375307`
- Polygon Amoy (Ready to enable) - Chain Selector: `16281711391670634445`
- Arbitrum Sepolia (Ready to enable)

**Gas Costs (Testnet):**
- CCIP message fee: ~0.001 LINK
- Base Sepolia gas: ~0.0001 ETH
- Total per cross-chain purchase: ~$0.10-0.50

---

## [2.4.0] - March 10, 2026

### 🏪 Commerce Infrastructure Deployment

#### Added

**Commerce Contracts:**
- MerchantRegistry with verification workflows
- EscrowManager with time-lock mechanisms
- RedemptionManager with soulbound conversion
- Enhanced NFTFactory with commerce integration

**Deployment Scripts:**
- `04-deploy-commerce-infrastructure.js` - Automated commerce deployment
- Verification scripts for BaseScan

**Testing:**
- Comprehensive test coverage for all commerce features
- Gas reporting and optimization analysis

#### Features

**Merchant Verification:**
- 3-step onboarding process
- Trust score calculation (0-1000)
- Badge levels: UNVERIFIED, VERIFIED, PREMIUM
- Document submission and review

**Escrow System:**
- Configurable time-lock periods
- Automatic release after timeout
- Dispute resolution mechanism
- Emergency withdrawal functions

**Redemption Flow:**
```
PENDING → ACCEPTED → USER_CONFIRMED → COMPLETED
   ↓          ↓            ↓              ↓
Request  Merchant     Buyer         Burn NFT &
        Fulfills    Confirms    Create Soulbound
```

#### Documentation

- DEPLOYMENT_GUIDE_COMMERCE.md - Commerce deployment instructions
- PROJECT_ARCHITECTURE_LOG.md - Detailed architecture documentation
- REFACTOR_REPORT.md - Refactoring summary

---

## [2.3.0] - March 5, 2026

### ⬆️ V3 Architecture Implementation

#### Added

**Tier-Certified System:**
- Subscription-based NFT creation with validation
- Product class validation against organization tier
- Quota enforcement per subscription tier
- Dynamic fees based on seller subscription

**Marketplace Features:**
- Tier-based filtering (Coal, Bronze, Silver, Gold, Platinum)
- Dynamic fee calculation
- Enhanced analytics and tracking

**Contracts:**
- FactoryV2 with subscription integration
- SimpleCollectibleV2 with tier metadata
- Marketplace with tier-certified trading

#### Architecture Changes

**Before (v1-v2):**
```
Client ↔ Server ↔ Factory ↔ SimpleCollectible
```

**After (v3):**
```
Client ↔ Server ↔ FactoryV2 ↔ SimpleCollectibleV2
                   ↕
            SubscriptionNFT ← Marketplace
```

#### Deployment Status

All contracts deployed and verified on Base Sepolia:
- SubscriptionNFT Proxy: `0xd06Ee9B51be61D913315CD0e22D06bE787c5cbe5`
- FactoryV2 Proxy: `0xe90335369A7cdD7570EF99988DB3ADce85D89055`
- SimpleCollectibleV2: `0x545874d3c81699C4Da951c91801f9D9C166cF368`
- Marketplace: `0xCE4274c33dB9E32926120E7497d67E4335024a38`

#### Documentation

- V3_ARCHITECTURE_SUMMARY.md - V3 architecture overview
- Updated deployment guides with new addresses

---

## [2.2.0] - February 28, 2026

### 🚀 Vercel Deployment & Wallet Fixes

#### Added

**Wallet Connection:**
- Native Coinbase Wallet support with wagmi v2
- Explicit Base network configuration
- Improved connect wallet button implementation

**Deployment Guides:**
- COMPLETE_VERCEL_DEPLOYMENT_GUIDE.md - Comprehensive Vercel instructions
- VERCEL_DEPLOYMENT_GUIDE.md - Client-specific deployment
- WALLET_FIX_SUMMARY.md - Wallet connection fix documentation

#### Fixed

**Wallet Connection Issues:**
- ✅ "Connect Wallet" button not triggering wallet popup
- ✅ Empty connect buttons on merchant pages
- ✅ Coinbase Wallet / Base wallet compatibility
- ✅ Network switching to Base Sepolia

**Build Warnings:**
- Addressed TypeScript compilation issues
- Handled MetaMask SDK optional dependencies
- Fixed import stubs for build compatibility

#### Technical Changes

**Migration to wagmi v2:**
```typescript
// Old (wagmi v1):
usePrepareContractWrite + useContractWrite

// New (wagmi v2):
useWriteContract
```

**Updated Dependencies:**
- wagmi: 1.3.10 → 2.12.0
- viem: 1.6.7 → 2.21.0
- Added @tanstack/react-query v5
- Removed @web3modal packages

---

## [2.1.0] - February 20, 2026

### 🔧 Refactoring & Base Sepolia Deployment

#### Added

**Upgradeable Contracts:**
- UUPS proxy pattern implementation
- OpenZeppelin upgradeable contracts
- ProxyAdmin for upgrade management

**Security Features:**
- ReentrancyGuard protection
- Pausable mechanisms
- Ownable access control
- Comprehensive input validation

**Testing Infrastructure:**
- Factory.test.js - 138 lines of tests
- SimpleCollectible.test.js - 326 lines of tests
- Gas reporting configuration
- Coverage analysis

#### Changed

**Complete Contract Rewrites:**
- Factory.sol → Modern upgradeable pattern
- SimpleCollectible.sol → EIP-2981 royalties + security hardening

**Configuration Updates:**
- Base Sepolia network in hardhat.config.js
- Environment variable templates
- Contract ABI updates in client

#### Fixed

**Security Issues:**
- Custom owner pattern replaced with OwnableUpgradeable
- Missing reentrancy protection added
- Storage inefficiencies optimized
- Event system enhanced for tracking

#### Documentation

- REFACTOR_REPORT.md - Comprehensive refactoring summary
- DEPLOYMENT_GUIDE.md - Base Sepolia deployment instructions
- CONTRACT_ADDRESSES_UPDATED.md - Address tracking

---

## [2.0.0] - February 10, 2026

### ⚡ Upgradeable Contracts & Base Network

#### Added

**Proxy Pattern:**
- UUPS upgradeable contracts
- Separation of proxy and implementation
- Upgrade authorization mechanisms

**Base Network Support:**
- Base Sepolia testnet deployment
- Alchemy RPC integration
- BaseScan verification

**EIP-2981 Compliance:**
- Royalty standard implementation
- Custom per-token royalties (0-50%)
- Platform fee configuration (2.5% default)

#### Features

**Platform Fee System:**
- Recipient: `0xc318466b329385d08a63894ceA20ee285D7e0840`
- Default: 2.5% (250 basis points)
- Maximum: 10% (enforced)
- MSME range: 0%-50% per collection

**Enhanced Events:**
```solidity
event CollectionDeployed(
    address indexed collection,
    address indexed creator,
    string name,
    uint256 timestamp
);

event RoyaltyConfigured(
    uint256 tokenId,
    address recipient,
    uint256 percent
);
```

#### Technical Improvements

**Gas Optimization:**
- Factory deployment: ~3,500,000 gas
- Collection deployment: ~2,800,000 gas
- Mint NFT: ~120,000 gas
- Redeem initiate: ~85,000 gas

**Security Hardening:**
- OpenZeppelin standards adoption
- Access control enforcement
- Emergency pause functionality
- Reentrancy protection

---

## [1.5.0] - January 25, 2026

### 🎨 Admin Panel & Launchpad

#### Added

**Admin Frontend:**
- React + Vite admin dashboard
- User management interface
- Submission approval workflow
- Analytics dashboard

**Admin Backend:**
- TypeScript Node.js service
- JWT authentication
- Role-based access control
- Bull Queue for background jobs

**Launchpad Platform:**
- Application system for new projects
- Onboarding workflow
- Review and approval processes
- Designer assignment system

#### Features

**Admin Roles:**
- SUPER_ADMIN - Full platform access
- ADMIN - User and submission management
- DESIGNER - Design operations
- OPS - Operational tasks

**Submission Workflow:**
```
PENDING → APPROVED → READY_FOR_MINT → MINTED
   ↓          ↓             ↓            ↓
Review   Approved    Upload Artwork  Deploy
                                 & Generate Metadata
```

**Automated Minting:**
- Background worker polling
- Automatic IPFS upload
- Metadata generation
- On-chain deployment tracking

---

## [1.0.0] - January 10, 2026

### 🎉 Initial Release

#### Added

**Core Functionality:**
- Basic NFT factory contract
- Simple collectible implementation
- Minting and redemption capabilities
- Web2 backend infrastructure

**Frontend:**
- Next.js client application
- WalletConnect integration
- NFT marketplace UI
- Dashboard for creators

**Backend:**
- Node.js + Express API server
- MongoDB database integration
- JWT authentication
- IPFS integration (Pinata)

**Smart Contracts:**
- Factory.sol - Basic factory pattern
- SimpleCollectible.sol - ERC-721 NFT
- SubscriptionNFT.sol - Early subscription concept

#### Features

**NFT Creation:**
- Collection deployment
- Batch minting support
- Token URI management
- Creator royalties

**Redemption System:**
- Physical asset redemption
- Digital delivery options
- Escrow protection
- Dispute resolution

**User Management:**
- Email/password authentication
- Wallet-based authentication
- Business profiles
- Trust score system

#### Technical Stack

**Frontend:**
- Next.js 13.4.12
- Tailwind CSS
- Redux Toolkit
- Web3Modal v2

**Backend:**
- Node.js 18+
- Express.js 4.x
- MongoDB Atlas
- Mongoose ODM

**Blockchain:**
- Solidity 0.8.19
- Hardhat development environment
- OpenZeppelin contracts
- Gnosis Chain (initial deployment)

#### Known Issues

- Wallet connection limited to MetaMask
- No upgrade capability for contracts
- Limited cross-chain functionality
- Basic royalty implementation

---

## [Unreleased]

### Planned Features

#### Q2 2026
- [ ] Mainnet deployment on Base
- [ ] Multi-signature wallet integration
- [ ] Governance token launch
- [ ] DAO implementation

#### Q3 2026
- [ ] Mobile application (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Social features and community tools
- [ ] Enhanced CCIP integrations (more chains)

#### Future Considerations
- [ ] Layer 2 scaling solutions (Optimism, zkSync)
- [ ] Cross-chain NFT bridging
- [ ] Fractional NFT ownership
- [ ] Auction and bidding mechanisms
- [ ] Integration with external marketplaces

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible changes
- **MINOR** version for backwards-compatible features
- **PATCH** version for backwards-compatible bug fixes

**Format:** MAJOR.MINOR.PATCH (e.g., 3.0.0)

---

## Contributing

When contributing, please:
1. Update this changelog with your changes
2. Use clear and descriptive language
3. Categorize changes (Added, Changed, Fixed, etc.)
4. Include relevant technical details
5. Link to related issues or PRs if applicable

---

**Maintained By:** Zeus Labs Engineering Team  
**Contact:** abimbola.zeuslabs@gmail.com  
**Last Updated:** March 23, 2026
