// Deployment script for Web3 Commerce Infrastructure
const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Deploying Web3 Commerce Infrastructure...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration
  const PLATFORM_FEE_RECIPIENT = deployer.address;
  const PLATFORM_FEE_BPS = 250; // 2.5%
  const BASE_REDEMPTION_FEE = ethers.utils.parseEther("0.01");
  const DEFAULT_TIME_LOCK = 7 * 24 * 60 * 60; // 7 days

  // ============================================
  // STEP 1: Deploy MerchantRegistry
  // ============================================
  console.log("\n=== Deploying MerchantRegistry ===");
  
  const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
  
  const merchantRegistry = await upgrades.deployProxy(
    MerchantRegistry,
    [deployer.address],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await merchantRegistry.deployed();
  console.log("MerchantRegistry Proxy deployed to:", merchantRegistry.address);
  
  const merchantRegistryImpl = await upgrades.erc1967.getImplementationAddress(
    merchantRegistry.address
  );
  console.log("MerchantRegistry Implementation:", merchantRegistryImpl);

  // ============================================
  // STEP 2: Deploy EscrowManager
  // ============================================
  console.log("\n=== Deploying EscrowManager ===");
  
  const EscrowManager = await ethers.getContractFactory("EscrowManager");
  
  const escrowManager = await upgrades.deployProxy(
    EscrowManager,
    [
      deployer.address,
      PLATFORM_FEE_RECIPIENT,
      PLATFORM_FEE_BPS
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await escrowManager.deployed();
  console.log("EscrowManager Proxy deployed to:", escrowManager.address);
  
  const escrowManagerImpl = await upgrades.erc1967.getImplementationAddress(
    escrowManager.address
  );
  console.log("EscrowManager Implementation:", escrowManagerImpl);

  // ============================================
  // STEP 3: Deploy RedemptionManager
  // ============================================
  console.log("\n=== Deploying RedemptionManager ===");
  
  const RedemptionManager = await ethers.getContractFactory("RedemptionManager");
  
  const redemptionManager = await upgrades.deployProxy(
    RedemptionManager,
    [
      deployer.address,
      PLATFORM_FEE_RECIPIENT,
      BASE_REDEMPTION_FEE,
      DEFAULT_TIME_LOCK
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await redemptionManager.deployed();
  console.log("RedemptionManager Proxy deployed to:", redemptionManager.address);
  
  const redemptionManagerImpl = await upgrades.erc1967.getImplementationAddress(
    redemptionManager.address
  );
  console.log("RedemptionManager Implementation:", redemptionManagerImpl);

  // ============================================
  // STEP 4: Deploy Enhanced NFTFactory
  // ============================================
  console.log("\n=== Deploying Enhanced NFTFactory ===");
  
  const NFTFactory = await ethers.getContractFactory("NFTFactory");
  
  const nftFactory = await upgrades.deployProxy(
    NFTFactory,
    [
      PLATFORM_FEE_RECIPIENT,
      PLATFORM_FEE_BPS,
      merchantRegistry.address,
      escrowManager.address,
      redemptionManager.address
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await nftFactory.deployed();
  console.log("NFTFactory Proxy deployed to:", nftFactory.address);
  
  const nftFactoryImpl = await upgrades.erc1967.getImplementationAddress(
    nftFactory.address
  );
  console.log("NFTFactory Implementation:", nftFactoryImpl);

  // ============================================
  // STEP 5: Deploy SimpleCollectible Implementation
  // ============================================
  console.log("\n=== Deploying SimpleCollectible Implementation ===");
  
  const SimpleCollectible = await ethers.getContractFactory("SimpleCollectible");
  const simpleCollectibleImpl = await SimpleCollectible.deploy();
  await simpleCollectibleImpl.deployed();
  console.log("SimpleCollectible Implementation:", simpleCollectibleImpl.address);

  // Update NFTFactory with collection implementation
  console.log("Updating NFTFactory with SimpleCollectible implementation...");
  await (await nftFactory.updateCollectionImplementation(simpleCollectibleImpl.address)).wait();
  console.log("NFTFactory implementation updated");

  // ============================================
  // STEP 6: Verify Contracts
  // ============================================
  console.log("\n=== Verification ===");
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: merchantRegistryImpl,
        contract: "contracts/MerchantRegistry.sol:MerchantRegistry",
      });
      console.log("MerchantRegistry implementation verified");
    } catch (e) {
      console.log("MerchantRegistry verification error:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: escrowManagerImpl,
        contract: "contracts/EscrowManager.sol:EscrowManager",
      });
      console.log("EscrowManager implementation verified");
    } catch (e) {
      console.log("EscrowManager verification error:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: redemptionManagerImpl,
        contract: "contracts/RedemptionManager.sol:RedemptionManager",
      });
      console.log("RedemptionManager implementation verified");
    } catch (e) {
      console.log("RedemptionManager verification error:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftFactoryImpl,
        contract: "contracts/NFTFactory.sol:NFTFactory",
      });
      console.log("NFTFactory implementation verified");
    } catch (e) {
      console.log("NFTFactory verification error:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: simpleCollectibleImpl.address,
        contract: "contracts/SimpleCollectible.sol:SimpleCollectible",
      });
      console.log("SimpleCollectible verified");
    } catch (e) {
      console.log("SimpleCollectible verification error:", e.message);
    }
  }

  // ============================================
  // STEP 7: Save Deployment Info
  // ============================================
  console.log("\n=== Deployment Summary ===");
  
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      merchantRegistry: {
        proxy: merchantRegistry.address,
        implementation: merchantRegistryImpl,
      },
      escrowManager: {
        proxy: escrowManager.address,
        implementation: escrowManagerImpl,
      },
      redemptionManager: {
        proxy: redemptionManager.address,
        implementation: redemptionManagerImpl,
      },
      nftFactory: {
        proxy: nftFactory.address,
        implementation: nftFactoryImpl,
      },
      simpleCollectible: {
        implementation: simpleCollectibleImpl.address,
      }
    },
    configuration: {
      platformFeeRecipient: PLATFORM_FEE_RECIPIENT,
      platformFeeBps: PLATFORM_FEE_BPS,
      baseRedemptionFee: BASE_REDEMPTION_FEE.toString(),
      defaultTimeLock: DEFAULT_TIME_LOCK,
    }
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const deploymentPath = `./deployments/commerce-deployment-${hre.network.name}-${Date.now()}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  console.log("\n=== Deployment Complete ===");
  console.log("\nNext steps:");
  console.log("1. Register as a merchant to test commerce features");
  console.log("2. Deploy test collections with commerce enabled");
  console.log("3. Test escrow and redemption workflows");
  console.log("4. Update client constants with new contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });