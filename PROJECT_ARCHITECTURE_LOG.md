# NFT Factory Project Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Components](#frontend-components)
4. [Backend Services](#backend-services)
5. [Blockchain & Smart Contracts](#blockchain--smart-contracts)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Deployment Architecture](#deployment-architecture)
9. [Key Features](#key-features)

## Project Overview

The NFT Factory is a comprehensive platform that enables businesses to create, manage, and sell NFT collections with physical or digital redemption capabilities. The platform consists of multiple interconnected services that work together to provide a seamless experience for creators, collectors, and administrators.

### Core Components:
- **Client Frontend**: User-facing interface built with Next.js for creators and collectors
- **Admin Frontend**: Administrative dashboard built with React for platform management
- **Server Backend**: Primary API server handling user interactions, submissions, and business logic
- **Admin Backend**: Administrative API server managing users, approvals, and platform operations
- **Smart Contracts**: Blockchain infrastructure deployed on Base Sepolia with upgradeable proxy patterns
- **MongoDB Database**: Data persistence for user profiles, submissions, sales, and redemptions

### Key Functionality:
- Subscription-based NFT system with tiered access (Coal, Bronze, Silver, Gold, Platinum)
- NFT minting with redemption capabilities for physical/digital assets
- Automated minting worker system for processing submissions
- IPFS integration for decentralized storage
- Comprehensive business profile system with trust scores
- Advanced marketplace with tier-certified filtering

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Client        │    │     Admin            │    │  Smart          │
│   Frontend      │    │     Frontend         │    │  Contracts      │
│  (Next.js)      │    │   (React/Vite)       │    │ (Base Sepolia)  │
└─────────┬───────┘    └──────────┬───────────┘    └─────────┬───────┘
          │                       │                          │
          │ HTTP/JSON             │ HTTP/JSON                │ RPC Calls
          │                       │                        │
          ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│    Server       │    │    Admin Backend     │    │   MongoDB       │
│   Backend       │    │      (Node.js)       │    │   Database      │
│   (Node.js)     │    │                     │    │                 │
└─────────┬───────┘    └──────────┬───────────┘    └─────────┬───────┘
          │                       │                          │
          │ Database              │ Database                 │ Storage
          │ Operations            │ Operations               │ Operations
          │                       │                        │
          └───────────────────────┼──────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────────┐
                         │  Automated Workers   │
                         │  (Minting Process)   │
                         └──────────────────────┘
```

## Frontend Components

### Client Frontend (/client)
Built with Next.js, this is the primary user-facing application for creators and collectors.

#### Key Features:
- Home page showcasing featured NFT collections
- Dashboard for managing business profiles and NFT submissions
- Launch pad for creating and deploying new NFT collections
- Marketplace for buying and selling NFTs
- Profile management with trust score tracking
- Wallet integration for blockchain interactions

#### Technology Stack:
- Next.js 14 with App Router
- Tailwind CSS for styling
- Redux for state management
- Web3Modal for wallet integration
- IPFS integration for decentralized storage

#### Key Pages/Components:
- `/src/app/(auth)/login/page.js` - Authentication flows
- `/src/app/dashboard/*` - Creator dashboard with submission management
- `/src/app/marketplace/*` - NFT marketplace with filtering and purchasing
- `/src/components/ui/*` - Reusable UI components
- `/src/providers/Web3Provider.jsx` - Web3 connectivity provider

### Admin Frontend (/admin-frontend)
Built with React and Vite, this is the administrative interface for platform management.

#### Key Features:
- Login/signup for administrative users
- Dashboard for monitoring platform activity
- User management (approval/rejection of pending users)
- Submission review and approval system
- Analytics and reporting tools

#### Technology Stack:
- React 18 with Vite
- TypeScript
- Tailwind CSS
- Axios for API communication

#### Key Components:
- `/src/pages/LoginPage.jsx` - Admin authentication
- `/src/pages/DashboardPage.jsx` - Admin dashboard
- `/src/pages/UserManagementPage.jsx` - User approval workflows
- `/src/pages/SubmissionReviewPage.jsx` - Submission review interface

## Backend Services

### Server Backend (/server)
This is the primary Node.js backend service handling user interactions, business logic, and API operations for the client frontend.

#### Key Features:
- RESTful API endpoints for user management and NFT operations
- Business profile management with verification and trust scoring
- NFT submission processing with governance workflows
- Marketplace functionality with tier-based filtering
- IPFS integration for decentralized storage
- Webhook handlers for blockchain event processing

#### Technology Stack:
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT-based authentication
- Redis for caching (if implemented)
- IPFS integration

#### Key Components:
- `/server/index.js` - Main application entry point
- `/server/routes/*` - API route definitions
- `/server/controller/*` - Business logic controllers
- `/server/models/*` - Database schemas and models
- `/server/repository/*` - Data access layer
- `/server/utils/*` - Utility functions

#### Major Controllers:
- `account_controller.js` - User account management
- `contract_controller.js` - Smart contract interactions
- `launch_pad_controller.js` - NFT collection creation
- `marketplace_controller.js` - Marketplace operations
- `submission_controller.js` - NFT submission processing

### Admin Backend (/admin-backend)
This is the administrative Node.js backend service managing platform operations, user approvals, and admin functionalities.

#### Key Features:
- Admin authentication and role management
- User approval workflows for platform access
- Submission review and approval system
- Platform monitoring and analytics
- Automated worker system for minting operations

#### Technology Stack:
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose ODM
- JWT-based authentication
- Bull Queue for background job processing

#### Key Components:
- `/admin-backend/src/index.ts` - Main application entry point
- `/admin-backend/src/routes/adminRoutes.ts` - Admin API routes
- `/admin-backend/src/controllers/adminController.ts` - Admin business logic
- `/admin-backend/src/models/AdminUser.ts` - Admin user schema
- `/admin-backend/src/models/Submission.ts` - Submission schema
- `/admin-backend/src/workers/mintingWorker.ts` - Automated minting worker

#### Authentication Roles:
- SUPER_ADMIN: Full platform access
- ADMIN: User and submission management
- DESIGNER: Design-related operations
- OPS: Operational tasks

#### Status Flows:
- User Status: PENDING → APPROVED/REJECTED/SUSPENDED
- Submission Status: PENDING → APPROVED/REJECTED → READY_FOR_MINT → MINTED/FAILED

## Blockchain & Smart Contracts

### Core Contracts (/core/contracts)
The blockchain infrastructure is built on Base Sepolia using Solidity smart contracts with upgradeable proxy patterns.

#### Key Contracts:

1. **Factory.sol** - Main factory contract for deploying upgradeable NFT collections
   - Implements UUPS upgradeable pattern with OpenZeppelin contracts
   - Manages platform fees and collection deployment
   - Contains functions for deploying new NFT collections with redemption capabilities
   - Supports proxy upgradeability for future enhancements

2. **SimpleCollectible.sol** - Upgradeable ERC-721 NFT contract with redemption capabilities
   - Implements EIP-2981 royalty standard
   - Contains minting, redemption, and escrow functionality
   - Upgradeable using OpenZeppelin's UUPS proxy pattern
   - Implements token URI management for metadata

3. **SubscriptionNFT.sol** - Soulbound NFT representing organization tier and minting rights
   - Non-transferable, wallet-bound, quota-based subscription system
   - Implements tiered access with five levels (Coal, Bronze, Silver, Gold, Platinum)
   - Provides minting rights based on subscription tier
   - Implements governance and compliance features

4. **Marketplace.sol** - Tier-certified NFT marketplace with dynamic fees and filtering
   - Integrates with SubscriptionNFT for tier-based fee structures
   - Implements advanced filtering based on NFT certification tiers
   - Dynamic fee calculation based on seller subscription tier
   - Ensures compliance with platform standards

5. **FactoryV2.sol** - Upgraded version of the Factory contract
   - Implements additional features while maintaining backward compatibility
   - Extends functionality of the original Factory contract

6. **SimpleCollectibleV2.sol** - Upgraded version of the SimpleCollectible contract
   - Adds new features while preserving existing functionality
   - Maintains upgradeability through proxy pattern

#### Deployment Strategy:
- Deployed on Base Sepolia testnet
- Uses OpenZeppelin's UUPS proxy pattern for upgradeability
- ProxyAdmin contract manages upgrades
- Deployment scripts in `/core/deploy/` directory
- Verification scripts in `/core/utils/verify.js`

#### Key Features:
- Upgradeable proxy architecture allowing for future enhancements
- EIP-2981 royalty standard compliance
- Soulbound tokens for subscription management
- Governance and compliance mechanisms
- Escrow functionality for secure transactions
- Tier-based access controls

#### Integration Points:
- Admin backend communicates with contracts for minting operations
- Client frontend interacts with contracts for NFT management
- IPFS integration for decentralized metadata storage
- Event listeners for tracking blockchain activities

## Database Schema

### MongoDB Collections
The application uses MongoDB with Mongoose ODM for data persistence across both backend services.

#### Server Backend Models (/server/models):

1. **Submission Model** (`submission_model.js`)
   - Stores NFT submission requests with comprehensive governance workflows
   - Fields: businessInfo, organizationTier, productClass, status, slaTracking, complianceFlags
   - Status transitions: DRAFT → PENDING_REVIEW → UNDER_REVIEW → GOVERNANCE_APPROVAL → COMPLIANCE_CHECK → READY_FOR_MINT → MINTED → LIVE
   - Implements strict governance status transitions and SLA tracking

2. **NFTSale Model** (`nft_sale_model.js`)
   - Tracks all NFT sales for analytics and revenue calculations
   - Fields: nftContractAddress, tokenId, seller, buyer, price, timestamp
   - Listens to Transfer and Sale events from blockchain
   - Implements comprehensive analytics and aggregation functions

3. **Redemption Model** (`redemption_model.js`)
   - Manages the redemption process for physical/digital asset redemption
   - Fields: nftTokenId, redemptionDetails, status, userConfirmation
   - Lifecycle: PENDING → ACCEPTED/DECLINED → USER_CONFIRMED → COMPLETED
   - Contains dispute resolution mechanisms

4. **Business Profile Model** (`business_profile_model.js`)
   - Comprehensive business profile with trust score system
   - Fields: businessInfo, verificationBadge, trustScore, statistics
   - Implements verification badge levels and self-mint eligibility checks
   - Contains extensive statistics and analytics tracking

5. **Account Model** (`account_model.js`)
   - User account management with profile information
   - Fields: email, walletAddress, profile, preferences
   - Links to blockchain wallets and user preferences

6. **Admin Log Model** (`admin_log_model.js`)
   - Audit trail for administrative actions
   - Fields: adminId, action, timestamp, details
   - Maintains security logs for compliance

7. **Launch Pad Model** (`launch_pad_model.js`)
   - NFT collection creation and launch management
   - Fields: collectionDetails, launchConfig, status
   - Manages the NFT collection deployment process

#### Admin Backend Models (/admin-backend/src/models):

1. **Admin User Model** (`AdminUser.ts`)
   - Administrative user accounts and permissions
   - Fields: email, password, role, status, permissions
   - Role types: SUPER_ADMIN, ADMIN, DESIGNER, OPS
   - Status: PENDING, APPROVED, REJECTED, SUSPENDED

2. **Submission Model** (`Submission.ts`)
   - Administrative view of NFT submissions
   - Fields: businessInfo, organizationTier, productClass, status, adminNotes
   - Status: PENDING, APPROVED, REJECTED, READY_FOR_MINT, MINTED, FAILED
   - Supports admin review and approval workflows

#### Relationships:
- Users can have multiple submissions
- Submissions are linked to business profiles
- NFT sales are associated with specific tokens
- Redemptions are tied to specific NFT tokens
- Admin logs track actions on various entities

#### Indexing Strategy:
- Email addresses are indexed for fast user lookups
- Wallet addresses are indexed for blockchain integration
- Timestamps are indexed for chronological queries
- Status fields are indexed for workflow filtering

#### Security Considerations:
- Passwords are hashed using bcrypt
- Sensitive data is encrypted at rest
- Access logs maintain audit trails
- Rate limiting prevents abuse

## Authentication & Security

### Authentication System
The platform implements a comprehensive authentication system with role-based access control across both frontend and backend services.

#### JWT-Based Authentication:
- JSON Web Tokens (JWT) for stateless authentication
- Token expiration and refresh mechanisms
- Secure token signing with strong secret keys
- Role-based permissions embedded in tokens

#### User Authentication (Server Backend):
- `/server/controller/account_controller.js` handles user registration and login
- Email/password authentication with bcrypt hashing
- Wallet-based authentication for blockchain integration
- Session management and token validation

#### Admin Authentication (Admin Backend):
- `/admin-backend/src/controllers/adminController.ts` handles admin authentication
- Multi-role system: SUPER_ADMIN, ADMIN, DESIGNER, OPS
- Role-based access control (RBAC) for administrative functions
- Account approval workflow for new admin users

#### Security Measures:
- Passwords hashed with bcrypt (12 salt rounds)
- Input validation and sanitization
- SQL injection and XSS prevention
- Rate limiting to prevent brute force attacks
- CORS policies to prevent unauthorized cross-origin requests
- Helmet.js for security header implementation

#### Authorization:
- Middleware-based authorization checks
- Role-based access control for admin functions
- Resource-level permissions
- API rate limiting and throttling

#### Blockchain Security:
- Smart contract security best practices
- Upgradeability with proper access controls
- Multi-signature wallets for critical operations
- Proper access control modifiers (onlyOwner, etc.)

### Security Headers & Policies:
- Content Security Policy (CSP) for XSS protection
- Strict Transport Security (HSTS) for HTTPS enforcement
- X-Frame-Options to prevent clickjacking
- X-XSS-Protection for legacy browser support
- Referrer Policy for privacy

### Data Protection:
- Encryption at rest for sensitive data
- Encryption in transit using HTTPS/TLS
- Secure key management practices
- Regular security audits and vulnerability assessments

### Compliance:
- GDPR compliance for user data handling
- SOC 2 compliance measures
- Regular security updates and patching
- Audit logs for compliance reporting

## Deployment Architecture

### Infrastructure Overview
The NFT Factory platform is designed for cloud-native deployment with microservices architecture supporting horizontal scaling and resilience.

#### Service Deployment:
- **Client Frontend**: Deployed on Vercel for optimal Next.js performance
- **Admin Frontend**: Deployed on Vercel for rapid iteration and global CDN
- **Server Backend**: Deployed on Node.js runtime (Vercel, AWS, or similar)
- **Admin Backend**: Deployed on Node.js runtime with separate environment
- **Database**: MongoDB Atlas or self-hosted MongoDB cluster
- **Smart Contracts**: Deployed on Base Sepolia network with upgradeability

#### Environment Configuration:
- Separate environments for development, staging, and production
- Environment-specific configuration files
- Secret management for API keys and database credentials
- Network isolation between environments

#### CI/CD Pipeline:
- Automated testing on pull requests
- Staging deployment for validation
- Production deployment with rollback capabilities
- Containerized builds for consistency

#### Scaling Strategy:
- Horizontal scaling for API services
- Load balancing across multiple instances
- Database sharding for large datasets
- CDN for static assets

#### Monitoring & Logging:
- Application performance monitoring (APM)
- Real-time alerting for critical issues
- Structured logging for debugging
- Blockchain event monitoring
- Database performance metrics

#### Backup & Recovery:
- Regular database backups
- Smart contract deployment backup
- Version control for all configurations
- Disaster recovery procedures

### DevOps Practices:
- Infrastructure as Code (IaC) for reproducible deployments
- Blue-green deployment for zero-downtime releases
- Feature flags for gradual rollouts
- Health checks and auto-healing
- Performance optimization and caching strategies

### Security in Deployment:
- Network security groups and firewalls
- SSL/TLS termination at edge
- DDoS protection
- Vulnerability scanning
- Compliance monitoring

## Key Features

### Core Functionality
The NFT Factory platform offers a comprehensive suite of features for creating, managing, and trading NFTs with real-world utility.

#### Subscription-Based NFT System:
- Five-tier subscription model (Coal, Bronze, Silver, Gold, Platinum)
- Soulbound tokens representing membership and minting rights
- Non-transferable subscriptions tied to wallet addresses
- Quota-based minting allowances per subscription tier

#### NFT Creation & Minting:
- Self-service NFT collection creation via launch pad
- Automated minting workflow with governance approval
- IPFS integration for decentralized metadata storage
- Upgradeable smart contracts for future enhancements

#### Redemption System:
- Physical and digital asset redemption capabilities
- Multi-stage redemption workflow (PENDING → ACCEPTED → USER_CONFIRMED → COMPLETED)
- Dispute resolution mechanisms
- Escrow functionality for secure transactions

#### Marketplace Features:
- Tier-certified filtering based on subscription levels
- Dynamic fee structure based on seller subscription tier
- Advanced search and filtering capabilities
- Real-time pricing and availability

#### Business Management:
- Comprehensive business profiles with trust scoring
- Verification badge system with multiple levels
- Analytics and performance tracking
- Compliance and governance workflows

#### Blockchain Integration:
- Base Sepolia network deployment
- EIP-2981 royalty standard compliance
- Upgradeable proxy contracts for future enhancements
- Multi-signature wallet support for security

#### Automation & Workers:
- Automated minting worker system for processing submissions
- Event-driven architecture for real-time updates
- Background job processing for heavy operations
- Scheduled tasks for maintenance and cleanup

### Unique Value Propositions:
1. **Governance & Compliance**: Comprehensive approval workflows ensuring quality and compliance
2. **Real-World Utility**: NFTs with physical/digital redemption capabilities
3. **Scalable Architecture**: Microservices design supporting growth
4. **Upgradeable Infrastructure**: Smart contracts designed for future enhancements
5. **Tiered Access Model**: Subscription system creating sustainable revenue streams
6. **Decentralized Storage**: IPFS integration for censorship-resistant metadata
7. **Security First**: Multiple layers of security and audit trails

### Technology Highlights:
- Full-stack JavaScript ecosystem (Next.js, React, Node.js)
- Blockchain integration with Solidity smart contracts
- MongoDB for flexible data storage
- IPFS for decentralized storage
- Real-time processing with automated workers
- Comprehensive API ecosystem
- Role-based access control system

This architecture creates a robust, scalable platform for NFT creation and management with real-world utility, supporting both creators and collectors in a compliant and secure environment.