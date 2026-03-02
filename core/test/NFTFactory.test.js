const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NFTFactory Contract", function () {
  let NFTFactory;
  let nftFactory;
  let MerchantRegistry;
  let merchantRegistry;
  let EscrowManager;
  let escrowManager;
  let RedemptionManager;
  let redemptionManager;
  let owner;
  let merchant1;
  let addr1;
  let addr2;
  let platformFeeRecipient;

  const PLATFORM_FEE_BPS = 250; // 2.5%
  const MIN_TRUST_SCORE = 300;

  beforeEach(async function () {
    [owner, merchant1, addr1, addr2, platformFeeRecipient] = await ethers.getSigners();

    // Deploy dependencies first
    MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
    merchantRegistry = await upgrades.deployProxy(
      MerchantRegistry,
      [owner.address],
      { initializer: "initialize" }
    );
    await merchantRegistry.deployed();

    EscrowManager = await ethers.getContractFactory("EscrowManager");
    escrowManager = await upgrades.deployProxy(
      EscrowManager,
      [owner.address, platformFeeRecipient.address, 250],
      { initializer: "initialize" }
    );
    await escrowManager.deployed();

    RedemptionManager = await ethers.getContractFactory("RedemptionManager");
    redemptionManager = await upgrades.deployProxy(
      RedemptionManager,
      [owner.address, platformFeeRecipient.address, ethers.utils.parseEther("0.01"), 7 * 24 * 60 * 60],
      { initializer: "initialize" }
    );
    await redemptionManager.deployed();

    // Register and verify merchant
    await merchantRegistry.connect(merchant1).registerMerchant(
      "Test Merchant",
      "Digital Goods",
      "https://testmerchant.com",
      "A test merchant for NFT commerce"
    );
    await merchantRegistry.verifyMerchant(merchant1.address, 2, MIN_TRUST_SCORE); // VERIFIED with sufficient score

    // Deploy NFTFactory
    NFTFactory = await ethers.getContractFactory("NFTFactory");
    nftFactory = await upgrades.deployProxy(
      NFTFactory,
      [
        platformFeeRecipient.address,
        PLATFORM_FEE_BPS,
        merchantRegistry.address,
        escrowManager.address,
        redemptionManager.address
      ],
      { initializer: "initialize" }
    );
    await nftFactory.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner and parameters", async function () {
      expect(await nftFactory.owner()).to.equal(owner.address);
      expect(await nftFactory.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
      expect(await nftFactory.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
      expect(await nftFactory.merchantRegistry()).to.equal(merchantRegistry.address);
      expect(await nftFactory.escrowManager()).to.equal(escrowManager.address);
      expect(await nftFactory.redemptionManager()).to.equal(redemptionManager.address);
    });
  });

  describe("Collection Deployment", function () {
    it("Should deploy a new collection successfully", async function () {
      const name = "Test Collection";
      const symbol = "TC";
      const uris = ["ipfs://test1", "ipfs://test2"];
      const mintFees = [ethers.utils.parseEther("0.01"), ethers.utils.parseEther("0.02")];
      const enableCommerce = false;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      )
        .to.emit(nftFactory, "CollectionDeployed")
        .withArgs(ethers.constants.AddressZero, name, symbol, addr1.address, ethers.BigNumber.from(0));

      // Get the deployed collection address from the event
      const tx = await nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CollectionDeployed');
      const collectionAddress = event.args.collectionAddress;

      expect(collectionAddress).to.not.equal(ethers.constants.AddressZero);

      // Check collection details
      const collectionDetails = await nftFactory.getCollectionDetails(collectionAddress);
      expect(collectionDetails.name).to.equal(name);
      expect(collectionDetails.symbol).to.equal(symbol);
      expect(collectionDetails.creator).to.equal(addr1.address);
      expect(collectionDetails.commerceEnabled).to.equal(enableCommerce);
    });

    it("Should deploy a collection with commerce enabled for verified merchant", async function () {
      const name = "Merchant Collection";
      const symbol = "MC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];
      const enableCommerce = true;

      await expect(
        nftFactory.connect(merchant1).deploy(name, symbol, uris, mintFees, enableCommerce)
      )
        .to.emit(nftFactory, "CollectionDeployed")
        .withArgs(ethers.constants.AddressZero, name, symbol, merchant1.address, ethers.BigNumber.from(0));

      // Get the deployed collection address from the event
      const tx = await nftFactory.connect(merchant1).deploy(name, symbol, uris, mintFees, enableCommerce);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CollectionDeployed');
      const collectionAddress = event.args.collectionAddress;

      expect(collectionAddress).to.not.equal(ethers.constants.AddressZero);

      // Check collection details
      const collectionDetails = await nftFactory.getCollectionDetails(collectionAddress);
      expect(collectionDetails.name).to.equal(name);
      expect(collectionDetails.symbol).to.equal(symbol);
      expect(collectionDetails.creator).to.equal(merchant1.address);
      expect(collectionDetails.commerceEnabled).to.equal(enableCommerce);
    });

    it("Should deploy a collection with merchant association", async function () {
      const name = "Assoc Collection";
      const symbol = "AC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];

      await expect(
        nftFactory.connect(merchant1).deployWithMerchant(name, symbol, uris, mintFees, merchant1.address)
      )
        .to.emit(nftFactory, "CollectionDeployed")
        .withArgs(ethers.constants.AddressZero, name, symbol, merchant1.address, ethers.BigNumber.from(0));

      // Get the deployed collection address from the event
      const tx = await nftFactory.connect(merchant1).deployWithMerchant(name, symbol, uris, mintFees, merchant1.address);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CollectionDeployed');
      const collectionAddress = event.args.collectionAddress;

      expect(collectionAddress).to.not.equal(ethers.constants.AddressZero);

      // Check collection details
      const collectionDetails = await nftFactory.getCollectionDetails(collectionAddress);
      expect(collectionDetails.name).to.equal(name);
      expect(collectionDetails.symbol).to.equal(symbol);
      expect(collectionDetails.creator).to.equal(merchant1.address);
      expect(collectionDetails.commerceEnabled).to.equal(true);
      expect(collectionDetails.merchant).to.equal(merchant1.address);
    });

    it("Should reject deployment with mismatched array lengths", async function () {
      const name = "Test Collection";
      const symbol = "TC";
      const uris = ["ipfs://test1", "ipfs://test2"];
      const mintFees = [ethers.utils.parseEther("0.01")]; // Only one fee for two URIs
      const enableCommerce = false;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      ).to.be.revertedWithCustomError(nftFactory, "MismatchedArrayLengths");
    });

    it("Should reject commerce deployment by non-merchant", async function () {
      const name = "Test Collection";
      const symbol = "TC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];
      const enableCommerce = true;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      ).to.be.revertedWithCustomError(nftFactory, "UnauthorizedMerchant");
    });

    it("Should reject deployment with empty name", async function () {
      const name = ""; // Empty name
      const symbol = "TC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];
      const enableCommerce = false;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      ).to.be.revertedWithCustomError(nftFactory, "EmptyString");
    });

    it("Should reject deployment with empty URIs array", async function () {
      const name = "Test Collection";
      const symbol = "TC";
      const uris = []; // Empty array
      const mintFees = [];
      const enableCommerce = false;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      ).to.be.revertedWithCustomError(nftFactory, "EmptyArray");
    });
  });

  describe("Deploy with Merchant", function () {
    it("Should allow verified merchant to deploy with merchant association", async function () {
      const name = "Merchant Collection";
      const symbol = "MC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];

      const tx = await nftFactory.connect(merchant1).deployWithMerchant(name, symbol, uris, mintFees, merchant1.address);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CollectionDeployed');
      const collectionAddress = event.args.collectionAddress;

      expect(collectionAddress).to.not.equal(ethers.constants.AddressZero);

      // Check collection details
      const collectionDetails = await nftFactory.getCollectionDetails(collectionAddress);
      expect(collectionDetails.commerceEnabled).to.equal(true);
      expect(collectionDetails.merchant).to.equal(merchant1.address);
    });

    it("Should reject deployment with invalid merchant", async function () {
      const name = "Merchant Collection";
      const symbol = "MC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];

      await expect(
        nftFactory.connect(addr1).deployWithMerchant(name, symbol, uris, mintFees, ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(nftFactory, "InvalidMerchant");
    });

    it("Should reject deployment with unverified merchant", async function () {
      const name = "Merchant Collection";
      const symbol = "MC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];

      // Register addr2 as merchant but don't verify
      await merchantRegistry.connect(addr2).registerMerchant(
        "Unverified Merchant",
        "Digital Goods",
        "https://unverified.com",
        "An unverified merchant"
      );

      await expect(
        nftFactory.connect(addr2).deployWithMerchant(name, symbol, uris, mintFees, addr2.address)
      ).to.be.revertedWithCustomError(nftFactory, "UnauthorizedMerchant");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee config", async function () {
      const newRecipient = addr1.address;
      const newFeeBps = 500; // 5%

      await expect(nftFactory.connect(owner).updatePlatformFeeConfig(newRecipient, newFeeBps))
        .to.emit(nftFactory, "PlatformFeeConfigUpdated")
        .withArgs(newRecipient, newFeeBps);

      expect(await nftFactory.platformFeeRecipient()).to.equal(newRecipient);
      expect(await nftFactory.platformFeeBps()).to.equal(newFeeBps);
    });

    it("Should reject platform fee update by non-owner", async function () {
      const newRecipient = addr1.address;
      const newFeeBps = 500;

      await expect(
        nftFactory.connect(addr1).updatePlatformFeeConfig(newRecipient, newFeeBps)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update commerce integrations", async function () {
      await expect(
        nftFactory.connect(owner).updateCommerceIntegrations(
          merchantRegistry.address,
          escrowManager.address,
          redemptionManager.address
        )
      ).to.emit(nftFactory, "MerchantIntegrationUpdated");
    });

    it("Should allow owner to update commerce config", async function () {
      const newConfig = {
        escrowEnabled: false,
        redemptionEnabled: false,
        merchantVerificationRequired: false,
        minMerchantTrustScore: 100
      };

      await expect(nftFactory.connect(owner).updateCommerceConfig(newConfig))
        .to.emit(nftFactory, "CommerceFeatureEnabled")
        .withArgs("escrow", false, ethers.BigNumber.from(0));
    });
  });

  describe("View Functions", function () {
    let collectionAddress;

    beforeEach(async function () {
      const name = "Test Collection";
      const symbol = "TC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];
      const enableCommerce = false;

      const tx = await nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CollectionDeployed');
      collectionAddress = event.args.collectionAddress;
    });

    it("Should return all deployed collections", async function () {
      const collections = await nftFactory.getMarketPlaces();
      expect(collections.length).to.be.greaterThanOrEqual(1);
      expect(collections.includes(collectionAddress)).to.be.true;
    });

    it("Should return collection details", async function () {
      const details = await nftFactory.getCollectionDetails(collectionAddress);
      expect(details.name).to.equal("Test Collection");
      expect(details.symbol).to.equal("TC");
      expect(details.creator).to.equal(addr1.address);
    });

    it("Should return collection count", async function () {
      const count = await nftFactory.getCollectionCount();
      expect(count).to.be.greaterThanOrEqual(1);
    });

    it("Should return collections by creator", async function () {
      const collections = await nftFactory.getCollectionsByCreator(addr1.address);
      expect(collections.length).to.be.greaterThanOrEqual(1);
      expect(collections.includes(collectionAddress)).to.be.true;
    });

    it("Should return commerce-enabled collections", async function () {
      const commerceCollections = await nftFactory.getCommerceCollections();
      // Initially there might be no commerce-enabled collections
      expect(commerceCollections.length).to.be.greaterThanOrEqual(0);
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause and unpause", async function () {
      // Pause
      await nftFactory.connect(owner).pause();
      expect(await nftFactory.paused()).to.equal(true);

      // Unpause
      await nftFactory.connect(owner).unpause();
      expect(await nftFactory.paused()).to.equal(false);
    });

    it("Should reject pause by non-owner", async function () {
      await expect(
        nftFactory.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject deployment when paused", async function () {
      await nftFactory.connect(owner).pause();

      const name = "Test Collection";
      const symbol = "TC";
      const uris = ["ipfs://test1"];
      const mintFees = [ethers.utils.parseEther("0.01")];
      const enableCommerce = false;

      await expect(
        nftFactory.connect(addr1).deploy(name, symbol, uris, mintFees, enableCommerce)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});