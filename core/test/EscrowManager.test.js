const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("EscrowManager Contract", function () {
  let EscrowManager;
  let escrowManager;
  let SimpleCollectible;
  let nft;
  let owner;
  let buyer;
  let seller;
  let addr1;
  let platformFeeRecipient;

  const PLATFORM_FEE_BPS = 250; // 2.5%
  const MIN_TIME_LOCK = 7 * 24 * 60 * 60; // 7 days
  const MAX_TIME_LOCK = 90 * 24 * 60 * 60; // 90 days

  beforeEach(async function () {
    [owner, buyer, seller, addr1, platformFeeRecipient] = await ethers.getSigners();

    // Deploy EscrowManager
    EscrowManager = await ethers.getContractFactory("EscrowManager");
    escrowManager = await upgrades.deployProxy(
      EscrowManager,
      [owner.address, platformFeeRecipient.address, PLATFORM_FEE_BPS],
      { initializer: "initialize" }
    );
    await escrowManager.deployed();

    // Deploy a test NFT for escrow
    SimpleCollectible = await ethers.getContractFactory("SimpleCollectible");
    nft = await upgrades.deployProxy(
      SimpleCollectible,
      ["TestNFT", "TNFT", ["ipfs://test"], [ethers.utils.parseEther("0.01")], owner.address, platformFeeRecipient.address, 250],
      { initializer: "initialize" }
    );
    await nft.deployed();

    // Mint an NFT to the seller
    await nft.connect(seller).createCollectible(seller.address, 0, { value: ethers.utils.parseEther("0.01") });
  });

  describe("Deployment", function () {
    it("Should set the correct owner and parameters", async function () {
      expect(await escrowManager.owner()).to.equal(owner.address);
      expect(await escrowManager.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
      expect(await escrowManager.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
      expect(await escrowManager.minTimeLock()).to.equal(MIN_TIME_LOCK);
      expect(await escrowManager.maxTimeLock()).to.equal(MAX_TIME_LOCK);
    });
  });

  describe("Escrow Creation", function () {
    it("Should create an escrow successfully", async function () {
      const purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      await expect(
        escrowManager
          .connect(buyer)
          .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount })
      )
        .to.emit(escrowManager, "EscrowCreated")
        .withArgs(1, buyer.address, seller.address, nft.address, 0, purchaseAmount, ethers.BigNumber.from(0), ethers.BigNumber.from(0));

      const escrow = await escrowManager.getEscrow(1);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.nftContract).to.equal(nft.address);
      expect(escrow.tokenId).to.equal(0);
      expect(escrow.amount).to.equal(purchaseAmount);
      expect(escrow.status).to.equal(0); // ACTIVE
    });

    it("Should reject escrow creation with zero address", async function () {
      const purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      await expect(
        escrowManager
          .connect(buyer)
          .createEscrow(ethers.constants.AddressZero, nft.address, 0, timeLock, { value: purchaseAmount })
      ).to.be.revertedWithCustomError(escrowManager, "InvalidAddress");
    });

    it("Should reject escrow creation with insufficient time lock", async function () {
      const purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK - 100; // Less than minimum

      await expect(
        escrowManager
          .connect(buyer)
          .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount })
      ).to.be.revertedWithCustomError(escrowManager, "InvalidTimeLock");
    });

    it("Should reject escrow creation with excessive time lock", async function () {
      const purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MAX_TIME_LOCK + 100; // More than maximum

      await expect(
        escrowManager
          .connect(buyer)
          .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount })
      ).to.be.revertedWithCustomError(escrowManager, "InvalidTimeLock");
    });

    it("Should reject escrow creation with zero value", async function () {
      const timeLock = MIN_TIME_LOCK;

      await expect(
        escrowManager
          .connect(buyer)
          .createEscrow(seller.address, nft.address, 0, timeLock, { value: 0 })
      ).to.be.revertedWithCustomError(escrowManager, "InsufficientFunds");
    });
  });

  describe("Escrow Release", function () {
    let escrowId;
    let purchaseAmount;

    beforeEach(async function () {
      purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      // Create escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      escrowId = event.args.escrowId;

      // Fast-forward time to after release time
      await ethers.provider.send("evm_increaseTime", [timeLock + 1]);
      await ethers.provider.send("evm_mine");
    });

    it("Should release escrow funds to seller", async function () {
      const platformFee = purchaseAmount.mul(PLATFORM_FEE_BPS).div(10000);
      const sellerAmount = purchaseAmount.sub(platformFee);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platformFeeRecipient.address);

      await expect(escrowManager.connect(buyer).releaseEscrow(escrowId))
        .to.emit(escrowManager, "EscrowReleased")
        .withArgs(escrowId, buyer.address, seller.address, ethers.BigNumber.from(0), ethers.BigNumber.from(0));

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platformFeeRecipient.address);

      // Check balances increased appropriately
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
      expect(platformBalanceAfter).to.be.gt(platformBalanceBefore);

      // Check that NFT was transferred to buyer
      expect(await nft.ownerOf(0)).to.equal(buyer.address);

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // RELEASED
    });

    it("Should reject release if not buyer", async function () {
      await expect(
        escrowManager.connect(seller).releaseEscrow(escrowId)
      ).to.be.revertedWithCustomError(escrowManager, "UnauthorizedAccess");
    });

    it("Should reject release before time lock expires", async function () {
      // Create another escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, MIN_TIME_LOCK, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      const escrowId2 = event.args.escrowId;

      await expect(
        escrowManager.connect(buyer).releaseEscrow(escrowId2)
      ).to.be.revertedWithCustomError(escrowManager, "EscrowNotExpired");
    });
  });

  describe("Escrow Cancellation", function () {
    let escrowId;
    let purchaseAmount;

    beforeEach(async function () {
      purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      // Create escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      escrowId = event.args.escrowId;
    });

    it("Should allow seller to cancel escrow", async function () {
      const reason = "Changed my mind";

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await expect(escrowManager.connect(seller).cancelEscrow(escrowId, reason))
        .to.emit(escrowManager, "EscrowCancelled")
        .withArgs(escrowId, buyer.address, seller.address, reason, ethers.BigNumber.from(0));

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Check that buyer was refunded
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(2); // CANCELLED
    });

    it("Should reject cancellation if not seller", async function () {
      const reason = "Changed my mind";

      await expect(
        escrowManager.connect(buyer).cancelEscrow(escrowId, reason)
      ).to.be.revertedWithCustomError(escrowManager, "UnauthorizedAccess");
    });

    it("Should reject cancellation of already cancelled escrow", async function () {
      const reason = "Changed my mind";

      // Cancel the escrow
      await escrowManager.connect(seller).cancelEscrow(escrowId, reason);

      // Try to cancel again
      await expect(
        escrowManager.connect(seller).cancelEscrow(escrowId, reason)
      ).to.be.revertedWithCustomError(escrowManager, "EscrowAlreadyCancelled");
    });
  });

  describe("Refund Request", function () {
    let escrowId;
    let purchaseAmount;

    beforeEach(async function () {
      purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      // Create escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      escrowId = event.args.escrowId;
    });

    it("Should allow buyer to request refund before time lock", async function () {
      const reason = "Changed my mind";

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await expect(escrowManager.connect(buyer).requestRefund(escrowId, reason))
        .to.emit(escrowManager, "EscrowRefunded")
        .withArgs(escrowId, buyer.address, purchaseAmount, ethers.BigNumber.from(0));

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Check that buyer was refunded
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(4); // REFUNDED
    });

    it("Should reject refund request after time lock expires", async function () {
      const reason = "Changed my mind";

      // Fast-forward time to after release time
      await ethers.provider.send("evm_increaseTime", [MIN_TIME_LOCK + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        escrowManager.connect(buyer).requestRefund(escrowId, reason)
      ).to.be.revertedWithCustomError(escrowManager, "EscrowNotExpired");
    });

    it("Should reject refund request if not buyer", async function () {
      const reason = "Changed my mind";

      await expect(
        escrowManager.connect(seller).requestRefund(escrowId, reason)
      ).to.be.revertedWithCustomError(escrowManager, "UnauthorizedAccess");
    });
  });

  describe("Dispute Handling", function () {
    let escrowId;
    let purchaseAmount;

    beforeEach(async function () {
      purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      // Create escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      escrowId = event.args.escrowId;
    });

    it("Should allow buyer to dispute escrow", async function () {
      const reason = "Quality issue";

      await expect(escrowManager.connect(buyer).disputeEscrow(escrowId, reason))
        .to.emit(escrowManager, "EscrowDisputed")
        .withArgs(escrowId, buyer.address, seller.address, reason, ethers.BigNumber.from(0));

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(3); // DISPUTED
    });

    it("Should allow seller to dispute escrow", async function () {
      const reason = "Delivery issue";

      await expect(escrowManager.connect(seller).disputeEscrow(escrowId, reason))
        .to.emit(escrowManager, "EscrowDisputed")
        .withArgs(escrowId, buyer.address, seller.address, reason, ethers.BigNumber.from(0));

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(3); // DISPUTED
    });

    it("Should reject dispute by unauthorized party", async function () {
      const reason = "Third party dispute";

      await expect(
        escrowManager.connect(addr1).disputeEscrow(escrowId, reason)
      ).to.be.revertedWithCustomError(escrowManager, "UnauthorizedAccess");
    });

    it("Should allow owner to resolve dispute in favor of seller", async function () {
      const reason = "Quality issue";
      await escrowManager.connect(buyer).disputeEscrow(escrowId, reason);

      const platformFee = purchaseAmount.mul(PLATFORM_FEE_BPS).div(10000);
      const sellerAmount = purchaseAmount.sub(platformFee);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platformFeeRecipient.address);

      await escrowManager.connect(owner).resolveDispute(escrowId, true, "Seller wins");

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platformFeeRecipient.address);

      // Check that funds went to seller and platform
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
      expect(platformBalanceAfter).to.be.gt(platformBalanceBefore);

      // Check that NFT was transferred to buyer
      expect(await nft.ownerOf(0)).to.equal(buyer.address);

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // RELEASED
    });

    it("Should allow owner to resolve dispute in favor of buyer", async function () {
      const reason = "Quality issue";
      await escrowManager.connect(buyer).disputeEscrow(escrowId, reason);

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await escrowManager.connect(owner).resolveDispute(escrowId, false, "Buyer wins");

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Check that funds were refunded to buyer
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

      // Check escrow status
      const escrow = await escrowManager.getEscrow(escrowId);
      expect(escrow.status).to.equal(4); // REFUNDED
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 500; // 5%

      await expect(escrowManager.connect(owner).updatePlatformFee(newFee))
        .to.emit(escrowManager, "FeeUpdated")
        .withArgs(PLATFORM_FEE_BPS, newFee, ethers.BigNumber.from(0));

      expect(await escrowManager.platformFeeBps()).to.equal(newFee);
    });

    it("Should reject platform fee update by non-owner", async function () {
      const newFee = 500;

      await expect(
        escrowManager.connect(buyer).updatePlatformFee(newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject platform fee update with invalid value", async function () {
      const invalidFee = 1001; // More than 10%

      await expect(
        escrowManager.connect(owner).updatePlatformFee(invalidFee)
      ).to.be.revertedWithCustomError(escrowManager, "InvalidFeeBps");
    });

    it("Should allow owner to update time lock limits", async function () {
      const newMin = 5 * 24 * 60 * 60; // 5 days
      const newMax = 60 * 24 * 60 * 60; // 60 days

      await escrowManager.connect(owner).updateTimeLockLimits(newMin, newMax);

      expect(await escrowManager.minTimeLock()).to.equal(newMin);
      expect(await escrowManager.maxTimeLock()).to.equal(newMax);
    });

    it("Should allow owner to update fee recipient", async function () {
      const newRecipient = addr1.address;

      await escrowManager.connect(owner).updateFeeRecipient(newRecipient);

      expect(await escrowManager.platformFeeRecipient()).to.equal(newRecipient);
    });
  });

  describe("View Functions", function () {
    let escrowId;
    let purchaseAmount;

    beforeEach(async function () {
      purchaseAmount = ethers.utils.parseEther("1.0");
      const timeLock = MIN_TIME_LOCK;

      // Create escrow
      const tx = await escrowManager
        .connect(buyer)
        .createEscrow(seller.address, nft.address, 0, timeLock, { value: purchaseAmount });
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'EscrowCreated');
      escrowId = event.args.escrowId;
    });

    it("Should return correct buyer escrows", async function () {
      const buyerEscrows = await escrowManager.getBuyerEscrows(buyer.address);
      expect(buyerEscrows.length).to.equal(1);
      expect(buyerEscrows[0]).to.equal(escrowId);
    });

    it("Should return correct seller escrows", async function () {
      const sellerEscrows = await escrowManager.getSellerEscrows(seller.address);
      expect(sellerEscrows.length).to.equal(1);
      expect(sellerEscrows[0]).to.equal(escrowId);
    });

    it("Should check if escrow can be released", async function () {
      // Should return false initially
      expect(await escrowManager.canReleaseEscrow(escrowId)).to.be.false;

      // Fast-forward time to after release time
      await ethers.provider.send("evm_increaseTime", [timeLock + 1]);
      await ethers.provider.send("evm_mine");

      // Should return true now
      expect(await escrowManager.canReleaseEscrow(escrowId)).to.be.true;
    });
  });
});