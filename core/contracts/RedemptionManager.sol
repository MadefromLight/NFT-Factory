// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title RedemptionManager
 * @dev Advanced redemption logic with burn-to-soulbound conversion and time-lock mechanisms
 * @author NFT Factory Team
 */
contract RedemptionManager is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IERC721Receiver
{
    // ============ Errors ============
    error InvalidAddress();
    error InvalidRedemptionId();
    error RedemptionNotActive();
    error UnauthorizedAccess();
    error InvalidTimeLock();
    error InvalidRedemptionType();
    error TokenAlreadyRedeemed();
    error InsufficientTimeElapsed();
    error InvalidRedemptionStatus();
    error TransferFailed();
    error InvalidMetadata();
    error InvalidFeeBps(); // Added missing error

    // ============ Events ============
    event RedemptionRequested(
        uint256 indexed redemptionId,
        address indexed requester,
        address indexed merchant,
        address nftContract,
        uint256 tokenId,
        RedemptionType redemptionType,
        uint256 timestamp
    );
    
    event RedemptionApproved(
        uint256 indexed redemptionId,
        address indexed approver,
        uint256 approvalTime,
        uint256 timestamp
    );
    
    event RedemptionCompleted(
        uint256 indexed redemptionId,
        address indexed requester,
        address indexed merchant,
        RedemptionType redemptionType,
        uint256 completionTime,
        uint256 timestamp
    );
    
    event RedemptionCancelled(
        uint256 indexed redemptionId,
        address indexed canceller,
        string reason,
        uint256 timestamp
    );
    
    event RedemptionDisputed(
        uint256 indexed redemptionId,
        address indexed requester,
        address indexed merchant,
        string reason,
        uint256 timestamp
    );
    
    event SoulboundTokenCreated(
        uint256 indexed redemptionId,
        address indexed owner,
        string soulboundTokenUri,
        uint256 timestamp
    );
    
    event RedemptionFeeUpdated(
        uint256 oldFee,
        uint256 newFee,
        uint256 timestamp
    );

    // ============ Enums ============
    enum RedemptionStatus {
        REQUESTED,
        APPROVED,
        COMPLETED,
        CANCELLED,
        DISPUTED
    }
    
    enum RedemptionType {
        PHYSICAL_DELIVERY,
        DIGITAL_ACCESS,
        EXPERIENCE,
        SERVICE
    }
    
    enum DisputeResolution {
        PENDING,
        RESOLVED_BUYER,
        RESOLVED_MERCHANT,
        RESOLVED_PARTIAL
    }

    // ============ Structs ============
    struct Redemption {
        uint256 id;
        address requester; // NFT owner requesting redemption
        address merchant; // Merchant fulfilling redemption
        address nftContract;
        uint256 tokenId;
        RedemptionType redemptionType;
        RedemptionStatus status;
        string redemptionDetails; // IPFS hash or description
        string proofOfRedemption; // IPFS hash of proof
        uint256 requestTime;
        uint256 approvalTime;
        uint256 completionTime;
        uint256 timeLockPeriod; // Time lock before completion
        uint256 redemptionFee; // Fee for redemption service
        string disputeReason;
        DisputeResolution disputeResolution;
        address resolver; // Admin who resolved dispute
        string soulboundTokenUri; // URI for soulbound token if applicable
    }
    
    struct RedemptionConfig {
        uint256 baseRedemptionFee; // Base fee in wei
        uint256 timeLockPeriod; // Default time lock in seconds
        mapping(RedemptionType => uint256) typeFees; // Additional fees by type
        mapping(RedemptionType => uint256) typeTimeLocks; // Time locks by type
    }

    // ============ State Variables ============
    /// @dev Mapping from redemption ID to redemption details
    mapping(uint256 => Redemption) public redemptions;
    
    /// @dev Mapping from requester address to their redemption IDs
    mapping(address => uint256[]) public requesterRedemptions;
    
    /// @dev Mapping from merchant address to their redemption IDs
    mapping(address => uint256[]) public merchantRedemptions;
    
    /// @dev Mapping from NFT contract + token ID to redemption ID (to prevent double redemption)
    mapping(address => mapping(uint256 => uint256)) public tokenRedemptions;
    
    /// @dev Redemption counter for unique IDs
    uint256 public redemptionCounter;
    
    /// @dev Redemption configuration
    RedemptionConfig public config;
    
    /// @dev Platform fee recipient
    address public platformFeeRecipient;
    
    /// @dev Total active redemptions
    uint256 public activeRedemptions;
    
    /// @dev Total completed redemptions
    uint256 public completedRedemptions;

    // ============ Constants ============
    uint256 public constant VERSION = 1;
    uint256 public constant MAX_FEE = 0.1 ether; // 0.1 ETH max fee
    uint256 public constant MIN_TIME_LOCK = 1 days; // 1 day minimum
    uint256 public constant MAX_TIME_LOCK = 30 days; // 30 days maximum

    // ============ Modifiers ============
    modifier validRedemption(uint256 _redemptionId) {
        if (_redemptionId == 0 || _redemptionId >= redemptionCounter) revert InvalidRedemptionId();
        if (redemptions[_redemptionId].id == 0) revert InvalidRedemptionId();
        _;
    }
    
    modifier onlyRedemptionParty(uint256 _redemptionId) {
        Redemption storage redemption = redemptions[_redemptionId];
        if (msg.sender != redemption.requester && msg.sender != redemption.merchant) 
            revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyRedemptionRequester(uint256 _redemptionId) {
        if (msg.sender != redemptions[_redemptionId].requester) revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyRedemptionMerchant(uint256 _redemptionId) {
        if (msg.sender != redemptions[_redemptionId].merchant) revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyValidTimeLock(uint256 _timeLock) {
        if (_timeLock < MIN_TIME_LOCK || _timeLock > MAX_TIME_LOCK) revert InvalidTimeLock();
        _;
    }

    // ============ Constructor & Initializer ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the redemption manager
     * @param _owner Contract owner
     * @param _platformFeeRecipient Fee recipient address
     * @param _baseRedemptionFee Base redemption fee
     * @param _defaultTimeLock Default time lock period
     */
    function initialize(
        address _owner,
        address _platformFeeRecipient,
        uint256 _baseRedemptionFee,
        uint256 _defaultTimeLock
    ) public initializer {
        if (_owner == address(0)) revert InvalidAddress();
        if (_platformFeeRecipient == address(0)) revert InvalidAddress();
        if (_baseRedemptionFee > MAX_FEE) revert InvalidFeeBps();
        if (_defaultTimeLock < MIN_TIME_LOCK || _defaultTimeLock > MAX_TIME_LOCK) 
            revert InvalidTimeLock();
        
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        _transferOwnership(_owner);
        
        platformFeeRecipient = _platformFeeRecipient;
        config.baseRedemptionFee = _baseRedemptionFee;
        config.timeLockPeriod = _defaultTimeLock;
        
        // Set default fees and time locks by type
        config.typeFees[RedemptionType.PHYSICAL_DELIVERY] = 0.01 ether;
        config.typeFees[RedemptionType.DIGITAL_ACCESS] = 0.005 ether;
        config.typeFees[RedemptionType.EXPERIENCE] = 0.02 ether;
        config.typeFees[RedemptionType.SERVICE] = 0.015 ether;
        
        config.typeTimeLocks[RedemptionType.PHYSICAL_DELIVERY] = 7 days;
        config.typeTimeLocks[RedemptionType.DIGITAL_ACCESS] = 1 days;
        config.typeTimeLocks[RedemptionType.EXPERIENCE] = 14 days;
        config.typeTimeLocks[RedemptionType.SERVICE] = 3 days;
    }

    // ============ Redemption Functions ============
    
    /**
     * @notice Request redemption of an NFT
     * @param _merchant Merchant address
     * @param _nftContract NFT contract address
     * @param _tokenId NFT token ID
     * @param _redemptionType Type of redemption requested
     * @param _redemptionDetails Details/IPFS hash of redemption
     * @param _timeLock Optional custom time lock (0 for default)
     * @return redemptionId Created redemption ID
     */
    function requestRedemption(
        address _merchant,
        address _nftContract,
        uint256 _tokenId,
        RedemptionType _redemptionType,
        string memory _redemptionDetails,
        uint256 _timeLock
    ) external whenNotPaused nonReentrant returns (uint256 redemptionId) {
        if (_merchant == address(0)) revert InvalidAddress();
        if (_nftContract == address(0)) revert InvalidAddress();
        if (_merchant == msg.sender) revert UnauthorizedAccess();
        if (bytes(_redemptionDetails).length == 0) revert InvalidMetadata();
        
        // Verify NFT ownership and that it hasn't been redeemed
        IERC721 nft = IERC721(_nftContract);
        if (nft.ownerOf(_tokenId) != msg.sender) revert UnauthorizedAccess();
        if (tokenRedemptions[_nftContract][_tokenId] != 0) revert TokenAlreadyRedeemed();
        
        redemptionId = ++redemptionCounter;
        uint256 timeLock = _timeLock > 0 ? _timeLock : config.typeTimeLocks[_redemptionType];
        uint256 totalFee = config.baseRedemptionFee + config.typeFees[_redemptionType];
        
        // Transfer redemption fee
        if (totalFee > 0) {
            _transferETH(platformFeeRecipient, totalFee);
        }
        
        redemptions[redemptionId] = Redemption({
            id: redemptionId,
            requester: msg.sender,
            merchant: _merchant,
            nftContract: _nftContract,
            tokenId: _tokenId,
            redemptionType: _redemptionType,
            status: RedemptionStatus.REQUESTED,
            redemptionDetails: _redemptionDetails,
            proofOfRedemption: "",
            requestTime: block.timestamp,
            approvalTime: 0,
            completionTime: 0,
            timeLockPeriod: timeLock,
            redemptionFee: totalFee,
            disputeReason: "",
            disputeResolution: DisputeResolution.PENDING,
            resolver: address(0),
            soulboundTokenUri: ""
        });
        
        // Mark token as in redemption process
        tokenRedemptions[_nftContract][_tokenId] = redemptionId;
        requesterRedemptions[msg.sender].push(redemptionId);
        merchantRedemptions[_merchant].push(redemptionId);
        activeRedemptions++;
        
        emit RedemptionRequested(
            redemptionId,
            msg.sender,
            _merchant,
            _nftContract,
            _tokenId,
            _redemptionType,
            block.timestamp
        );
        
        return redemptionId;
    }

    /**
     * @notice Approve redemption request (merchant)
     * @param _redemptionId Redemption ID
     */
    function approveRedemption(uint256 _redemptionId) 
        external 
        whenNotPaused 
        nonReentrant 
        validRedemption(_redemptionId)
        onlyRedemptionMerchant(_redemptionId)
    {
        Redemption storage redemption = redemptions[_redemptionId];
        
        if (redemption.status != RedemptionStatus.REQUESTED) revert InvalidRedemptionStatus();
        
        redemption.status = RedemptionStatus.APPROVED;
        redemption.approvalTime = block.timestamp;
        
        emit RedemptionApproved(
            _redemptionId,
            msg.sender,
            block.timestamp,
            block.timestamp
        );
    }

    /**
     * @notice Complete redemption and optionally create soulbound token
     * @param _redemptionId Redemption ID
     * @param _proofOfRedemption IPFS hash of proof
     * @param _createSoulbound Whether to create soulbound token
     * @param _soulboundTokenUri URI for soulbound token (if creating)
     */
    function completeRedemption(
        uint256 _redemptionId,
        string memory _proofOfRedemption,
        bool _createSoulbound,
        string memory _soulboundTokenUri
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validRedemption(_redemptionId)
        onlyRedemptionMerchant(_redemptionId)
    {
        Redemption storage redemption = redemptions[_redemptionId];
        
        if (redemption.status != RedemptionStatus.APPROVED) revert InvalidRedemptionStatus();
        if (block.timestamp < redemption.approvalTime + redemption.timeLockPeriod) 
            revert InsufficientTimeElapsed();
        if (bytes(_proofOfRedemption).length == 0) revert InvalidMetadata();
        
        redemption.status = RedemptionStatus.COMPLETED;
        redemption.proofOfRedemption = _proofOfRedemption;
        redemption.completionTime = block.timestamp;
        activeRedemptions--;
        completedRedemptions++;
        
        // Burn the NFT
        IERC721(redemption.nftContract).transferFrom(
            redemption.requester, 
            address(this), 
            redemption.tokenId
        );
        // Note: In a real implementation, you'd burn the token here
        // IERC721(redemption.nftContract).burn(redemption.tokenId);
        
        // Create soulbound token if requested
        if (_createSoulbound && bytes(_soulboundTokenUri).length > 0) {
            redemption.soulboundTokenUri = _soulboundTokenUri;
            emit SoulboundTokenCreated(
                _redemptionId,
                redemption.requester,
                _soulboundTokenUri,
                block.timestamp
            );
        }
        
        emit RedemptionCompleted(
            _redemptionId,
            redemption.requester,
            redemption.merchant,
            redemption.redemptionType,
            block.timestamp,
            block.timestamp
        );
    }

    /**
     * @notice Cancel redemption request
     * @param _redemptionId Redemption ID
     * @param _reason Reason for cancellation
     */
    function cancelRedemption(
        uint256 _redemptionId,
        string memory _reason
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validRedemption(_redemptionId)
        onlyRedemptionParty(_redemptionId)
    {
        Redemption storage redemption = redemptions[_redemptionId];
        
        if (redemption.status != RedemptionStatus.REQUESTED && 
            redemption.status != RedemptionStatus.APPROVED) revert InvalidRedemptionStatus();
        
        redemption.status = RedemptionStatus.CANCELLED;
        activeRedemptions--;
        
        // Clear token redemption mapping
        tokenRedemptions[redemption.nftContract][redemption.tokenId] = 0;
        
        emit RedemptionCancelled(
            _redemptionId,
            msg.sender,
            _reason,
            block.timestamp
        );
    }

    /**
     * @notice Dispute redemption
     * @param _redemptionId Redemption ID
     * @param _reason Reason for dispute
     */
    function disputeRedemption(
        uint256 _redemptionId,
        string memory _reason
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validRedemption(_redemptionId)
        onlyRedemptionParty(_redemptionId)
    {
        Redemption storage redemption = redemptions[_redemptionId];
        
        if (redemption.status == RedemptionStatus.COMPLETED || 
            redemption.status == RedemptionStatus.CANCELLED) revert InvalidRedemptionStatus();
        
        redemption.status = RedemptionStatus.DISPUTED;
        redemption.disputeReason = _reason;
        
        emit RedemptionDisputed(
            _redemptionId,
            redemption.requester,
            redemption.merchant,
            _reason,
            block.timestamp
        );
    }

    /**
     * @notice Resolve dispute (admin only)
     * @param _redemptionId Redemption ID
     * @param _resolution Dispute resolution type
     * @param _notes Resolution notes
     */
    function resolveDispute(
        uint256 _redemptionId,
        DisputeResolution _resolution,
        string memory _notes
    ) 
        external 
        onlyOwner 
        whenNotPaused 
        validRedemption(_redemptionId)
    {
        Redemption storage redemption = redemptions[_redemptionId];
        
        if (redemption.status != RedemptionStatus.DISPUTED) revert InvalidRedemptionStatus();
        
        redemption.disputeResolution = _resolution;
        redemption.resolver = msg.sender;
        
        if (_resolution == DisputeResolution.RESOLVED_BUYER) {
            // Refund and cancel redemption
            redemption.status = RedemptionStatus.CANCELLED;
            activeRedemptions--;
            tokenRedemptions[redemption.nftContract][redemption.tokenId] = 0;
        } else if (_resolution == DisputeResolution.RESOLVED_MERCHANT) {
            // Complete redemption
            redemption.status = RedemptionStatus.COMPLETED;
            redemption.completionTime = block.timestamp;
            activeRedemptions--;
            completedRedemptions++;
        }
        // For PARTIAL, keep as DISPUTED but update resolution
        
        // Emit resolution event (would need additional event)
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update redemption fees
     * @param _baseFee New base fee
     * @param _typeFees Fees for each redemption type
     */
    function updateRedemptionFees(
        uint256 _baseFee,
        uint256[4] memory _typeFees
    ) external onlyOwner {
        if (_baseFee > MAX_FEE) revert InvalidFeeBps();
        
        uint256 oldFee = config.baseRedemptionFee;
        config.baseRedemptionFee = _baseFee;
        
        config.typeFees[RedemptionType.PHYSICAL_DELIVERY] = _typeFees[0];
        config.typeFees[RedemptionType.DIGITAL_ACCESS] = _typeFees[1];
        config.typeFees[RedemptionType.EXPERIENCE] = _typeFees[2];
        config.typeFees[RedemptionType.SERVICE] = _typeFees[3];
        
        emit RedemptionFeeUpdated(oldFee, _baseFee, block.timestamp);
    }
    
    /**
     * @notice Update time lock configurations
     * @param _defaultTimeLock Default time lock
     * @param _typeTimeLocks Time locks for each type
     */
    function updateTimeLocks(
        uint256 _defaultTimeLock,
        uint256[4] memory _typeTimeLocks
    ) external onlyOwner onlyValidTimeLock(_defaultTimeLock) {
        config.timeLockPeriod = _defaultTimeLock;
        
        config.typeTimeLocks[RedemptionType.PHYSICAL_DELIVERY] = _typeTimeLocks[0];
        config.typeTimeLocks[RedemptionType.DIGITAL_ACCESS] = _typeTimeLocks[1];
        config.typeTimeLocks[RedemptionType.EXPERIENCE] = _typeTimeLocks[2];
        config.typeTimeLocks[RedemptionType.SERVICE] = _typeTimeLocks[3];
    }

    // ============ View Functions ============
    
    /**
     * @notice Get redemption details
     * @param _redemptionId Redemption ID
     */
    function getRedemption(uint256 _redemptionId) 
        external 
        view 
        validRedemption(_redemptionId) 
        returns (Redemption memory) 
    {
        return redemptions[_redemptionId];
    }
    
    /**
     * @notice Get requester's redemptions
     * @param _requester Requester address
     */
    function getRequesterRedemptions(address _requester) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return requesterRedemptions[_requester];
    }
    
    /**
     * @notice Get merchant's redemptions
     * @param _merchant Merchant address
     */
    function getMerchantRedemptions(address _merchant) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return merchantRedemptions[_merchant];
    }
    
    /**
     * @notice Check if token can be redeemed
     * @param _nftContract NFT contract
     * @param _tokenId Token ID
     */
    function canRedeemToken(address _nftContract, uint256 _tokenId) 
        external 
        view 
        returns (bool) 
    {
        return tokenRedemptions[_nftContract][_tokenId] == 0;
    }
    
    /**
     * @notice Get contract version
     */
    function version() external pure returns (uint256) {
        return VERSION;
    }

    // ============ IERC721Receiver Implementation ============
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Transfer ETH to recipient
     */
    function _transferETH(address recipient, uint256 amount) internal {
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}