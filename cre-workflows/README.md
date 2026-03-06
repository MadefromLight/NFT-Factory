# Chainlink CRE Workflows

This directory contains Chainlink Runtime Environment (CRE) workflows for automated NFT royalty distribution and cross-chain operations.

## Setup

### Prerequisites

1. Install CRE CLI:
```bash
npm install -g @chainlink/cre
```

2. Create account at [cre.chain.link](https://cre.chain.link)

3. Request Early Access for deployment (optional for simulation):
```bash
cre account access
```

### Installation

```bash
cd cre-workflows
npm install
```

## Workflows

### 1. Cross-Chain Royalty Distribution (`royalty-distribution/main.ts`)

Automatically distributes NFT sale royalties across multiple chains:
- Triggers on marketplace sale events
- Calculates fee splits (creator, platform, seller)
- Distributes via CCIP to recipients on different chains
- Logs all transactions for transparency

### 2. Proof of Reserve Validator (`proof-of-reserve/main.ts`)

Validates reserves for physical-backed NFTs:
- Fetches reserve data from custodian APIs
- Compares with minted NFT supply
- Triggers alerts if under-collateralized
- Updates on-chain attestation

## Running Workflows

### Simulation (Local Testing)

```bash
# Simulate royalty distribution workflow
cre simulate royalty-distribution --config config.json
```

### Deployment (Early Access Required)

```bash
# Deploy to Chainlink DON
cre deploy royalty-distribution --config config.json --network base-sepolia
```

## Configuration

Create a `config.json` file:

```json
{
  "marketplace": "0x...",
  "ccipRouter": "0x...",
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
    "creatorRoyaltyBps": 500
  }
}
```

## Development

### Project Structure

```
cre-workflows/
├── royalty-distribution/
│   ├── main.ts           # Workflow entry point
│   ├── types.ts          # TypeScript interfaces
│   └── utils.ts          # Helper functions
├── proof-of-reserve/
│   └── main.ts
├── package.json
└── README.md
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires local Hardhat node)
npm run test:integration
```

## Resources

- [CRE Documentation](https://docs.chain.link/cre)
- [CRE SDK (TypeScript)](https://github.com/smartcontractkit/cre-sdk-ts)
- [CCIP Documentation](https://docs.chain.link/ccip)
- [Chainlink Functions](https://docs.chain.link/functions)
