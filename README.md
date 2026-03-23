# NFT Factory - Web3 Commerce Infrastructure Platform

## Welcome to the NFT Factory Web3 Commerce Platform by Zeus Labs

<p align="center" width="100%">
  <img src="https://github.com/BukiOffor/Nft-assets/assets/58889001/7605392b-51ae-4e2d-825d-4fae2acbcec0" alt="site"/>
</p>

> **A comprehensive Web3 commerce infrastructure platform designed for Micro, Small, and Medium Enterprises (MSMEs) to create digital products, manage inventory, process secure transactions, and build trust through blockchain verification.**

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Installation](#installation)
- [Smart Contracts](#smart-contracts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)

---

## Overview

NFT Factory has evolved into a comprehensive Web3 Commerce Infrastructure platform designed specifically for Micro, Small, and Medium Enterprises (MSMEs). This platform transforms traditional business models by enabling merchants to:

- Create and manage NFT collections with physical/digital redemption
- Process secure transactions with built-in escrow protection
- Build trust through merchant verification and reputation scoring
- Accept subscription-based access with tiered privileges
- Trade NFTs in a multi-chain marketplace with automated royalty distribution

**Built on Base network** with advanced features including Chainlink CCIP for cross-chain interoperability, upgradeable smart contract architecture, and comprehensive merchant tools.

---

## Core Features

### Web3 Commerce Infrastructure
- ✅ Complete merchant dashboard with analytics and inventory management
- ✅ Advanced escrow system for buyer protection with time-lock mechanisms
- ✅ Redemption mechanisms with burn-to-soulbound conversion
- ✅ Merchant verification and trust scoring system
- ✅ Multi-tier subscription model (Coal, Bronze, Silver, Gold, Platinum)
- ✅ Cross-chain NFT purchases via Chainlink CCIP
- ✅ Automated royalty distribution with CRE workflows

### Merchant-Centric Features
- ✅ 3-step merchant onboarding process
- ✅ Verified merchant badge system
- ✅ Trust score and reputation management
- ✅ Digital product creation and management
- ✅ Order tracking and fulfillment
- ✅ Customer review and rating system
- ✅ Analytics dashboard for business insights

### Advanced Commerce Infrastructure
- ✅ Smart contract-based payment processing
- ✅ Multi-currency support (ETH, BASE, stablecoins like USDC)
- ✅ Time-lock escrow mechanisms for buyer protection
- ✅ Dispute resolution system
- ✅ Automated fee distribution based on subscription tiers
- ✅ Integration with Chainlink oracles and CCIP

### Modular Smart Contract Architecture
- **MerchantRegistry.sol** - Merchant verification and trust scoring
- **EscrowManager.sol** - Time-lock escrow for buyer protection
- **RedemptionManager.sol** - Advanced redemption with burn-to-soulbound
- **NFTFactory.sol** - Enhanced factory with commerce integration
- **Marketplace.sol** - Tier-certified NFT marketplace with dynamic fees
- **SubscriptionNFT.sol** - Soulbound NFT representing subscription tiers
- **FactoryV2.sol** - Upgraded factory with tier-certified deployment
- **SimpleCollectibleV2.sol** - Enhanced collectible with metadata encoding
- **CCIPNFTReceiver.sol** - Cross-chain NFT purchase receiver
- ✅ Upgradeable UUPS proxy pattern for all contracts

### Comprehensive Testing & Security
- ✅ Extensive unit test coverage for all commerce features
- ✅ Security audits for smart contracts
- ✅ Reentrancy protection and access control
- ✅ Pausable mechanisms for emergency situations
- ✅ Upgrade authorization with multi-signature support

---

## Technologies

| Technology | Usage |
|------------|-------|
| **Solidity 0.8.19+** | Smart contracts with OpenZeppelin upgradeable patterns |
| **Next.js 14** | Client frontend with App Router |
| **React 18 + Vite** | Admin panel frontend |
| **TypeScript** | Type-safe admin backend |
| **Node.js + Express** | Backend API services |
| **Hardhat** | Smart contract development and deployment |
| **OpenZeppelin** | Security standards and upgradeability |
| **MongoDB + Mongoose** | Database for off-chain data |
| **IPFS (Pinata)** | Decentralized storage for NFT metadata |
| **Chainlink CCIP** | Cross-chain interoperability |
| **Chainlink CRE** | Automated off-chain workflows |
| **wagmi v2 + Viem** | React hooks for Ethereum interactions |
| **WalletConnect** | Multi-wallet integration |

---

## Project Structure

```
NFT-Factory/
├── client/                 # Main Next.js frontend (Base Sepolia NFT marketplace)
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── providers/     # Context providers (Web3, Redux)
│   │   └── utils/         # Utility functions
│   ├── constants/         # Contract ABIs and addresses
│   └── public/            # Static assets
│
├── core/                  # Smart contracts and blockchain infrastructure
│   ├── contracts/         # Solidity smart contracts
│   ├── deploy/            # Deployment scripts
│   ├── test/              # Contract tests
│   └── utils/             # Verification utilities
│
├── server/                # Main backend server (Node.js + Express)
│   ├── controller/        # Business logic controllers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # External service integrations
│   └── repository/        # Data access layer
│
├── admin-frontend/        # Admin dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/         # Admin pages
│   │   ├── components/    # UI components
│   │   └── hooks/         # Custom React hooks
│   └── dist/              # Production build
│
├── admin-backend/         # Admin API service (TypeScript + Node.js)
│   ├── src/
│   │   ├── controllers/   # Admin business logic
│   │   ├── models/        # Database models
│   │   ├── routes/        # Admin API routes
│   │   └── workers/       # Background job processors
│   └── dist/              # Compiled TypeScript
│
├── cre-workflows/         # Chainlink Runtime Environment workflows
│   └── royalty-distribution/  # Automated royalty distribution
│
└── docs/                  # Documentation
    ├── DEPLOYMENT_GUIDE.md
    ├── ARCHITECTURE.md
    └── CHANGELOG.md
```

---

## Quick Start

### Prerequisites
Before you begin, ensure you have:
- Node.js v18+ installed
- npm or yarn package manager
- MetaMask or Coinbase Wallet extension
- Base Sepolia testnet ETH (from [faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))

### 1. Clone the Repository

```bash
git clone https://github.com/MadefromLight/NFT-Factory.git
cd NFT-Factory
git checkout v3-architecture  # Latest stable branch
```

### 2. Install Dependencies

Install dependencies for all components:

```bash
# Install core dependencies
npm install

# Install client dependencies
cd client
npm install --legacy-peer-deps

# Install core contracts
cd ../core
npm install

# Install server dependencies
cd ../server
npm install

# Install admin frontend dependencies
cd ../admin-frontend
npm install

# Install admin backend dependencies
cd ../admin-backend
npm install
```

### 3. Configure Environment Variables

Create `.env` files for each component:

**Client (.env.local):**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_FACTORY_PROXY_ADDRESS=0x211C3c71Aa0Aac76eaA989CA193D03b132358960
NEXT_PUBLIC_COLLECTION_IMPLEMENTATION=0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0
NEXT_PUBLIC_SUBSCRIPTION_NFT=0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e
```

**Core (.env):**
```env
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_key
BASESCAN_API_KEY=your_basescan_key
ETHERSCAN_API_KEY=your_etherscan_key
```

**Server (.env):**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

Refer to `.env.example` files in each directory for templates.

### 4. Start Development Servers

Start each service in separate terminals:

```bash
# Terminal 1: Client Frontend
cd client
npm run dev

# Terminal 2: Server Backend
cd server
npm run dev

# Terminal 3: Admin Frontend
cd admin-frontend
npm run dev

# Terminal 4: Admin Backend
cd admin-backend
npm run dev
```

The application will be available at:
- Client: http://localhost:3000
- Admin Frontend: http://localhost:5173
- Server API: http://localhost:3001
- Admin Backend: http://localhost:3002

---

## Requirements

### System Requirements
- **Node.js**: v18 or higher
- **npm/yarn**: Latest stable version
- **Git**: For version control
- **MongoDB**: Atlas cloud database or local instance

### Blockchain Requirements
- **Wallet**: MetaMask or Coinbase Wallet extension
- **Network**: Base Sepolia testnet configured
- **Test Tokens**: 
  - ETH from [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
  - LINK from [Chainlink Faucet](https://faucets.chain.link/base-sepolia)

### API Keys Needed
- **Alchemy API Key**: [Get here](https://alchemy.com/)
- **WalletConnect Project ID**: [Get here](https://walletconnect.org/)
- **BaseScan API Key**: [Get here](https://basescan.io/)
- **Pinata API Key**: [Get here](https://pinata.cloud/) (for IPFS)
- **MongoDB Atlas**: [Get here](https://mongodb.com/cloud/atlas)

---

## Installation

### Detailed Installation Steps

#### 1. Client Frontend Setup

```bash
cd client
npm install --legacy-peer-deps

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

#### 2. Smart Contracts Setup

```bash
cd core
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your private key and API keys
```

#### 3. Server Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Configure MongoDB and JWT settings
```

#### 4. Admin Panel Setup

```bash
# Admin Frontend
cd admin-frontend
npm install

# Admin Backend
cd admin-backend
npm install
```

---

## Smart Contracts

### Deployed Contract Addresses (Base Sepolia)

All contracts are deployed and verified on Base Sepolia testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| **Factory Proxy** | `0x211C3c71Aa0Aac76eaA989CA193D03b132358960` | Main factory for deploying NFT collections |
| **Collection Implementation** | `0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0` | SimpleCollectibleV2 implementation |
| **SubscriptionNFT** | `0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e` | Subscription system for merchants |
| **Marketplace** | `0xCE4274c33dB9E32926120E7497d67E4335024a38` | Tier-certified NFT marketplace |
| **FactoryV2** | `0xe90335369A7cdD7570EF99988DB3ADce85D89055` | Upgraded factory with subscription validation |

**Explorer**: https://sepolia.basescan.org/

### Contract Architecture

The platform uses a modular, upgradeable architecture:

```
┌─────────────────┐
│  Factory Proxy  │ → Deploys collection proxies
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FactoryV2 Impl  │ → Validates subscriptions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Collection      │ → ERC-721 NFT with redemption
│ Proxy (per col) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SimpleCollect-  │ → NFT implementation
│ ibleV2 Impl     │
└─────────────────┘
```

### Key Smart Contracts

1. **FactoryV2.sol**: Deploys tier-certified NFT collections with subscription validation
2. **SimpleCollectibleV2.sol**: Upgradeable ERC-721 with EIP-2981 royalties and redemption
3. **SubscriptionNFT.sol**: Soulbound NFTs representing subscription tiers and minting rights
4. **Marketplace.sol**: Dynamic fee marketplace with tier-based filtering
5. **MerchantRegistry.sol**: Merchant verification and trust scoring
6. **EscrowManager.sol**: Time-lock escrow for secure transactions
7. **RedemptionManager.sol**: Physical/digital asset redemption with soulbound conversion
8. **CCIPNFTReceiver.sol**: Cross-chain NFT purchase handler via Chainlink CCIP

---

## Testing

### Smart Contract Testing

```bash
cd core

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/Factory.test.js

# Generate gas report
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage --network localhost
```

### Running Tests for New Contracts

The enhanced platform includes tests for all commerce features:

- **Factory.test.js**: Factory deployment and collection creation
- **SimpleCollectible.test.js**: Minting, redemption, royalties
- **MerchantRegistry.test.js**: Merchant verification workflows
- **EscrowManager.test.js**: Escrow creation and release
- **RedemptionManager.test.js**: Redemption lifecycle
- **SubscriptionNFT.test.js**: Subscription tiers and quotas

---

## Deployment

### Deploy Smart Contracts

1. **Compile contracts**:
```bash
cd core
npx hardhat compile
```

2. **Deploy to Base Sepolia**:
```bash
npx hardhat run deploy/01-deploy-factory.js --network baseSepolia
```

3. **Verify contracts on BaseScan**:
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Deploy Frontend to Vercel

#### Option 1: Vercel CLI

```bash
cd client
npm install -g vercel
vercel login
vercel --prod
```

#### Option 2: GitHub Integration

1. Push code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin v3-architecture
```

2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import Git Repository: `MadefromLight/NFT-Factory`
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `client`
   - Build Command: `npm run build`
5. Add environment variables (see `.env.local.example`)
6. Click Deploy

### Deploy Backend Services

#### Server Backend

Deploy to Vercel, Railway, or Heroku:

```bash
# Vercel
cd server
vercel --prod

# Railway
railway up
```

#### Admin Panel

Deploy both frontend and backend separately:

```bash
# Admin Frontend (Vercel/Netlify)
cd admin-frontend
vercel --prod

# Admin Backend (Railway/Heroku)
cd admin-backend
railway up
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)

---

## Contributing

We welcome contributions! Here's how you can help:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure linting passes (`npm run lint`)

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community

---

## Support

### Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Detailed system architecture
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [Changelog](./docs/CHANGELOG.md) - Version history and updates

### Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/MadefromLight/NFT-Factory/issues)
- **Discord**: [Chainlink Community](https://discord.gg/chainlink)
- **Email**: abimbola.zeuslabs@gmail.com

### Resources

- [Base Documentation](https://docs.base.org)
- [Chainlink CCIP Docs](https://docs.chain.link/ccip)
- [wagmi Documentation](https://wagmi.sh)
- [Next.js Documentation](https://nextjs.org/docs)

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

Special thanks to:
- The Zeus Labs team for initial development
- All contributors who have enhanced the platform
- The Base and Chainlink communities for support

---

**Version**: 3.0.0  
**Last Updated**: March 23, 2026  
**Status**: Production Ready ✅
