const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("RedemptionManager Contract", function () {
  let RedemptionManager;
  let redemptionManager;
  let SimpleCollectible;
  let nft;
  let owner;
  let requester;
  let merchant;
  let addr1;
  let platformFeeRecipient;

  const BASE_REDEMPTION_FEE = ethers.utils.parseEther("0.01");
  const DEFAULT_TIME_LOCK = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, requester, merchant, addr1, platformFeeRecipient] = await ethers.getSigners();

    // Deploy RedemptionManager
    RedemptionManager = await ethers.getContractFactory("RedemptionManager");
    redemptionManager = await upgrades.deployProxy(
      RedemptionManager,
      [owner.address, platformFeeRecipient.address, BASE_REDEMPTION_FEE, DEFAULT_TIME_LOCK],
      { initializer: "initialize" }
    );
    await redemptionManager.deployed();

    // Deploy a test NFT for redemption
    SimpleCollectible = await ethers.getContractFactory("SimpleCollectible");
    nft = await upgrades.deployProxy(
      SimpleCollectible,
      ["TestNFT", "TNFT", ["ipfs://test"], [ethers.utils.parseEther("0.01")], owner.address, platformFeeRecipient.address, 250],
      { initializer: "initialize" }
    );
    await nft.deployed();

    // Mint an NFT to the requester
    await nft.connect(requester).createCollectible(requester.address, 0, { value: ethers.utils.parseEther("0.01") });
  });

  describe("Deployment", function () {
    it("Should set the correct owner and parameters", async function () {
      expect(await redemptionManager.owner()).to.equal(owner.address);
      expect(await redemptionManager.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
      expect((await redemptionManager.config()).baseRedemptionFee).to.equal(BASE_REDEMPTION_FEE);
    });
  });

  describe("Redemption Request", function () {
    it("Should allow requester to request redemption", async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      await expect(
        redemptionManager
          .connect(requester)
          .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0)
      )
        .to.emit(redemptionManager, "RedemptionRequested")
        .withArgs(1, requester.address, merchant.address, nft.address, 0, redemptionType, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(1);
      expect(redemption.requester).to.equal(requester.address);
      expect(redemption.merchant).to.equal(merchant.address);
      expect(redemption.nftContract).to.equal(nft.address);
      expect(redemption.tokenId).to.equal(0);
      expect(redemption.status).to.equal(0); // REQUESTED
    });

    it("Should reject redemption request with zero address", async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      await expect(
        redemptionManager
          .connect(requester)
          .requestRedemption(ethers.constants.AddressZero, nft.address, 0, redemptionType, redemptionDetails, 0)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidAddress");
    });

    it("Should reject redemption request by non-owner", async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      await expect(
        redemptionManager
          .connect(addr1)
          .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0)
      ).to.be.revertedWithCustomError(redemptionManager, "UnauthorizedAccess");
    });

    it("Should reject redemption request with empty details", async function () {
      const redemptionDetails = "";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      await expect(
        redemptionManager
          .connect(requester)
          .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidMetadata");
    });
  });

  describe("Redemption Approval", function () {
    let redemptionId;

    beforeEach(async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      // Create redemption request
      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      redemptionId = event.args.redemptionId;
    });

    it("Should allow merchant to approve redemption", async function () {
      await expect(redemptionManager.connect(merchant).approveRedemption(redemptionId))
        .to.emit(redemptionManager, "RedemptionApproved")
        .withArgs(redemptionId, merchant.address, ethers.BigNumber.from(0), ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(1); // APPROVED
      expect(redemption.approvalTime).to.be.gt(0);
    });

    it("Should reject approval by non-merchant", async function () {
      await expect(
        redemptionManager.connect(requester).approveRedemption(redemptionId)
      ).to.be.revertedWithCustomError(redemptionManager, "UnauthorizedAccess");
    });

    it("Should reject approval of already approved redemption", async function () {
      // Approve the redemption
      await redemptionManager.connect(merchant).approveRedemption(redemptionId);

      // Try to approve again
      await expect(
        redemptionManager.connect(merchant).approveRedemption(redemptionId)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidRedemptionStatus");
    });
  });

  describe("Redemption Completion", function () {
    let redemptionId;

    beforeEach(async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      // Create redemption request
      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      redemptionId = event.args.redemptionId;

      // Approve the redemption
      await redemptionManager.connect(merchant).approveRedemption(redemptionId);

      // Fast-forward time to after time lock period
      await ethers.provider.send("evm_increaseTime", [DEFAULT_TIME_LOCK + 1]);
      await ethers.provider.send("evm_mine");
    });

    it("Should allow merchant to complete redemption", async function () {
      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await expect(
        redemptionManager
          .connect(merchant)
          .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri)
      )
        .to.emit(redemptionManager, "RedemptionCompleted")
        .withArgs(redemptionId, requester.address, merchant.address, 0, ethers.BigNumber.from(0), ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(2); // COMPLETED
      expect(redemption.proofOfRedemption).to.equal(proofOfRedemption);
      expect(redemption.completionTime).to.be.gt(0);
    });

    it("Should allow merchant to complete redemption and create soulbound token", async function () {
      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = true;
      const soulboundTokenUri = "ipfs://soulbound-token";

      await expect(
        redemptionManager
          .connect(merchant)
          .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri)
      )
        .to.emit(redemptionManager, "SoulboundTokenCreated")
        .withArgs(redemptionId, requester.address, soulboundTokenUri, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.soulboundTokenUri).to.equal(soulboundTokenUri);
    });

    it("Should reject completion by non-merchant", async function () {
      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await expect(
        redemptionManager
          .connect(requester)
          .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri)
      ).to.be.revertedWithCustomError(redemptionManager, "UnauthorizedAccess");
    });

    it("Should reject completion before time lock expires", async function () {
      // Create another redemption
      const redemptionDetails = "ipfs://redemption-details-2";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      const redemptionId2 = event.args.redemptionId;

      // Approve the redemption
      await redemptionManager.connect(merchant).approveRedemption(redemptionId2);

      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await expect(
        redemptionManager
          .connect(merchant)
          .completeRedemption(redemptionId2, proofOfRedemption, createSoulbound, soulboundTokenUri)
      ).to.be.revertedWithCustomError(redemptionManager, "InsufficientTimeElapsed");
    });

    it("Should reject completion with empty proof", async function () {
      const proofOfRedemption = "";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await expect(
        redemptionManager
          .connect(merchant)
          .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidMetadata");
    });
  });

  describe("Redemption Cancellation", function () {
    let redemptionId;

    beforeEach(async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      // Create redemption request
      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      redemptionId = event.args.redemptionId;
    });

    it("Should allow requester to cancel redemption", async function () {
      const reason = "Changed my mind";

      await expect(redemptionManager.connect(requester).cancelRedemption(redemptionId, reason))
        .to.emit(redemptionManager, "RedemptionCancelled")
        .withArgs(redemptionId, requester.address, reason, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(3); // CANCELLED
    });

    it("Should allow merchant to cancel redemption", async function () {
      const reason = "Unable to fulfill";

      await expect(redemptionManager.connect(merchant).cancelRedemption(redemptionId, reason))
        .to.emit(redemptionManager, "RedemptionCancelled")
        .withArgs(redemptionId, merchant.address, reason, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(3); // CANCELLED
    });

    it("Should reject cancellation of completed redemption", async function () {
      const reason = "Test";

      // Approve and complete the redemption
      await redemptionManager.connect(merchant).approveRedemption(redemptionId);
      
      // Fast-forward time and complete
      await ethers.provider.send("evm_increaseTime", [DEFAULT_TIME_LOCK + 1]);
      await ethers.provider.send("evm_mine");

      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await redemptionManager
        .connect(merchant)
        .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri);

      // Try to cancel completed redemption
      await expect(
        redemptionManager.connect(requester).cancelRedemption(redemptionId, reason)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidRedemptionStatus");
    });
  });

  describe("Dispute Handling", function () {
    let redemptionId;

    beforeEach(async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      // Create redemption request
      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      redemptionId = event.args.redemptionId;

      // Approve the redemption
      await redemptionManager.connect(merchant).approveRedemption(redemptionId);
    });

    it("Should allow requester to dispute redemption", async function () {
      const reason = "Quality issue";

      await expect(redemptionManager.connect(requester).disputeRedemption(redemptionId, reason))
        .to.emit(redemptionManager, "RedemptionDisputed")
        .withArgs(redemptionId, requester.address, merchant.address, reason, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(4); // DISPUTED
    });

    it("Should allow merchant to dispute redemption", async function () {
      const reason = "Delivery issue";

      await expect(redemptionManager.connect(merchant).disputeRedemption(redemptionId, reason))
        .to.emit(redemptionManager, "RedemptionDisputed")
        .withArgs(redemptionId, requester.address, merchant.address, reason, ethers.BigNumber.from(0));

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.status).to.equal(4); // DISPUTED
    });

    it("Should reject dispute by unauthorized party", async function () {
      const reason = "Third party dispute";

      await expect(
        redemptionManager.connect(addr1).disputeRedemption(redemptionId, reason)
      ).to.be.revertedWithCustomError(redemptionManager, "UnauthorizedAccess");
    });

    it("Should reject dispute of completed redemption", async function () {
      const reason = "Test dispute";

      // Complete the redemption first
      await ethers.provider.send("evm_increaseTime", [DEFAULT_TIME_LOCK + 1]);
      await ethers.provider.send("evm_mine");

      const proofOfRedemption = "ipfs://proof-of-redemption";
      const createSoulbound = false;
      const soulboundTokenUri = "";

      await redemptionManager
        .connect(merchant)
        .completeRedemption(redemptionId, proofOfRedemption, createSoulbound, soulboundTokenUri);

      // Try to dispute completed redemption
      await expect(
        redemptionManager.connect(requester).disputeRedemption(redemptionId, reason)
      ).to.be.revertedWithCustomError(redemptionManager, "InvalidRedemptionStatus");
    });

    it("Should allow owner to resolve dispute in favor of requester", async function () {
      const reason = "Quality issue";
      await redemptionManager.connect(requester).disputeRedemption(redemptionId, reason);

      await redemptionManager.connect(owner).resolveDispute(redemptionId, 1, "Requester wins");

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.disputeResolution).to.equal(1); // RESOLVED_BUYER
      expect(redemption.status).to.equal(3); // CANCELLED
    });

    it("Should allow owner to resolve dispute in favor of merchant", async function () {
      const reason = "Quality issue";
      await redemptionManager.connect(requester).disputeRedemption(redemptionId, reason);

      await redemptionManager.connect(owner).resolveDispute(redemptionId, 2, "Merchant wins");

      const redemption = await redemptionManager.getRedemption(redemptionId);
      expect(redemption.disputeResolution).to.equal(2); // RESOLVED_MERCHANT
      expect(redemption.status).to.equal(2); // COMPLETED
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update redemption fees", async function () {
      const newBaseFee = ethers.utils.parseEther("0.02");
      const newTypeFees = [
        ethers.utils.parseEther("0.01"),
        ethers.utils.parseEther("0.005"),
        ethers.utils.parseEther("0.02"),
        ethers.utils.parseEther("0.015")
      ];

      await expect(redemptionManager.connect(owner).updateRedemptionFees(newBaseFee, newTypeFees))
        .to.emit(redemptionManager, "RedemptionFeeUpdated")
        .withArgs(BASE_REDEMPTION_FEE, newBaseFee, ethers.BigNumber.from(0));

      const config = await redemptionManager.config();
      expect(config.baseRedemptionFee).to.equal(newBaseFee);
    });

    it("Should reject fee update by non-owner", async function () {
      const newBaseFee = ethers.utils.parseEther("0.02");
      const newTypeFees = [
        ethers.utils.parseEther("0.01"),
        ethers.utils.parseEther("0.005"),
        ethers.utils.parseEther("0.02"),
        ethers.utils.parseEther("0.015")
      ];

      await expect(
        redemptionManager.connect(requester).updateRedemptionFees(newBaseFee, newTypeFees)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update time locks", async function () {
      const newDefaultTimeLock = 14 * 24 * 60 * 60; // 14 days
      const newTypeTimeLocks = [7 * 24 * 60 * 60, 1 * 24 * 60 * 60, 14 * 24 * 60 * 60, 3 * 24 * 60 * 60];

      await redemptionManager.connect(owner).updateTimeLocks(newDefaultTimeLock, newTypeTimeLocks);

      const config = await redemptionManager.config();
      expect(config.timeLockPeriod).to.equal(newDefaultTimeLock);
    });
  });

  describe("View Functions", function () {
    let redemptionId;

    beforeEach(async function () {
      const redemptionDetails = "ipfs://redemption-details";
      const redemptionType = 0; // PHYSICAL_DELIVERY

      // Create redemption request
      const tx = await redemptionManager
        .connect(requester)
        .requestRedemption(merchant.address, nft.address, 0, redemptionType, redemptionDetails, 0);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'RedemptionRequested');
      redemptionId = event.args.redemptionId;
    });

    it("Should return correct requester redemptions", async function () {
      const requesterRedemptions = await redemptionManager.getRequesterRedemptions(requester.address);
      expect(requesterRedemptions.length).to.equal(1);
      expect(requesterRedemptions[0]).to.equal(redemptionId);
    });

    it("Should return correct merchant redemptions", async function () {
      const merchantRedemptions = await redemptionManager.getMerchantRedemptions(merchant.address);
      expect(merchantRedemptions.length).to.equal(1);
      expect(merchantRedemptions[0]).to.equal(redemptionId);
    });

    it("Should check if token can be redeemed", async function () {
      // Should return false since token is in redemption
      expect(await redemptionManager.canRedeemToken(nft.address, 0)).to.be.false;

      // Cancel the redemption
      await redemptionManager.connect(requester).cancelRedemption(redemptionId, "Test");

      // Should return true after cancellation
      expect(await redemptionManager.canRedeemToken(nft.address, 0)).to.be.true;
    });
  });
});