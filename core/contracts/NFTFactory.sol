// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {SimpleCollectible} from "./SimpleCollectible.sol";
import {MerchantRegistry} from "./MerchantRegistry.sol";
import {EscrowManager} from "./EscrowManager.sol";
import {RedemptionManager} from "./RedemptionManager.sol";

/**
 * @title NFTFactory (Commerce Enhanced)
 * @dev Enhanced factory contract for Web3 commerce with merchant integration
 * @author NFT Factory Team
 */
contract NFTFactory is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ============ Errors ============
    error MismatchedArrayLengths();
    error EmptyString();
    error EmptyArray();
    error InvalidFeeBps();
    error CollectionNotFound();
    error InvalidPlatformFeeRecipient();
    error UnauthorizedMerchant();
    error InvalidMerchant();
    error InsufficientMerchantTier();
    error InvalidIntegrationAddress();

    // ============ Events ============
    event CollectionDeployed(
        address indexed collectionAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 timestamp
    );
    event PlatformFeeConfigUpdated(
        address indexed newRecipient,
        uint96 newFeeBps
    );
    event CollectionImplementationUpdated(
        address indexed newImplementation
    );
    event MerchantIntegrationUpdated(
        address indexed merchantRegistry,
        address indexed escrowManager,
        address indexed redemptionManager
    );
    event CommerceFeatureEnabled(
        string feature,
        bool enabled,
        uint256 timestamp
    );

    // ============ Structs ============
    struct CollectionInfo {
        string name;
        string symbol;
        address creator;
        uint256 deployedAt;
        uint256 uriCount;
        bool commerceEnabled; // Whether commerce features are enabled
        address merchant; // Associated merchant address
    }
    
    struct CommerceConfig {
        bool escrowEnabled;
        bool redemptionEnabled;
        bool merchantVerificationRequired;
        uint256 minMerchantTrustScore;
    }

    // ============ State Variables ============
    /// @dev Array of all deployed collection addresses
    address[] public marketplace;
    
    /// @dev Mapping from collection address to its details
    mapping(address => CollectionInfo) public collectionDetails;
    
    /// @dev Platform fee recipient (NFT Factory)
    address public platformFeeRecipient;
    
    /// @dev Platform fee in basis points (e.g., 250 = 2.5%)
    uint96 public platformFeeBps;
    
    /// @dev Implementation contract for new collections
    address public collectionImplementation;
    
    /// @dev Merchant registry integration
    MerchantRegistry public merchantRegistry;
    
    /// @dev Escrow manager integration
    EscrowManager public escrowManager;
    
    /// @dev Redemption manager integration
    RedemptionManager public redemptionManager;
    
    /// @dev Commerce configuration
    CommerceConfig public commerceConfig;

    // ============ Constants ============
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000; // 10% max
    uint256 public constant VERSION = 2; // Updated version

    // ============ Modifiers ============
    modifier validString(string memory str) {
        if (bytes(str).length == 0) revert EmptyString();
        _;
    }
    
    modifier validArray(string[] memory arr) {
        if (arr.length == 0) revert EmptyArray();
        _;
    }
    
    modifier onlyVerifiedMerchant() {
        if (address(merchantRegistry) != address(0)) {
            if (!merchantRegistry.isVerifiedMerchant(msg.sender)) 
                revert UnauthorizedMerchant();
        }
        _;
    }
    
    modifier commerceEnabled() {
        if (address(merchantRegistry) == address(0) || 
            address(escrowManager) == address(0) || 
            address(redemptionManager) == address(0)) {
            revert InvalidIntegrationAddress();
        }
        _;
    }

    // ============ Constructor & Initializer ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the enhanced factory contract
     * @param _platformFeeRecipient Address to receive platform royalties
     * @param _platformFeeBps Platform fee in basis points (max 10%)
     * @param _merchantRegistry Merchant registry address
     * @param _escrowManager Escrow manager address
     * @param _redemptionManager Redemption manager address
     */
    function initialize(
        address _platformFeeRecipient,
        uint96 _platformFeeBps,
        address _merchantRegistry,
        address _escrowManager,
        address _redemptionManager
    ) public initializer {
        if (_platformFeeRecipient == address(0)) revert InvalidPlatformFeeRecipient();
        if (_platformFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFeeBps();
        
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;
        
        // Set integration addresses
        if (_merchantRegistry != address(0)) {
            merchantRegistry = MerchantRegistry(_merchantRegistry);
        }
        if (_escrowManager != address(0)) {
            escrowManager = EscrowManager(payable(_escrowManager));
        }
        if (_redemptionManager != address(0)) {
            redemptionManager = RedemptionManager(payable(_redemptionManager));
        }
        
        // Deploy the implementation contract for collections
        collectionImplementation = address(new SimpleCollectible());
        
        // Set default commerce configuration
        commerceConfig = CommerceConfig({
            escrowEnabled: true,
            redemptionEnabled: true,
            merchantVerificationRequired: true,
            minMerchantTrustScore: 300
        });
    }

    // ============ External Functions ============
    
    /**
     * @notice Deploys a new NFT collection with commerce features
     * @param name Collection name
     * @param symbol Collection symbol
     * @param _URIs Array of token URIs for different types
     * @param _mintFees Array of mint fees corresponding to each URI
     * @param _enableCommerce Whether to enable commerce features
     * @return collectionAddress Address of the newly deployed collection
     */
    function deploy(
        string memory name,
        string memory symbol,
        string[] memory _URIs,
        uint256[] memory _mintFees,
        bool _enableCommerce
    ) 
        external 
        whenNotPaused 
        nonReentrant
        validString(name)
        validString(symbol)
        validArray(_URIs)
        returns (address collectionAddress) 
    {
        if (_URIs.length != _mintFees.length) revert MismatchedArrayLengths();
        
        // Check merchant requirements if commerce is enabled
        if (_enableCommerce && commerceConfig.merchantVerificationRequired) {
            _validateMerchantRequirements();
        }
        
        // Deploy proxy for the new collection
        bytes memory initData = abi.encodeWithSelector(
            SimpleCollectible.initialize.selector,
            name,
            symbol,
            _URIs,
            _mintFees,
            msg.sender,
            platformFeeRecipient,
            platformFeeBps
        );
        
        collectionAddress = _deployProxy(collectionImplementation, initData);
        
        // Track the collection
        marketplace.push(collectionAddress);
        collectionDetails[collectionAddress] = CollectionInfo({
            name: name,
            symbol: symbol,
            creator: msg.sender,
            deployedAt: block.timestamp,
            uriCount: _URIs.length,
            commerceEnabled: _enableCommerce,
            merchant: _enableCommerce ? msg.sender : address(0)
        });
        
        emit CollectionDeployed(
            collectionAddress,
            name,
            symbol,
            msg.sender,
            block.timestamp
        );
        
        return collectionAddress;
    }
    
    /**
     * @notice Deploy collection with merchant association (commerce enabled)
     * @param name Collection name
     * @param symbol Collection symbol
     * @param _URIs Array of token URIs
     * @param _mintFees Array of mint fees
     * @param _merchant Associated merchant address
     */
    function deployWithMerchant(
        string memory name,
        string memory symbol,
        string[] memory _URIs,
        uint256[] memory _mintFees,
        address _merchant
    ) 
        external 
        whenNotPaused 
        nonReentrant
        commerceEnabled
        validString(name)
        validString(symbol)
        validArray(_URIs)
        returns (address collectionAddress) 
    {
        if (_URIs.length != _mintFees.length) revert MismatchedArrayLengths();
        if (_merchant == address(0)) revert InvalidMerchant();
        
        // Verify merchant is registered and meets requirements
        if (!merchantRegistry.isVerifiedMerchant(_merchant)) revert UnauthorizedMerchant();
        
        MerchantRegistry.MerchantInfo memory merchantInfo = merchantRegistry.getMerchantInfo(_merchant);
        if (merchantInfo.trustScore < commerceConfig.minMerchantTrustScore) 
            revert InsufficientMerchantTier();
        
        // Deploy collection
        bytes memory initData = abi.encodeWithSelector(
            SimpleCollectible.initialize.selector,
            name,
            symbol,
            _URIs,
            _mintFees,
            msg.sender,
            platformFeeRecipient,
            platformFeeBps
        );
        
        collectionAddress = _deployProxy(collectionImplementation, initData);
        
        // Track collection with merchant association
        marketplace.push(collectionAddress);
        collectionDetails[collectionAddress] = CollectionInfo({
            name: name,
            symbol: symbol,
            creator: msg.sender,
            deployedAt: block.timestamp,
            uriCount: _URIs.length,
            commerceEnabled: true,
            merchant: _merchant
        });
        
        emit CollectionDeployed(
            collectionAddress,
            name,
            symbol,
            msg.sender,
            block.timestamp
        );
        
        return collectionAddress;
    }

    /**
     * @notice Updates platform fee configuration
     * @param _platformFeeRecipient New platform fee recipient
     * @param _platformFeeBps New platform fee in basis points
     */
    function updatePlatformFeeConfig(
        address _platformFeeRecipient,
        uint96 _platformFeeBps
    ) external onlyOwner {
        if (_platformFeeRecipient == address(0)) revert InvalidPlatformFeeRecipient();
        if (_platformFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFeeBps();
        
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;
        
        emit PlatformFeeConfigUpdated(_platformFeeRecipient, _platformFeeBps);
    }

    /**
     * @notice Updates the collection implementation contract
     * @param _newImplementation Address of new implementation
     */
    function updateCollectionImplementation(address _newImplementation) external onlyOwner {
        if (_newImplementation == address(0)) revert InvalidPlatformFeeRecipient();
        collectionImplementation = _newImplementation;
        emit CollectionImplementationUpdated(_newImplementation);
    }
    
    /**
     * @notice Update commerce integration addresses
     * @param _merchantRegistry New merchant registry address
     * @param _escrowManager New escrow manager address
     * @param _redemptionManager New redemption manager address
     */
    function updateCommerceIntegrations(
        address _merchantRegistry,
        address _escrowManager,
        address _redemptionManager
    ) external onlyOwner {
        if (_merchantRegistry != address(0)) {
            merchantRegistry = MerchantRegistry(_merchantRegistry);
        }
        if (_escrowManager != address(0)) {
            escrowManager = EscrowManager(payable(_escrowManager));
        }
        if (_redemptionManager != address(0)) {
            redemptionManager = RedemptionManager(payable(_redemptionManager));
        }
        
        emit MerchantIntegrationUpdated(_merchantRegistry, _escrowManager, _redemptionManager);
    }
    
    /**
     * @notice Update commerce configuration
     * @param _config New commerce configuration
     */
    function updateCommerceConfig(CommerceConfig memory _config) external onlyOwner {
        commerceConfig = _config;
        
        emit CommerceFeatureEnabled("escrow", _config.escrowEnabled, block.timestamp);
        emit CommerceFeatureEnabled("redemption", _config.redemptionEnabled, block.timestamp);
        emit CommerceFeatureEnabled("merchantVerification", _config.merchantVerificationRequired, block.timestamp);
    }

    /**
     * @notice Pauses the factory
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the factory
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============
    
    /**
     * @notice Returns all deployed collection addresses
     */
    function getMarketPlaces() external view returns (address[] memory) {
        return marketplace;
    }

    /**
     * @notice Returns collection details
     * @param collection Address of the collection
     */
    function getCollectionDetails(address collection) 
        external 
        view 
        returns (CollectionInfo memory) 
    {
        if (collectionDetails[collection].deployedAt == 0) revert CollectionNotFound();
        return collectionDetails[collection];
    }

    /**
     * @notice Returns the total number of collections
     */
    function getCollectionCount() external view returns (uint256) {
        return marketplace.length;
    }

    /**
     * @notice Returns collections created by a specific address
     * @param creator Address of the creator
     */
    function getCollectionsByCreator(address creator) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].creator == creator) {
                count++;
            }
        }

        address[] memory creatorCollections = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].creator == creator) {
                creatorCollections[index] = marketplace[i];
                index++;
            }
        }

        return creatorCollections;
    }
    
    /**
     * @notice Get collections by merchant
     * @param merchant Merchant address
     */
    function getCollectionsByMerchant(address merchant) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].merchant == merchant) {
                count++;
            }
        }

        address[] memory merchantCollections = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].merchant == merchant) {
                merchantCollections[index] = marketplace[i];
                index++;
            }
        }

        return merchantCollections;
    }
    
    /**
     * @notice Get commerce-enabled collections
     */
    function getCommerceCollections() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].commerceEnabled) {
                count++;
            }
        }

        address[] memory commerceCollections = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < marketplace.length; i++) {
            if (collectionDetails[marketplace[i]].commerceEnabled) {
                commerceCollections[index] = marketplace[i];
                index++;
            }
        }

        return commerceCollections;
    }

    /**
     * @notice Returns the contract version
     */
    function version() external pure returns (uint256) {
        return VERSION;
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Validate merchant requirements for commerce features
     */
    function _validateMerchantRequirements() internal view {
        if (address(merchantRegistry) != address(0)) {
            if (!merchantRegistry.isVerifiedMerchant(msg.sender)) 
                revert UnauthorizedMerchant();
            
            MerchantRegistry.MerchantInfo memory merchantInfo = merchantRegistry.getMerchantInfo(msg.sender);
            if (merchantInfo.trustScore < commerceConfig.minMerchantTrustScore) 
                revert InsufficientMerchantTier();
        }
    }

    /**
     * @dev Deploys a minimal proxy for a collection
     */
    function _deployProxy(
        address implementation,
        bytes memory initData
    ) internal returns (address proxy) {
        // Deploy ERC1967 proxy
        bytes memory proxyBytecode = abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );

        assembly {
            proxy := create(0, add(proxyBytecode, 0x20), mload(proxyBytecode))
        }

        if (proxy == address(0)) revert InvalidPlatformFeeRecipient();

        // Initialize the proxy
        (bool success, ) = proxy.call(initData);
        if (!success) revert InvalidPlatformFeeRecipient();

        return proxy;
    }

    /**
     * @dev Authorizes contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}