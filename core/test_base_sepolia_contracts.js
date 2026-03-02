// Test script to verify contract functionality on Base Sepolia
const { ethers } = require("hardhat");

// Contract addresses from the latest deployment
const CONTRACT_ADDRESSES = {
  subscriptionNFT: "0xd06Ee9B51be61D913315CD0e22D06bE787c5cbe5",
  factoryV2: "0xe90335369A7cdD7570EF99988DB3ADce85D89055",
  simpleCollectibleV2Impl: "0x545874d3c81699C4Da951c91801f9D9C166cF368",
  marketplace: "0xCE4274c33dB9E32926120E7497d67E4335024a38",
  usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
};

async function testContracts() {
  console.log("Testing NFT Factory contracts on Base Sepolia...\n");

  // Get contract instances
  const SubscriptionNFT = await ethers.getContractFactory("SubscriptionNFT");
  const FactoryV2 = await ethers.getContractFactory("FactoryV2");
  const Marketplace = await ethers.getContractFactory("Marketplace");

  const subscriptionNFT = SubscriptionNFT.attach(CONTRACT_ADDRESSES.subscriptionNFT);
  const factoryV2 = FactoryV2.attach(CONTRACT_ADDRESSES.factoryV2);
  const marketplace = Marketplace.attach(CONTRACT_ADDRESSES.marketplace);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Account balance:", ethers.utils.formatEther(await signer.getBalance()), "ETH\n");

  try {
    // 1. Test SubscriptionNFT contract
    console.log("=== Testing SubscriptionNFT Contract ===");
    
    // Check contract basic info
    console.log("SubscriptionNFT name:", await subscriptionNFT.name());
    console.log("SubscriptionNFT symbol:", await subscriptionNFT.symbol());
    
    // Check tier pricing
    console.log("\nTier Pricing (USDC):");
    const tiers = ["COAL", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
    for (let i = 0; i < 5; i++) {
      const price = await subscriptionNFT.tierPrices(i);
      const quota = await subscriptionNFT.tierQuotas(i);
      const fee = await subscriptionNFT.tierMarketplaceFees(i);
      console.log(`${tiers[i]}: ${(price / 1e6).toFixed(2)} USDC | Quota: ${quota} | Fee: ${fee / 100}%`);
    }

    // Check if account has subscription
    const subscriptionId = await subscriptionNFT.getSubscriptionId(signer.address);
    console.log(`\nAccount subscription ID: ${subscriptionId.toString()}`);
    
    const hasSub = await subscriptionNFT.hasActiveSubscription(signer.address);
    console.log(`Account has active subscription: ${hasSub}`);

    if (subscriptionId.gt(0)) {
      console.log("\nGetting subscription details...");
      const details = await subscriptionNFT.getSubscriptionDetails(subscriptionId);
      console.log("Organization Tier:", details.organizationTier.toString());
      console.log("Total Quota:", details.totalQuota.toString());
      console.log("Remaining Quota:", details.remainingQuota.toString());
      console.log("Verification Status:", details.status.toString());
      console.log("Purchase Price:", ethers.utils.formatUnits(details.purchasePrice, 6), "USDC");
    }

    // 2. Test FactoryV2 contract
    console.log("\n=== Testing FactoryV2 Contract ===");
    
    console.log("FactoryV2 owner:", await factoryV2.owner());
    console.log("Platform fee recipient:", await factoryV2.platformFeeRecipient());
    console.log("Platform fee BPS:", (await factoryV2.platformFeeBps()).toString());
    console.log("SubscriptionNFT address:", await factoryV2.subscriptionNFT());
    
    const canDeploy = await factoryV2.canDeploy(signer.address);
    console.log("Can deploy:", canDeploy);

    // Check collection count
    const collectionCount = await factoryV2.getCollectionCount();
    console.log("Total collections deployed:", collectionCount.toString());

    // 3. Test Marketplace contract
    console.log("\n=== Testing Marketplace Contract ===");
    
    console.log("Marketplace owner:", await marketplace.owner());
    console.log("Platform fee recipient:", await marketplace.platformFeeRecipient());
    console.log("SubscriptionNFT address:", await marketplace.subscriptionNFT());
    
    console.log("Total active listings:", (await marketplace.getTotalActiveListings()).toString());

    // 4. Test USDC balance (if available)
    console.log("\n=== Testing USDC Balance ===");
    const USDC = await ethers.getContractFactory("IERC20");
    const usdc = USDC.attach(CONTRACT_ADDRESSES.usdcAddress);
    
    const usdcBalance = await usdc.balanceOf(signer.address);
    console.log("USDC balance:", ethers.utils.formatUnits(usdcBalance, 6));

    console.log("\n=== Contract Tests Completed Successfully ===");
    
    // Provide guidance for next steps
    console.log("\nNext steps for testing:");
    console.log("1. Approve USDC spending if you want to mint a subscription");
    console.log("2. Test subscription purchase: await subscriptionNFT.mintSubscription(tierNumber)");
    console.log("3. After getting subscription, test collection deployment with FactoryV2");
    console.log("4. Test marketplace listing and purchase functionality");
    
  } catch (error) {
    console.error("Error during contract testing:", error);
    throw error;
  }
}

async function testSubscriptionFlow() {
  console.log("\n=== Testing Subscription Purchase Flow ===");
  
  const SubscriptionNFT = await ethers.getContractFactory("SubscriptionNFT");
  const subscriptionNFT = SubscriptionNFT.attach(CONTRACT_ADDRESSES.subscriptionNFT);

  // Example: Test COAL tier purchase (index 0)
  const coalPrice = await subscriptionNFT.tierPrices(0);
  console.log(`COAL tier price: ${ethers.utils.formatUnits(coalPrice, 6)} USDC`);
  
  // Note: Actual testing would require USDC approval and purchase
  // await usdc.approve(subscriptionNFT.address, coalPrice);
  // await subscriptionNFT.mintSubscription(0);
}

// Run the tests
testContracts()
  .then(() => {
    console.log("\nAll tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Tests failed:", error);
    process.exit(1);
  });