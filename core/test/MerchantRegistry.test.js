const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MerchantRegistry", function () {
  let merchantRegistry;
  let owner, merchant1, merchant2, addr1;
  
  const BUSINESS_NAME = "Test Business";
  const BUSINESS_TYPE = "Digital Goods";
  const WEBSITE = "https://testbusiness.com";
  const DESCRIPTION = "A test business for NFT commerce";

  beforeEach(async function () {
    [owner, merchant1, merchant2, addr1] = await ethers.getSigners();
    
    const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
    merchantRegistry = await upgrades.deployProxy(
      MerchantRegistry,
      [owner.address],
      { initializer: "initialize" }
    );
    await merchantRegistry.deployed();
  });

  describe("Merchant Registration", function () {
    it("Should allow merchant registration", async function () {
      const tx = await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
      
      await expect(tx)
        .to.emit(merchantRegistry, "MerchantRegistered")
        .withArgs(merchant1.address, BUSINESS_NAME, BUSINESS_TYPE, ethers.BigNumber.from(0));

      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.businessName).to.equal(BUSINESS_NAME);
      expect(merchantInfo.verificationStatus).to.equal(0); // UNVERIFIED
      expect(merchantInfo.tier).to.equal(0); // STARTER
    });

    it("Should reject duplicate registration", async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
      
      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          BUSINESS_NAME,
          BUSINESS_TYPE,
          WEBSITE,
          DESCRIPTION
        )
      ).to.be.revertedWithCustomError(merchantRegistry, "MerchantAlreadyRegistered");
    });

    it("Should reject empty business name", async function () {
      await expect(
        merchantRegistry.connect(merchant1).registerMerchant(
          "",
          BUSINESS_TYPE,
          WEBSITE,
          DESCRIPTION
        )
      ).to.be.revertedWithCustomError(merchantRegistry, "InvalidAddress");
    });
  });

  describe("Document Submission", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
    });

    it("Should allow document submission", async function () {
      const docHash = "QmTestDocumentHash123";
      
      const tx = await merchantRegistry.connect(merchant1).submitDocument(0, docHash); // 0 = BUSINESS_REGISTRATION
      
      await expect(tx)
        .to.emit(merchantRegistry, "DocumentAdded")
        .withArgs(merchant1.address, "Business Registration", docHash, ethers.BigNumber.from(0));

      const documents = await merchantRegistry.getMerchantDocuments(merchant1.address);
      expect(documents.length).to.equal(1);
      expect(documents[0].documentHash).to.equal(docHash);
      expect(documents[0].docType).to.equal(0);
    });

    it("Should prevent duplicate document types", async function () {
      const docHash1 = "QmTestDocument1";
      const docHash2 = "QmTestDocument2";
      
      await merchantRegistry.connect(merchant1).submitDocument(0, docHash1);
      
      await expect(
        merchantRegistry.connect(merchant1).submitDocument(0, docHash2)
      ).to.be.revertedWithCustomError(merchantRegistry, "DocumentAlreadyExists");
    });

    it("Should reject submission from unregistered merchant", async function () {
      await expect(
        merchantRegistry.connect(addr1).submitDocument(0, "QmTest")
      ).to.be.revertedWithCustomError(merchantRegistry, "MerchantNotRegistered");
    });
  });

  describe("Merchant Verification", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
    });

    it("Should allow owner to verify merchant", async function () {
      const trustScore = 500;
      
      const tx = await merchantRegistry.verifyMerchant(merchant1.address, 2, trustScore); // 2 = VERIFIED
      
      await expect(tx)
        .to.emit(merchantRegistry, "MerchantVerified")
        .withArgs(merchant1.address, 2, ethers.BigNumber.from(0));

      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.verificationStatus).to.equal(2); // VERIFIED
      expect(merchantInfo.trustScore).to.equal(trustScore);
    });

    it("Should update merchant tier based on trust score", async function () {
      // Test different trust scores and expected tiers
      const testCases = [
        { score: 100, expectedTier: 0 }, // STARTER
        { score: 400, expectedTier: 1 }, // PROFESSIONAL
        { score: 700, expectedTier: 2 }, // ENTERPRISE
        { score: 900, expectedTier: 3 }, // PREMIUM
      ];
      
      for (const testCase of testCases) {
        await merchantRegistry.verifyMerchant(merchant1.address, 2, testCase.score);
        const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
        expect(merchantInfo.tier).to.equal(testCase.expectedTier);
        
        // Reset for next test
        await merchantRegistry.verifyMerchant(merchant1.address, 0, 0); // UNVERIFIED
      }
    });

    it("Should reject verification by non-owner", async function () {
      await expect(
        merchantRegistry.connect(merchant2).verifyMerchant(merchant1.address, 2, 500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject verification of unregistered merchant", async function () {
      await expect(
        merchantRegistry.verifyMerchant(addr1.address, 2, 500)
      ).to.be.revertedWithCustomError(merchantRegistry, "MerchantNotRegistered");
    });
  });

  describe("Trust Score Management", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
      await merchantRegistry.verifyMerchant(merchant1.address, 2, 300); // VERIFIED with 300 score
    });

    it("Should allow owner to update trust score", async function () {
      const scoreDelta = 100;
      
      const tx = await merchantRegistry.updateTrustScore(merchant1.address, scoreDelta);
      
      await expect(tx)
        .to.emit(merchantRegistry, "TrustScoreUpdated")
        .withArgs(merchant1.address, 300, 400, ethers.BigNumber.from(0));

      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.trustScore).to.equal(400);
    });

    it("Should handle negative score updates", async function () {
      const scoreDelta = -50;
      
      await merchantRegistry.updateTrustScore(merchant1.address, scoreDelta);
      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.trustScore).to.equal(250);
    });

    it("Should cap trust score at maximum", async function () {
      await merchantRegistry.updateTrustScore(merchant1.address, 1000);
      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.trustScore).to.equal(1000); // MAX_TRUST_SCORE
    });

    it("Should not allow negative scores below zero", async function () {
      await merchantRegistry.updateTrustScore(merchant1.address, -500);
      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.trustScore).to.equal(0);
    });
  });

  describe("Merchant Status Management", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
      await merchantRegistry.verifyMerchant(merchant1.address, 2, 500); // VERIFIED
    });

    it("Should allow owner to suspend merchant", async function () {
      const tx = await merchantRegistry.suspendMerchant(merchant1.address, "Violation of terms");
      
      await expect(tx)
        .to.emit(merchantRegistry, "MerchantSuspended")
        .withArgs(merchant1.address, "Violation of terms", ethers.BigNumber.from(0));

      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.verificationStatus).to.equal(4); // SUSPENDED
      expect(merchantInfo.isActive).to.equal(false);
    });

    it("Should allow owner to reactivate suspended merchant", async function () {
      await merchantRegistry.suspendMerchant(merchant1.address, "Test suspension");
      
      const tx = await merchantRegistry.reactivateMerchant(merchant1.address);
      
      await expect(tx)
        .to.emit(merchantRegistry, "MerchantVerified")
        .withArgs(merchant1.address, 2, ethers.BigNumber.from(0));

      const merchantInfo = await merchantRegistry.getMerchantInfo(merchant1.address);
      expect(merchantInfo.verificationStatus).to.equal(2); // VERIFIED
      expect(merchantInfo.isActive).to.equal(true);
    });

    it("Should reject reactivation of non-suspended merchant", async function () {
      await expect(
        merchantRegistry.reactivateMerchant(merchant1.address)
      ).to.be.revertedWithCustomError(merchantRegistry, "InvalidVerificationStatus");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(
        BUSINESS_NAME,
        BUSINESS_TYPE,
        WEBSITE,
        DESCRIPTION
      );
      await merchantRegistry.connect(merchant2).registerMerchant(
        "Business 2",
        "Services",
        "https://business2.com",
        "Second test business"
      );
    });

    it("Should correctly identify verified merchants", async function () {
      // Initially no verified merchants
      expect(await merchantRegistry.isVerifiedMerchant(merchant1.address)).to.equal(false);
      expect(await merchantRegistry.isVerifiedMerchant(merchant2.address)).to.equal(false);
      
      // Verify one merchant
      await merchantRegistry.verifyMerchant(merchant1.address, 2, 500);
      
      expect(await merchantRegistry.isVerifiedMerchant(merchant1.address)).to.equal(true);
      expect(await merchantRegistry.isVerifiedMerchant(merchant2.address)).to.equal(false);
    });

    it("Should return correct merchant counts", async function () {
      const totalMerchants = await merchantRegistry.totalMerchants();
      const verifiedMerchants = await merchantRegistry.verifiedMerchants();
      
      expect(totalMerchants).to.equal(2);
      expect(verifiedMerchants).to.equal(0);
      
      // Verify one merchant
      await merchantRegistry.verifyMerchant(merchant1.address, 2, 500);
      
      expect(await merchantRegistry.verifiedMerchants()).to.equal(1);
    });
  });
});