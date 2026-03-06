// Deployment script for CCIP Cross-Chain NFT Infrastructure
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Deploying CCIP Cross-Chain NFT Infrastructure...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get existing contracts
  // These should be set in .env after previous deployments
  const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
  
  if (!MARKETPLACE_ADDRESS) {
    throw new Error("MARKETPLACE_ADDRESS not set in environment");
  }

  console.log("\n=== Using Existing Marketplace ===");
  console.log("Marketplace:", MARKETPLACE_ADDRESS);

  // ============================================
  // STEP 1: Get CCIP Router Address
  // ============================================
  console.log("\n=== Step 1: CCIP Router Configuration ===");
  
  // For Base Sepolia testnet, the CCIP Router address is:
  const CCIP_ROUTER_ADDRESS = "0x29A2B8F1cD5b3e4a6f0C8d9E7F1a2B3c4D5e6F7a"; // TODO: Replace with actual Base Sepolia CCIP Router
  
  console.log("CCIP Router:", CCIP_ROUTER_ADDRESS);
  console.log("Note: Verify this address from Chainlink documentation for Base Sepolia");

  // ============================================
  // STEP 2: Deploy CCIP NFT Receiver
  // ============================================
  console.log("\n=== Step 2: Deploying CCIP NFT Receiver ===");
  
  const CCIPNFTReceiver = await ethers.getContractFactory("CCIPNFTReceiver");
  const ccipReceiver = await CCIPNFTReceiver.deploy(
    CCIP_ROUTER_ADDRESS,
    MARKETPLACE_ADDRESS
  );
  
  await ccipReceiver.deployed();
  console.log("CCIPNFTReceiver deployed to:", ccipReceiver.address);

  // Wait for deployment to be confirmed
  console.log("Waiting for deployment confirmation...");
  await ccipReceiver.deployTransaction.wait(3);
  console.log("✓ Deployment confirmed!");

  // ============================================
  // STEP 3: Configure Marketplace with CCIP Receiver
  // ============================================
  console.log("\n=== Step 3: Configuring Marketplace ===");
  
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.attach(MARKETPLACE_ADDRESS);
  
  // Set CCIP receiver in marketplace
  console.log("Setting CCIP receiver in marketplace...");
  const tx1 = await marketplace.setCCIPReceiver(ccipReceiver.address);
  await tx1.wait();
  console.log("✓ CCIP receiver set!");

  // ============================================
  // STEP 4: Configure Supported Chains
  // ============================================
  console.log("\n=== Step 4: Adding Supported Chains ===");
  
  // Ethereum Sepolia chain selector (from hardhat.config.js)
  const ETHEREUM_SEPOLIA_SELECTOR = "16015289601813375307";
  
  console.log("Adding Ethereum Sepolia support...");
  const tx2 = await marketplace.setChainSupport(ETHEREUM_SEPOLIA_SELECTOR, true);
  await tx2.wait();
  console.log("✓ Ethereum Sepolia added!");

  // You can add more chains here as needed
  // const POLYGON_AMOY_SELECTOR = "16281711391670634445";
  // await marketplace.setChainSupport(POLYGON_AMOY_SELECTOR, true);

  // ============================================
  // STEP 5: Verify Deployment
  // ============================================
  console.log("\n=== Step 5: Verification ===");
  
  const configuredReceiver = await marketplace.ccipReceiver();
  console.log("Configured CCIP Receiver:", configuredReceiver);
  console.log("Matches deployment:", configuredReceiver === ccipReceiver.address);

  const supportedChains = await marketplace.getSupportedChains();
  console.log("Supported chains:", supportedChains.map(s => s.toString()));

  // ============================================
  // STEP 6: Save Deployment Info
  // ============================================
  console.log("\n=== Deployment Summary ===");
  
  const deploymentInfo = {
    network: ethers.provider.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      marketplace: MARKETPLACE_ADDRESS,
      ccipReceiver: ccipReceiver.address,
      ccipRouter: CCIP_ROUTER_ADDRESS,
    },
    configuration: {
      ethereumSepoliaSelector: ETHEREUM_SEPOLIA_SELECTOR,
    },
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require('fs');
  const filename = `deployment-ccip-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✓ Deployment info saved to: ${filename}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Fund the CCIP Receiver with ETH for gas refunds");
  console.log("2. Configure CCIP on source chains (Ethereum Sepolia)");
  console.log("3. Test cross-chain purchase flow");
  console.log("4. Set up CRE workflow for royalty distribution");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
