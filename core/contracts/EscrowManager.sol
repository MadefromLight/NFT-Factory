// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EscrowManager
 * @dev Time-lock escrow management for buyer protection in NFT transactions
 * @author NFT Factory Team
 */
contract EscrowManager is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ============ Errors ============
    error InvalidAddress();
    error InvalidEscrowId();
    error EscrowNotActive();
    error EscrowAlreadyExists();
    error UnauthorizedAccess();
    error EscrowNotExpired();
    error InsufficientFunds();
    error TransferFailed();
    error InvalidTimeLock();
    error EscrowAlreadyReleased();
    error EscrowAlreadyCancelled();
    error InvalidFeeBps();  // Added missing error

    // ============ Events ============
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 releaseTime,
        uint256 timestamp
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 releaseTime,
        uint256 timestamp
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        string reason,
        uint256 timestamp
    );
    
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );
    
    event EscrowDisputed(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        string reason,
        uint256 timestamp
    );
    
    event FeeUpdated(
        uint256 oldFee,
        uint256 newFee,
        uint256 timestamp
    );

    // ============ Enums ============
    enum EscrowStatus {
        ACTIVE,
        RELEASED,
        CANCELLED,
        DISPUTED,
        REFUNDED
    }

    // ============ Structs ============
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // Purchase amount in wei
        uint256 releaseTime; // Timestamp when funds can be released
        uint256 createdAt;
        EscrowStatus status;
        string disputeReason;
        address resolver; // Admin who resolved dispute
    }

    // ============ State Variables ============
    /// @dev Mapping from escrow ID to escrow details
    mapping(uint256 => Escrow) public escrows;
    
    /// @dev Mapping from buyer address to their escrow IDs
    mapping(address => uint256[]) public buyerEscrows;
    
    /// @dev Mapping from seller address to their escrow IDs
    mapping(address => uint256[]) public sellerEscrows;
    
    /// @dev Escrow counter for unique IDs
    uint256 public escrowCounter;
    
    /// @dev Platform fee percentage (basis points)
    uint256 public platformFeeBps;
    
    /// @dev Platform fee recipient
    address public platformFeeRecipient;
    
    /// @dev Minimum time lock period (seconds)
    uint256 public minTimeLock;
    
    /// @dev Maximum time lock period (seconds)
    uint256 public maxTimeLock;
    
    /// @dev Total active escrows
    uint256 public activeEscrows;
    
    /// @dev Total escrow volume
    uint256 public totalVolume;

    // ============ Constants ============
    uint256 public constant VERSION = 1;
    uint256 public constant MAX_FEE_BPS = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_TIME_LOCK_DEFAULT = 7 days; // 7 days minimum
    uint256 public constant MAX_TIME_LOCK_DEFAULT = 90 days; // 90 days maximum

    // ============ Modifiers ============
    modifier validEscrow(uint256 _escrowId) {
        if (_escrowId == 0 || _escrowId >= escrowCounter) revert InvalidEscrowId();
        if (escrows[_escrowId].id == 0) revert InvalidEscrowId();
        _;
    }
    
    modifier onlyEscrowParty(uint256 _escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) 
            revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyEscrowBuyer(uint256 _escrowId) {
        if (msg.sender != escrows[_escrowId].buyer) revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyEscrowSeller(uint256 _escrowId) {
        if (msg.sender != escrows[_escrowId].seller) revert UnauthorizedAccess();
        _;
    }

    // ============ Constructor & Initializer ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the escrow manager
     * @param _owner Contract owner
     * @param _platformFeeRecipient Fee recipient address
     * @param _platformFeeBps Platform fee in basis points
     */
    function initialize(
        address _owner,
        address _platformFeeRecipient,
        uint256 _platformFeeBps
    ) public initializer {
        if (_owner == address(0)) revert InvalidAddress();
        if (_platformFeeRecipient == address(0)) revert InvalidAddress();
        if (_platformFeeBps > MAX_FEE_BPS) revert InvalidFeeBps();
        
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        _transferOwnership(_owner);
        
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;
        minTimeLock = MIN_TIME_LOCK_DEFAULT;
        maxTimeLock = MAX_TIME_LOCK_DEFAULT;
    }

    // ============ Escrow Management Functions ============
    
    /**
     * @notice Create a new escrow for NFT purchase
     * @param _seller Seller address
     * @param _nftContract NFT contract address
     * @param _tokenId NFT token ID
     * @param _timeLock Time lock period in seconds
     * @return escrowId Created escrow ID
     */
    function createEscrow(
        address _seller,
        address _nftContract,
        uint256 _tokenId,
        uint256 _timeLock
    ) external payable whenNotPaused nonReentrant returns (uint256 escrowId) {
        if (_seller == address(0)) revert InvalidAddress();
        if (_nftContract == address(0)) revert InvalidAddress();
        if (_seller == msg.sender) revert UnauthorizedAccess();
        if (_timeLock < minTimeLock || _timeLock > maxTimeLock) revert InvalidTimeLock();
        if (msg.value == 0) revert InsufficientFunds();
        
        // Verify NFT ownership
        IERC721 nft = IERC721(_nftContract);
        if (nft.ownerOf(_tokenId) != _seller) revert UnauthorizedAccess();
        
        escrowId = ++escrowCounter;
        
        uint256 releaseTime = block.timestamp + _timeLock;
        
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: _seller,
            nftContract: _nftContract,
            tokenId: _tokenId,
            amount: msg.value,
            releaseTime: releaseTime,
            createdAt: block.timestamp,
            status: EscrowStatus.ACTIVE,
            disputeReason: "",
            resolver: address(0)
        });
        
        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[_seller].push(escrowId);
        activeEscrows++;
        totalVolume += msg.value;
        
        emit EscrowCreated(
            escrowId,
            msg.sender,
            _seller,
            _nftContract,
            _tokenId,
            msg.value,
            releaseTime,
            block.timestamp
        );
        
        return escrowId;
    }

    /**
     * @notice Release escrow funds to seller (buyer initiated after time lock)
     * @param _escrowId Escrow ID
     */
    function releaseEscrow(uint256 _escrowId) 
        external 
        whenNotPaused 
        nonReentrant 
        validEscrow(_escrowId)
        onlyEscrowBuyer(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.status != EscrowStatus.ACTIVE) revert EscrowAlreadyReleased();
        if (block.timestamp < escrow.releaseTime) revert EscrowNotExpired();
        
        escrow.status = EscrowStatus.RELEASED;
        activeEscrows--;
        
        // Calculate and transfer platform fee
        uint256 fee = (escrow.amount * platformFeeBps) / BASIS_POINTS;
        uint256 sellerAmount = escrow.amount - fee;
        
        // Transfer funds to seller
        _transferETH(escrow.seller, sellerAmount);
        
        // Transfer fee to platform
        if (fee > 0) {
            _transferETH(platformFeeRecipient, fee);
        }
        
        // Transfer NFT to buyer
        IERC721(escrow.nftContract).transferFrom(escrow.seller, escrow.buyer, escrow.tokenId);
        
        emit EscrowReleased(
            _escrowId,
            escrow.buyer,
            escrow.seller,
            escrow.releaseTime,
            block.timestamp
        );
    }

    /**
     * @notice Cancel escrow and refund buyer (seller initiated)
     * @param _escrowId Escrow ID
     * @param _reason Reason for cancellation
     */
    function cancelEscrow(
        uint256 _escrowId,
        string memory _reason
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validEscrow(_escrowId)
        onlyEscrowSeller(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.status != EscrowStatus.ACTIVE) revert EscrowAlreadyCancelled();
        
        escrow.status = EscrowStatus.CANCELLED;
        activeEscrows--;
        
        // Refund buyer
        _transferETH(escrow.buyer, escrow.amount);
        
        emit EscrowCancelled(
            _escrowId,
            escrow.buyer,
            escrow.seller,
            _reason,
            block.timestamp
        );
    }

    /**
     * @notice Request refund before time lock expires (buyer initiated)
     * @param _escrowId Escrow ID
     * @param _reason Reason for refund request
     */
    function requestRefund(
        uint256 _escrowId,
        string memory _reason
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validEscrow(_escrowId)
        onlyEscrowBuyer(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.status != EscrowStatus.ACTIVE) revert EscrowAlreadyReleased();
        if (block.timestamp >= escrow.releaseTime) revert EscrowNotExpired();
        
        escrow.status = EscrowStatus.REFUNDED;
        activeEscrows--;
        
        // Refund buyer
        _transferETH(escrow.buyer, escrow.amount);
        
        emit EscrowRefunded(
            _escrowId,
            escrow.buyer,
            escrow.amount,
            block.timestamp
        );
    }

    /**
     * @notice Dispute an escrow (either party)
     * @param _escrowId Escrow ID
     * @param _reason Reason for dispute
     */
    function disputeEscrow(
        uint256 _escrowId,
        string memory _reason
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validEscrow(_escrowId)
        onlyEscrowParty(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.status != EscrowStatus.ACTIVE) revert EscrowNotActive();
        
        escrow.status = EscrowStatus.DISPUTED;
        escrow.disputeReason = _reason;
        
        emit EscrowDisputed(
            _escrowId,
            escrow.buyer,
            escrow.seller,
            _reason,
            block.timestamp
        );
    }

    /**
     * @notice Resolve dispute (admin only)
     * @param _escrowId Escrow ID
     * @param _releaseToSeller Whether to release to seller (true) or refund buyer (false)
     * @param _resolverNote Note from resolver
     */
    function resolveDispute(
        uint256 _escrowId,
        bool _releaseToSeller,
        string memory _resolverNote
    ) 
        external 
        onlyOwner 
        whenNotPaused 
        validEscrow(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.status != EscrowStatus.DISPUTED) revert EscrowNotActive();
        
        escrow.resolver = msg.sender;
        activeEscrows--;
        
        if (_releaseToSeller) {
            // Release to seller (minus platform fee)
            uint256 fee = (escrow.amount * platformFeeBps) / BASIS_POINTS;
            uint256 sellerAmount = escrow.amount - fee;
            
            _transferETH(escrow.seller, sellerAmount);
            if (fee > 0) {
                _transferETH(platformFeeRecipient, fee);
            }
            
            escrow.status = EscrowStatus.RELEASED;
        } else {
            // Refund buyer
            _transferETH(escrow.buyer, escrow.amount);
            escrow.status = EscrowStatus.REFUNDED;
        }
        
        // Transfer NFT based on resolution
        if (_releaseToSeller) {
            IERC721(escrow.nftContract).transferFrom(escrow.seller, escrow.buyer, escrow.tokenId);
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update platform fee
     * @param _newFeeBps New fee in basis points
     */
    function updatePlatformFee(uint256 _newFeeBps) external onlyOwner {
        if (_newFeeBps > MAX_FEE_BPS) revert InvalidFeeBps();
        
        uint256 oldFee = platformFeeBps;
        platformFeeBps = _newFeeBps;
        
        emit FeeUpdated(oldFee, _newFeeBps, block.timestamp);
    }
    
    /**
     * @notice Update time lock limits
     * @param _minTimeLock Minimum time lock
     * @param _maxTimeLock Maximum time lock
     */
    function updateTimeLockLimits(
        uint256 _minTimeLock,
        uint256 _maxTimeLock
    ) external onlyOwner {
        if (_minTimeLock > _maxTimeLock) revert InvalidTimeLock();
        
        minTimeLock = _minTimeLock;
        maxTimeLock = _maxTimeLock;
    }
    
    /**
     * @notice Update platform fee recipient
     * @param _newRecipient New fee recipient
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) revert InvalidAddress();
        platformFeeRecipient = _newRecipient;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get escrow details
     * @param _escrowId Escrow ID
     */
    function getEscrow(uint256 _escrowId) 
        external 
        view 
        validEscrow(_escrowId) 
        returns (Escrow memory) 
    {
        return escrows[_escrowId];
    }
    
    /**
     * @notice Get buyer's escrows
     * @param _buyer Buyer address
     */
    function getBuyerEscrows(address _buyer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return buyerEscrows[_buyer];
    }
    
    /**
     * @notice Get seller's escrows
     * @param _seller Seller address
     */
    function getSellerEscrows(address _seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return sellerEscrows[_seller];
    }
    
    /**
     * @notice Check if escrow can be released
     * @param _escrowId Escrow ID
     */
    function canReleaseEscrow(uint256 _escrowId) 
        external 
        view 
        validEscrow(_escrowId) 
        returns (bool) 
    {
        Escrow storage escrow = escrows[_escrowId];
        return escrow.status == EscrowStatus.ACTIVE && 
               block.timestamp >= escrow.releaseTime;
    }
    
    /**
     * @notice Get contract version
     */
    function version() external pure returns (uint256) {
        return VERSION;
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