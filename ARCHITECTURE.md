# NFT Factory - Technical Architecture Documentation

## Comprehensive system architecture and design documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Smart Contract Architecture](#smart-contract-architecture)
6. [Database Design](#database-design)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Key Features Implementation](#key-features-implementation)
10. [Upgrade History](#upgrade-history)

---

## System Overview

The NFT Factory is a comprehensive Web3 commerce infrastructure platform enabling businesses to create, manage, and trade NFTs with physical/digital redemption capabilities. The platform uses a microservices architecture with blockchain integration.

### Core Components

1. **Client Frontend** (Next.js 14)
   - User-facing interface for creators and collectors
   - Wallet integration and blockchain interactions
   - Marketplace and collection management

2. **Admin Frontend** (React 18 + Vite)
   - Administrative dashboard
   - User and submission management
   - Analytics and monitoring

3. **Server Backend** (Node.js + Express)
   - Primary API server
   - Business profile management
   - Marketplace operations
   - IPFS integration

4. **Admin Backend** (TypeScript + Node.js)
   - Administrative APIs
   - Automated minting worker
   - Submission review system

5. **Smart Contracts** (Solidity 0.8.19+)
   - Deployed on Base Sepolia
   - Upgradeable UUPS proxy pattern
   - Modular commerce infrastructure

6. **Database** (MongoDB + Mongoose)
   - User profiles and submissions
   - Sales analytics and redemptions
   - Audit logs

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Creators   │  │ Collectors   │  │  Admins      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          │ HTTP/WebSocket  │ HTTP/WebSocket  │ HTTP/WebSocket
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────────┐
│                    LOAD BALANCER / CDN                          │
│                         (Vercel Edge)                           │
└─────────┬─────────────────┬─────────────────┬──────────────────┘
          │                 │                 │
    ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
    │  Client   │   │   Admin     │   │  Public   │
    │ Frontend  │   │  Frontend   │   │   Assets  │
    │ (Next.js) │   │(React/Vite) │   │           │
    └─────┬─────┘   └──────┬──────┘   └───────────┘
          │                │
          │ REST API       │ REST API
          │                │
    ┌─────▼────────────────▼─────┐
    │     API Gateway Layer      │
    │  (Express.js Middleware)   │
    └─────┬──────────────────────┬──────────────────────────────┐
          │                      │                              │
    ┌─────▼─────┐         ┌──────▼──────┐              ┌───────▼───────┐
    │  Server   │         │   Admin     │              │  Blockchain   │
    │  Backend  │         │  Backend    │              │   Interface   │
    │ (Node.js) │         │ (TypeScript)│              │   (wagmi)     │
    └─────┬─────┘         └──────┬──────┘              └───────┬───────┘
          │                      │                             │
          │ Database Ops         │ Background Jobs             │ RPC Calls
          │                      │                             │
    ┌─────▼──────────────────────▼─────────────────────────────▼───────┐
    │                     DATA LAYER                                   │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
    │  │   MongoDB    │  │    IPFS      │  │   Base       │          │
    │  │   Atlas      │  │  (Pinata)    │  │  Blockchain  │          │
    │  └──────────────┘  └──────────────┘  └──────────────┘          │
    └──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Client Frontend (/client)

**Technology Stack:**
- Next.js 14 with App Router
- Tailwind CSS for styling
- Redux Toolkit for state management
- wagmi v2 + Viem for blockchain interactions
- WalletConnect for wallet integration

**Directory Structure:**
```
client/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── marketplace/       # NFT marketplace
│   │   ├── launchpad/         # Collection creation
│   │   └── merchant/          # Merchant features
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI components
│   │   ├── wallet/            # Wallet connection components
│   │   └── nft/               # NFT-specific components
│   ├── providers/             # Context providers
│   │   ├── Web3Provider.jsx   # Blockchain provider
│   │   └── StoreProvider.jsx  # Redux provider
│   └── utils/                 # Utility functions
├── constants/                 # Contract ABIs and addresses
├── public/                    # Static assets
└── package.json
```

**Key Features:**
- Server-side rendering for SEO optimization
- Static site generation for performance
- Client-side hydration for interactivity
- Image optimization with Next.js Image
- API routes for backend communication

**State Management:**
```typescript
// Redux store structure
{
  user: {
    walletAddress: string,
    profile: UserProfile,
    preferences: UserPreferences
  },
  nft: {
    collections: Collection[],
    ownedNFTs: NFT[],
    listings: Listing[]
  },
  ui: {
    theme: 'light' | 'dark',
    loading: boolean,
    notifications: Notification[]
  }
}
```

### Admin Frontend (/admin-frontend)

**Technology Stack:**
- React 18 with Vite
- TypeScript for type safety
- Tailwind CSS
- Axios for API calls

**Directory Structure:**
```
admin-frontend/
├── src/
│   ├── pages/                 # Admin pages
│   │   ├── LoginPage.jsx     # Admin authentication
│   │   ├── DashboardPage.jsx # Admin dashboard
│   │   ├── UserManagementPage.jsx
│   │   └── SubmissionReviewPage.jsx
│   ├── components/            # UI components
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
└── package.json
```

**Features:**
- Role-based access control (SUPER_ADMIN, ADMIN, DESIGNER, OPS)
- Real-time submission status tracking
- Analytics dashboard with charts
- User approval workflows

---

## Backend Architecture

### Server Backend (/server)

**Technology Stack:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- IPFS integration (Pinata)
- Web3.js for blockchain interactions

**Architecture Pattern:**
```
Routes → Controllers → Services → Repository → Database
                ↓
            Middleware (Auth, Validation, Logging)
```

**Directory Structure:**
```
server/
├── index.js                   # Application entry point
├── controller/                # Business logic
│   ├── account_controller.js
│   ├── contract_controller.js
│   ├── launch_pad_controller.js
│   ├── marketplace_controller.js
│   └── submission_controller.js
├── models/                    # MongoDB schemas
│   ├── account_model.js
│   ├── business_profile_model.js
│   ├── submission_model.js
│   ├── nft_sale_model.js
│   └── redemption_model.js
├── repository/                # Data access layer
│   ├── account_repository.js
│   └── ... 
├── routes/                    # API routes
│   ├── account_routes.js
│   └── ...
├── services/                  # External services
│   ├── ipfs_service.js
│   └── blockchain_service.js
└── utils/                     # Utilities
    ├── jwt_utils.js
    └── validation_utils.js
```

**Key Endpoints:**
```javascript
// Account Management
POST   /api/accounts/register
POST   /api/accounts/login
GET    /api/accounts/profile/:walletAddress

// Submissions
POST   /api/submissions/create
GET    /api/submissions/business/:walletAddress
PUT    /api/submissions/:id/update

// Marketplace
GET    /api/marketplace/listings
POST   /api/marketplace/list
GET    /api/marketplace/analytics

// Launch Pad
POST   /api/launchpad/apply
GET    /api/launchpad/applications
```

### Admin Backend (/admin-backend)

**Technology Stack:**
- TypeScript
- Node.js + Express.js
- MongoDB + Mongoose
- Bull Queue for background jobs
- JWT authentication

**Directory Structure:**
```
admin-backend/
├── src/
│   ├── index.ts              # Application entry
│   ├── controllers/          # Admin business logic
│   │   ├── adminController.ts
│   │   └── submissionController.ts
│   ├── models/               # Database models
│   │   ├── AdminUser.ts
│   │   └── Submission.ts
│   ├── routes/               # API routes
│   │   └── adminRoutes.ts
│   ├── middleware/           # Express middleware
│   │   └── authMiddleware.ts
│   ├── services/             # Business services
│   │   └── mintingService.ts
│   └── workers/              # Background workers
│       └── mintingWorker.ts
└── package.json
```

**Background Workers:**
```typescript
// Minting Worker Process
1. Poll for READY_FOR_MINT submissions
2. Validate submission data
3. Call FactoryV2.deployCollection()
4. Track transaction on-chain
5. Update submission status to MINTED
6. Notify user via webhook/email
```

---

## Smart Contract Architecture

### Overview

The smart contract system is built on Base Sepolia using Solidity 0.8.19+ with OpenZeppelin's upgradeable contracts following the UUPS (Universal Upgradeable Proxy Standard) pattern.

### Contract Hierarchy

```
┌─────────────────────────────────────────────────────┐
│              PLATFORM OWNER                        │
│         (Multi-sig / DAO)                          │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Factory Proxy  │ ← UUPS Proxy
        │  (Owner)        │
        └────────┬────────┘
                 │ delegates to
        ┌────────▼────────┐
        │ FactoryV2 Impl  │ ← Implementation
        └────────┬────────┘
                 │ deploys
        ┌────────▼────────┐
        │ Collection      │ ← UUPS Proxy (per collection)
        │ Proxy           │
        └────────┬────────┘
                 │ delegates to
        ┌────────▼────────┐
        │ SimpleCollect-  │ ← Implementation
        │ ibleV2 Impl     │
        └─────────────────┘
```

### Core Contracts

#### 1. FactoryV2.sol

**Purpose**: Deploys tier-certified NFT collections with subscription validation

**Key Features:**
- SubscriptionNFT integration for validation
- Tier and product class validation
- Dynamic fee calculation based on subscription
- Quota enforcement per subscription tier
- UUPS upgradeable pattern

**Main Functions:**
```solidity
function deployCollection(
    string memory name,
    string memory symbol,
    string[] memory tokenURIs,
    uint256[] memory prices,
    uint8 productClass,
    uint256 royaltyPercent
) external returns (address);

function getCollectionByCreator(address creator, uint256 index) 
    external view returns (address);

function updatePlatformFee(uint256 newFee) external onlyOwner;
```

**Events:**
```solidity
event CollectionDeployed(
    address indexed collection,
    address indexed creator,
    string name,
    uint256 timestamp
);
event PlatformFeeUpdated(uint256 newFee);
```

#### 2. SimpleCollectibleV2.sol

**Purpose**: Upgradeable ERC-721 NFT with redemption capabilities

**Key Features:**
- EIP-2981 royalty standard compliance
- Physical/digital asset redemption
- Escrow functionality
- Burn-to-soulbound conversion
- Tier/class metadata encoding

**Metadata Structure:**
```solidity
struct TokenMetadata {
    uint8 organizationTier;  // Creator's subscription tier
    uint8 productClass;      // Product classification
    bool redeemable;         // Can be redeemed for physical item
    uint256 redemptionDeadline;
}
```

**Redemption Flow:**
```
1. User initiates redemption
2. NFT locked in escrow
3. Merchant fulfills order
4. Buyer confirms receipt
5. NFT released OR burned for soulbound
```

#### 3. SubscriptionNFT.sol

**Purpose**: Soulbound NFT representing subscription tiers and minting rights

**Tier System:**
```solidity
enum Tier {
    COAL,       // Quota: 10 NFTs
    BRONZE,     // Quota: 50 NFTs
    SILVER,     // Quota: 120 NFTs
    GOLD,       // Quota: 300 NFTs
    PLATINUM    // Quota: 1000 NFTs
}
```

**Features:**
- Non-transferable (soulbound)
- Quota-based minting allowance
- Dynamic pricing with randomization
- USDC payment integration
- Verification status management

**Functions:**
```solidity
function purchaseSubscription(uint8 tier) external payable;
function getMintingQuota(address subscriber) external view returns (uint256);
function verifySubscriber(address subscriber, bool status) external;
```

#### 4. Marketplace.sol

**Purpose**: Tier-certified NFT marketplace with dynamic fees

**Features:**
- Dynamic fee calculation based on seller tier
- Tier-based filtering
- Integrated royalty distribution
- Cross-chain purchase support (CCIP)

**Fee Structure:**
```solidity
// Platform fees by tier
Coal: 5%
Bronze: 4.5%
Silver: 4%
Gold: 3.5%
Platinum: 3%
```

**Functions:**
```solidity
function listNFT(
    address nftContract,
    uint256 tokenId,
    uint256 price
) external;

function executePurchase(
    address nftContract,
    uint256 tokenId
) external payable;

function executeCrossChainPurchase(
    address buyer,
    address nftContract,
    uint256 tokenId,
    uint256 amount
) external payable;
```

#### 5. Commerce Infrastructure

**MerchantRegistry.sol:**
- Merchant verification system
- Trust score calculation
- Badge levels (UNVERIFIED, VERIFIED, PREMIUM)
- Document submission and review

**EscrowManager.sol:**
- Time-lock escrow for buyer protection
- Configurable lock periods (default: 7 days)
- Automatic release after timeout
- Dispute resolution mechanism

**RedemptionManager.sol:**
- Multi-stage redemption workflow
- Physical/digital delivery options
- Soulbound token creation on burn
- Proof of redemption tracking

#### 6. CCIP Integration

**CCIPNFTReceiver.sol:**
- Handles cross-chain messages via Chainlink CCIP
- Message replay protection
- Supports ETH and ERC20 payments
- Forwards to Marketplace for execution

**Cross-Chain Flow:**
```
Ethereum Sepolia (Source)
    ↓ sends ETH + CCIP message
CCIP Network (Chainlink DON)
    ↓ verified message + tokens
Base Sepolia (Destination)
    ↓ CCIPNFTReceiver receives
Marketplace executes purchase
    ↓ triggers CRE workflow
CRE distributes royalties
```

---

## Database Design

### MongoDB Collections

#### 1. Accounts Collection

```typescript
interface Account {
  _id: ObjectId;
  email: string;
  walletAddress: string;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
{ email: 1, unique: true }
{ walletAddress: 1, unique: true }
```

#### 2. Business Profiles Collection

```typescript
interface BusinessProfile {
  _id: ObjectId;
  ownerWallet: string;
  businessName: string;
  businessType: string;
  description: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    instagram?: string;
  };
  verificationBadge: {
    level: 'UNVERIFIED' | 'VERIFIED' | 'PREMIUM';
    verifiedAt?: Date;
    expiresAt?: Date;
  };
  trustScore: number; // 0-1000
  statistics: {
    totalSales: number;
    totalVolume: string; // in ETH
    averageRating: number;
    totalReviews: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
{ ownerWallet: 1, unique: true }
{ businessName: 'text' }
{ trustScore: -1 }
```

#### 3. Submissions Collection

```typescript
interface Submission {
  _id: ObjectId;
  businessWallet: string;
  businessName: string;
  subscriptionId: string;
  organizationTier: number;
  requestedProductClass: number;
  collectionName: string;
  description: string;
  royaltyPercent: number;
  uploadedImageCIDs: string[];
  finalImageCID: string | null;
  metadataCID: string | null;
  status: 
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'UNDER_REVIEW'
    | 'GOVERNANCE_APPROVAL'
    | 'COMPLIANCE_CHECK'
    | 'READY_FOR_MINT'
    | 'MINTED'
    | 'REJECTED';
  assignedDesigner?: string;
  adminNotes?: string;
  txHash?: string;
  errorMessage?: string;
  slaTracking: {
    submittedAt: Date;
    reviewedAt?: Date;
    approvedAt?: Date;
    mintedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
{ businessWallet: 1, status: 1 }
{ createdAt: -1 }
{ status: 1 }
```

#### 4. NFT Sales Collection

```typescript
interface NFTSale {
  _id: ObjectId;
  nftContractAddress: string;
  tokenId: string;
  seller: string;
  buyer: string;
  price: string; // in ETH
  platformFee: string;
  creatorRoyalty: string;
  timestamp: Date;
  transactionHash: string;
  blockNumber: number;
}

// Indexes
{ nftContractAddress: 1, tokenId: 1 }
{ seller: 1 }
{ buyer: 1 }
{ timestamp: -1 }
```

#### 5. Redemptions Collection

```typescript
interface Redemption {
  _id: ObjectId;
  nftTokenId: string;
  nftContract: string;
  requester: string;
  merchant: string;
  redemptionType: 'PHYSICAL_DELIVERY' | 'DIGITAL_DELIVERY';
  details: {
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    digitalAssetUrl?: string;
  };
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'USER_CONFIRMED'
    | 'COMPLETED'
    | 'DISPUTED';
  proofOfRedemption?: string; // IPFS CID
  soulboundTokenId?: string;
  timeline: {
    requestedAt: Date;
    acceptedAt?: Date;
    confirmedAt?: Date;
    completedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
{ nftContract: 1, nftTokenId: 1 }
{ requester: 1 }
{ status: 1 }
```

---

## Security Architecture

### Authentication & Authorization

#### JWT-Based Authentication

```typescript
// Token structure
{
  userId: string;
  walletAddress: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  iat: number;
  exp: number;
}

// Configuration
{
  algorithm: 'HS256',
  expiresIn: '7d',
  issuer: 'nft-factory'
}
```

#### Signature-Based Authentication

For blockchain-based authentication:

```typescript
// 1. Generate nonce
const nonce = crypto.randomBytes(32).toString('hex');

// 2. User signs message
const message = `Sign to authenticate: ${nonce}`;
const signature = await signer.signMessage(message);

// 3. Verify signature
const recoveredAddress = verifySignature(message, signature);
```

### Smart Contract Security

#### Access Control

```solidity
// OpenZeppelin OwnableUpgradeable
modifier onlyOwner() {
    require(msg.sender == owner(), "Not owner");
    _;
}

// Role-based access
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
grantRole(MINTER_ROLE, address(factory));
```

#### Reentrancy Protection

```solidity
// Using ReentrancyGuardUpgradeable
function withdraw() external nonReentrant {
    // Checks-Effects-Interactions pattern
    uint256 balance = balances[msg.sender];
    balances[msg.sender] = 0;
    (bool success,) = msg.sender.call{value: balance}("");
    require(success, "Transfer failed");
}
```

#### Input Validation

```solidity
// Custom errors for gas efficiency
error InvalidParameter(string reason);
error Unauthorized();
error InsufficientValue();

function deployCollection(
    string memory name,
    uint256 royaltyPercent
) external {
    if (bytes(name).length == 0) revert InvalidParameter("Empty name");
    if (royaltyPercent > 5000) revert InvalidParameter("Royalty too high");
    // ...
}
```

### Data Protection

#### Encryption at Rest
- Sensitive data encrypted using AES-256
- MongoDB field-level encryption for PII
- Encrypted backups

#### Encryption in Transit
- HTTPS/TLS for all communications
- SSL certificates from trusted CAs
- HSTS enforcement

#### Rate Limiting

```javascript
// Express rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

## Deployment Architecture

### Infrastructure Overview

```
┌────────────────────────────────────────────────────┐
│                  CLIENTS                            │
│  Web Browsers • Mobile • Wallet Extensions         │
└───────────────────┬────────────────────────────────┘
                    │
    ┌───────────────▼────────────────┐
    │        CDN (Vercel Edge)       │
    │  - Global distribution         │
    │  - DDoS protection             │
    │  - SSL termination             │
    └───────────────┬────────────────┘
                    │
    ┌───────────────▼────────────────────────┐
    │         Load Balancer                  │
    └──────┬──────────────┬──────────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼────────┐
    │  Frontend   │  │  Frontend   │
    │  (Client)   │  │  (Admin)    │
    │  Vercel     │  │  Vercel     │
    └─────────────┘  └─────────────┘
           
    ┌──────────────┐  ┌─────────────┐
    │   Server     │  │   Admin     │
    │   Backend    │  │   Backend   │
    │   Railway    │  │   Railway   │
    └──────┬───────┘  └──────┬──────┘
           │                 │
    ┌──────▼─────────────────▼──────┐
    │      MongoDB Atlas            │
    │  - Multi-region cluster       │
    │  - Automatic failover         │
    │  - Point-in-time recovery     │
    └───────────────────────────────┘
    
    ┌──────────────────────────────┐
    │      Base Blockchain          │
    │  - Smart contracts            │
    │  - Transaction events         │
    │  - State verification         │
    └──────────────────────────────┘
```

### Environment Configuration

#### Development
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nft-factory-dev
RPC_URL=https://sepolia.base.org
```

#### Staging
```env
NODE_ENV=staging
PORT=3000
MONGODB_URI=mongodb+srv://.../nft-factory-staging
RPC_URL=https://sepolia.base.org
```

#### Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://.../nft-factory-prod
RPC_URL=https://mainnet.base.org
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [v3-architecture]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "nft-factory-server"
          heroku_email: "deploy@example.com"
```

---

## Key Features Implementation

### Subscription-Based NFT System

**Implementation:**
```solidity
// SubscriptionNFT.sol
mapping(address => Subscription) public subscriptions;

struct Subscription {
    uint8 tier;           // 0-4 (Coal to Platinum)
    uint256 quota;        // Minting allowance
    uint256 usedQuota;    // Used allowance
    bool verified;        // Verification status
    uint256 purchasedAt;  // Purchase timestamp
}

function hasMintingRights(address user, uint256 amount) 
    external view returns (bool) 
{
    Subscription memory sub = subscriptions[user];
    return sub.verified && (sub.quota - sub.usedQuota >= amount);
}
```

### Redemption System

**State Machine:**
```solidity
enum RedemptionState {
    None,
    Requested,
    Accepted,
    Declined,
    Confirmed,
    Completed,
    Disputed
}

mapping(uint256 => Redemption) public redemptions;

struct Redemption {
    RedemptionState state;
    address merchant;
    address buyer;
    uint256 deadline;
    bytes32 detailsHash;
}

function initiateRedemption(uint256 tokenId, bytes32 detailsHash) external {
    redemptions[tokenId] = Redemption({
        state: RedemptionState.Requested,
        merchant: ownerOf(tokenId),
        buyer: msg.sender,
        deadline: block.timestamp + REDEMPTION_PERIOD,
        detailsHash: detailsHash
    });
    _transfer(tokenId, address(this)); // Lock NFT
}
```

### Cross-Chain Purchases

**CCIP Integration:**
```solidity
// CCIPNFTReceiver.sol
function ccipReceive(
    Client.Any2EVMMessage calldata message
) internal override {
    (
        address buyer,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    ) = abi.decode(message.data, (address, address, uint256, uint256));
    
    // Validate sender
    if (message.sourceChainSelector != ETHEREUM_SEPOLIA_SELECTOR)
        revert UnsupportedChain();
    
    // Execute purchase
    marketplace.executeCrossChainPurchase{value: amount}(
        buyer,
        nftContract,
        tokenId,
        amount
    );
}
```

---

## Upgrade History

### Version 3.0.0 (Current)

**Major Changes:**
- Introduced subscription-based NFT system
- Deployed FactoryV2 with tier validation
- Added Marketplace with dynamic fees
- Implemented Chainlink CCIP for cross-chain purchases
- Upgraded to wagmi v2 for better wallet support

**Contracts Added:**
- FactoryV2.sol
- SimpleCollectibleV2.sol
- SubscriptionNFT.sol
- Marketplace.sol
- CCIPNFTReceiver.sol
- MerchantRegistry.sol
- EscrowManager.sol
- RedemptionManager.sol

### Version 2.0.0

**Changes:**
- Upgraded to upgradeable UUPS proxy pattern
- Implemented EIP-2981 royalty standard
- Added comprehensive security features
- Deployed on Base Sepolia testnet

### Version 1.0.0

**Initial Release:**
- Basic NFT factory functionality
- Simple collectible contracts
- Web2 backend infrastructure
- MongoDB database integration

---

## Future Enhancements

### Planned Features

1. **Layer 2 Scaling**
   - Optimism integration
   - zkSync deployment consideration
   - Gas optimization strategies

2. **Enhanced Analytics**
   - Real-time sales dashboard
   - Trend analysis and insights
   - Merchant performance metrics

3. **Mobile Application**
   - React Native mobile app
   - WalletConnect mobile support
   - Push notifications

4. **Governance Token**
   - DAO implementation
   - Community voting mechanisms
   - Treasury management

5. **Advanced CCIP Features**
   - Multi-chain NFT bridging
   - Cross-chain auctions
   - Aggregated liquidity pools

---

**Last Updated**: March 23, 2026  
**Version**: 3.0.0  
**Maintained By**: Zeus Labs Engineering Team
