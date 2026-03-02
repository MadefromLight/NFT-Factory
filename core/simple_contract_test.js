// Simple test to verify contract functionality on Base Sepolia
const { ethers } = require("hardhat");

// Contract addresses from the latest deployment
const SUBSCRIPTION_NFT_ADDR = "0xd06Ee9B51be61D913315CD0e22D06bE787c5cbe5";
const FACTORY_V2_ADDR = "0xe90335369A7cdD7570EF99988DB3ADce85D89055";
const MARKETPLACE_ADDR = "0xCE4274c33dB9E32926120E7497d67E4335024a38";

async function simpleTest() {
  console.log("Starting simple contract verification on Base Sepolia...\n");

  // Get contract instances
  const SubscriptionNFT = await ethers.getContractFactory("SubscriptionNFT");
  const FactoryV2 = await ethers.getContractFactory("FactoryV2");
  const Marketplace = await ethers.getContractFactory("Marketplace");

  const subscriptionNFT = SubscriptionNFT.attach(SUBSCRIPTION_NFT_ADDR);
  const factoryV2 = FactoryV2.attach(FACTORY_V2_ADDR);
  const marketplace = Marketplace.attach(MARKETPLACE_ADDR);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  try {
    // Quick checks
    console.log("\n1. Checking SubscriptionNFT contract info...");
    console.log("   Name:", await subscriptionNFT.name());
    console.log("   Symbol:", await subscriptionNFT.symbol());

    console.log("\n2. Checking FactoryV2 contract info...");
    console.log("   Owner:", await factoryV2.owner());
    console.log("   Can deploy (current account):", await factoryV2.canDeploy(signer.address));

    console.log("\n3. Checking Marketplace contract info...");
    console.log("   Owner:", await marketplace.owner());
    console.log("   Total active listings:", (await marketplace.getTotalActiveListings()).toString());

    console.log("\n✓ All contract calls successful!");
    console.log("\n✓ v3 Architecture contracts are properly deployed and functional on Base Sepolia");
    console.log("✓ SubscriptionNFT at:", SUBSCRIPTION_NFT_ADDR);
    console.log("✓ FactoryV2 at:", FACTORY_V2_ADDR);
    console.log("✓ Marketplace at:", MARKETPLACE_ADDR);

  } catch (error) {
    console.error("❌ Error during contract verification:", error);
    throw error;
  }
}

simpleTest()
  .then(() => {
    console.log("\n✅ Contract verification completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Contract verification failed:", error);
    process.exit(1);
  });