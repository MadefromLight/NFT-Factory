// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title MerchantRegistry
 * @dev Registry for merchant verification, trust scoring, and tier management
 * @author NFT Factory Team
 */
contract MerchantRegistry is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ============ Errors ============
    error InvalidAddress();
    error MerchantAlreadyRegistered();
    error MerchantNotRegistered();
    error InvalidVerificationStatus();
    error InsufficientTrustScore();
    error InvalidTier();
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error UnauthorizedAccess();

    // ============ Events ============
    event MerchantRegistered(
        address indexed merchant,
        string businessName,
        string businessType,
        uint256 timestamp
    );
    
    event MerchantVerified(
        address indexed merchant,
        VerificationStatus newStatus,
        uint256 timestamp
    );
    
    event TrustScoreUpdated(
        address indexed merchant,
        uint256 oldScore,
        uint256 newScore,
        uint256 timestamp
    );
    
    event TierUpdated(
        address indexed merchant,
        Tier oldTier,
        Tier newTier,
        uint256 timestamp
    );
    
    event DocumentAdded(
        address indexed merchant,
        string documentType,
        string documentHash,
        uint256 timestamp
    );
    
    event MerchantSuspended(
        address indexed merchant,
        string reason,
        uint256 timestamp
    );

    // ============ Enums ============
    enum VerificationStatus {
        UNVERIFIED,
        PENDING,
        VERIFIED,
        REJECTED,
        SUSPENDED
    }
    
    enum Tier {
        STARTER,
        PROFESSIONAL,
        ENTERPRISE,
        PREMIUM
    }
    
    enum DocumentType {
        BUSINESS_REGISTRATION,
        GOVERNMENT_ID,
        TAX_ID,
        BANK_STATEMENT,
        OTHER
    }

    // ============ Structs ============
    struct MerchantInfo {
        string businessName;
        string businessType;
        string website;
        string description;
        VerificationStatus verificationStatus;
        Tier tier;
        uint256 trustScore; // 0-1000 scale
        uint256 registrationDate;
        uint256 lastActive;
        bool isActive;
        uint256 totalSales;
        uint256 totalTransactions;
        uint256 disputeCount;
        string ipfsMetadata; // IPFS hash for additional merchant data
    }
    
    struct Document {
        DocumentType docType;
        string documentHash; // IPFS hash of the document
        uint256 uploadDate;
        bool verified;
        string verifier; // Address of verifier (if applicable)
    }
    
    struct TrustFactors {
        uint256 successfulTransactions;
        uint256 customerReviews;
        uint256 avgRating; // 1-5 scale * 100 for precision
        uint256 daysActive;
        uint256 verificationBonus;
        uint256 tierMultiplier;
    }

    // ============ State Variables ============
    /// @dev Mapping from merchant address to merchant info
    mapping(address => MerchantInfo) public merchants;
    
    /// @dev Mapping from merchant to their documents
    mapping(address => Document[]) public merchantDocuments;
    
    /// @dev Mapping from merchant to trust factors
    mapping(address => TrustFactors) public trustFactors;
    
    /// @dev Set of registered merchant addresses
    mapping(address => bool) public isRegisteredMerchant;
    
    /// @dev Tier requirements (minimum trust score)
    mapping(Tier => uint256) public tierRequirements;
    
    /// @dev Total registered merchants count
    uint256 public totalMerchants;
    
    /// @dev Total verified merchants count
    uint256 public verifiedMerchants;

    // ============ Constants ============
    uint256 public constant MAX_TRUST_SCORE = 1000;
    uint256 public constant VERSION = 1;
    uint256 public constant VERIFICATION_FEE = 0.01 ether; // Base fee for verification

    // ============ Modifiers ============
    modifier onlyRegisteredMerchant() {
        if (!isRegisteredMerchant[msg.sender]) revert MerchantNotRegistered();
        _;
    }
    
    modifier onlyVerifiedMerchant() {
        if (merchants[msg.sender].verificationStatus != VerificationStatus.VERIFIED) 
            revert UnauthorizedAccess();
        _;
    }
    
    modifier validMerchant(address merchant) {
        if (merchant == address(0)) revert InvalidAddress();
        if (!isRegisteredMerchant[merchant]) revert MerchantNotRegistered();
        _;
    }

    // ============ Constructor & Initializer ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the merchant registry
     * @param _owner Contract owner address
     */
    function initialize(address _owner) public initializer {
        if (_owner == address(0)) revert InvalidAddress();
        
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        _transferOwnership(_owner);
        
        // Set tier requirements
        tierRequirements[Tier.STARTER] = 0;
        tierRequirements[Tier.PROFESSIONAL] = 300;
        tierRequirements[Tier.ENTERPRISE] = 600;
        tierRequirements[Tier.PREMIUM] = 800;
    }

    // ============ Merchant Registration Functions ============
    
    /**
     * @notice Register as a merchant
     * @param _businessName Business name
     * @param _businessType Business type/category
     * @param _website Business website (optional)
     * @param _description Business description
     */
    function registerMerchant(
        string memory _businessName,
        string memory _businessType,
        string memory _website,
        string memory _description
    ) external whenNotPaused {
        if (isRegisteredMerchant[msg.sender]) revert MerchantAlreadyRegistered();
        if (bytes(_businessName).length == 0) revert InvalidAddress();
        
        merchants[msg.sender] = MerchantInfo({
            businessName: _businessName,
            businessType: _businessType,
            website: _website,
            description: _description,
            verificationStatus: VerificationStatus.UNVERIFIED,
            tier: Tier.STARTER,
            trustScore: 0,
            registrationDate: block.timestamp,
            lastActive: block.timestamp,
            isActive: true,
            totalSales: 0,
            totalTransactions: 0,
            disputeCount: 0,
            ipfsMetadata: ""
        });
        
        isRegisteredMerchant[msg.sender] = true;
        totalMerchants++;
        
        emit MerchantRegistered(
            msg.sender,
            _businessName,
            _businessType,
            block.timestamp
        );
    }

    /**
     * @notice Submit documents for verification
     * @param _docType Type of document
     * @param _documentHash IPFS hash of the document
     */
    function submitDocument(
        DocumentType _docType,
        string memory _documentHash
    ) external whenNotPaused onlyRegisteredMerchant {
        if (bytes(_documentHash).length == 0) revert InvalidAddress();
        
        // Check if document type already exists
        Document[] storage docs = merchantDocuments[msg.sender];
        for (uint256 i = 0; i < docs.length; i++) {
            if (docs[i].docType == _docType) revert DocumentAlreadyExists();
        }
        
        docs.push(Document({
            docType: _docType,
            documentHash: _documentHash,
            uploadDate: block.timestamp,
            verified: false,
            verifier: ""
        }));
        
        // Update verification status to pending if this is the first document
        if (merchants[msg.sender].verificationStatus == VerificationStatus.UNVERIFIED) {
            merchants[msg.sender].verificationStatus = VerificationStatus.PENDING;
        }
        
        emit DocumentAdded(
            msg.sender,
            _getDocumentTypeName(_docType),
            _documentHash,
            block.timestamp
        );
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Verify a merchant (admin only)
     * @param _merchant Merchant address
     * @param _status New verification status
     * @param _trustScore Initial trust score
     */
    function verifyMerchant(
        address _merchant,
        VerificationStatus _status,
        uint256 _trustScore
    ) external onlyOwner whenNotPaused validMerchant(_merchant) {
        if (_status == VerificationStatus.UNVERIFIED) revert InvalidVerificationStatus();
        if (_trustScore > MAX_TRUST_SCORE) revert InsufficientTrustScore();
        
        MerchantInfo storage merchant = merchants[_merchant];
        VerificationStatus oldStatus = merchant.verificationStatus;
        
        merchant.verificationStatus = _status;
        merchant.trustScore = _trustScore;
        
        // Update verified merchants count
        if (oldStatus != VerificationStatus.VERIFIED && _status == VerificationStatus.VERIFIED) {
            verifiedMerchants++;
        } else if (oldStatus == VerificationStatus.VERIFIED && _status != VerificationStatus.VERIFIED) {
            verifiedMerchants--;
        }
        
        // Set initial trust factors for verified merchants
        if (_status == VerificationStatus.VERIFIED) {
            trustFactors[_merchant] = TrustFactors({
                successfulTransactions: 0,
                customerReviews: 0,
                avgRating: 0,
                daysActive: 0,
                verificationBonus: 100,
                tierMultiplier: 100
            });
        }
        
        emit MerchantVerified(_merchant, _status, block.timestamp);
        emit TrustScoreUpdated(_merchant, 0, _trustScore, block.timestamp);
    }

    /**
     * @notice Update merchant trust score
     * @param _merchant Merchant address
     * @param _scoreDelta Change in trust score (+/-)
     */
    function updateTrustScore(
        address _merchant,
        int256 _scoreDelta
    ) external onlyOwner whenNotPaused validMerchant(_merchant) {
        MerchantInfo storage merchant = merchants[_merchant];
        uint256 oldScore = merchant.trustScore;
        int256 newScore = int256(oldScore) + _scoreDelta;
        
        // Ensure score stays within bounds
        if (newScore < 0) {
            merchant.trustScore = 0;
        } else if (uint256(newScore) > MAX_TRUST_SCORE) {
            merchant.trustScore = MAX_TRUST_SCORE;
        } else {
            merchant.trustScore = uint256(newScore);
        }
        
        // Update tier based on new trust score
        _updateMerchantTier(_merchant);
        
        emit TrustScoreUpdated(_merchant, oldScore, merchant.trustScore, block.timestamp);
    }

    /**
     * @notice Suspend a merchant
     * @param _merchant Merchant address
     * @param _reason Reason for suspension
     */
    function suspendMerchant(
        address _merchant,
        string memory _reason
    ) external onlyOwner whenNotPaused validMerchant(_merchant) {
        MerchantInfo storage merchant = merchants[_merchant];
        
        if (merchant.verificationStatus == VerificationStatus.SUSPENDED) {
            revert InvalidVerificationStatus();
        }
        
        // Update verified merchants count if previously verified
        if (merchant.verificationStatus == VerificationStatus.VERIFIED) {
            verifiedMerchants--;
        }
        
        merchant.verificationStatus = VerificationStatus.SUSPENDED;
        merchant.isActive = false;
        
        emit MerchantSuspended(_merchant, _reason, block.timestamp);
    }

    /**
     * @notice Reactivate a suspended merchant
     * @param _merchant Merchant address
     */
    function reactivateMerchant(address _merchant) external onlyOwner whenNotPaused validMerchant(_merchant) {
        MerchantInfo storage merchant = merchants[_merchant];
        
        if (merchant.verificationStatus != VerificationStatus.SUSPENDED) {
            revert InvalidVerificationStatus();
        }
        
        merchant.verificationStatus = VerificationStatus.VERIFIED;
        merchant.isActive = true;
        verifiedMerchants++;
        
        emit MerchantVerified(_merchant, VerificationStatus.VERIFIED, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get merchant information
     * @param _merchant Merchant address
     */
    function getMerchantInfo(address _merchant) 
        external 
        view 
        returns (MerchantInfo memory) 
    {
        return merchants[_merchant];
    }
    
    /**
     * @notice Get merchant documents
     * @param _merchant Merchant address
     */
    function getMerchantDocuments(address _merchant) 
        external 
        view 
        returns (Document[] memory) 
    {
        return merchantDocuments[_merchant];
    }
    
    /**
     * @notice Get trust factors for a merchant
     * @param _merchant Merchant address
     */
    function getTrustFactors(address _merchant) 
        external 
        view 
        returns (TrustFactors memory) 
    {
        return trustFactors[_merchant];
    }
    
    /**
     * @notice Check if address is a verified merchant
     * @param _merchant Merchant address
     */
    function isVerifiedMerchant(address _merchant) 
        external 
        view 
        returns (bool) 
    {
        return isRegisteredMerchant[_merchant] && 
               merchants[_merchant].verificationStatus == VerificationStatus.VERIFIED;
    }
    
    /**
     * @notice Get merchants by verification status
     * @param _status Verification status
     * @param _limit Maximum number of results
     */
    function getMerchantsByStatus(
        VerificationStatus _status,
        uint256 _limit
    ) external view returns (address[] memory) {
        address[] memory result = new address[](_limit);
        uint256 count = 0;
        
        // This is a simplified implementation - in production, you'd want 
        // a more efficient way to track merchants by status
        // For now, we'll return empty array as this would require iteration
        return result;
    }
    
    /**
     * @notice Get contract version
     */
    function version() external pure returns (uint256) {
        return VERSION;
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Update merchant tier based on trust score
     */
    function _updateMerchantTier(address _merchant) internal {
        MerchantInfo storage merchant = merchants[_merchant];
        uint256 score = merchant.trustScore;
        Tier oldTier = merchant.tier;
        Tier newTier = Tier.STARTER;
        
        if (score >= tierRequirements[Tier.PREMIUM]) {
            newTier = Tier.PREMIUM;
        } else if (score >= tierRequirements[Tier.ENTERPRISE]) {
            newTier = Tier.ENTERPRISE;
        } else if (score >= tierRequirements[Tier.PROFESSIONAL]) {
            newTier = Tier.PROFESSIONAL;
        }
        
        if (newTier != oldTier) {
            merchant.tier = newTier;
            emit TierUpdated(_merchant, oldTier, newTier, block.timestamp);
        }
    }
    
    /**
     * @dev Get document type name for events
     */
    function _getDocumentTypeName(DocumentType _docType) internal pure returns (string memory) {
        if (_docType == DocumentType.BUSINESS_REGISTRATION) return "Business Registration";
        if (_docType == DocumentType.GOVERNMENT_ID) return "Government ID";
        if (_docType == DocumentType.TAX_ID) return "Tax ID";
        if (_docType == DocumentType.BANK_STATEMENT) return "Bank Statement";
        return "Other";
    }
    
    /**
     * @dev Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}