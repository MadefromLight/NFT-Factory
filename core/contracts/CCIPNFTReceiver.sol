// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CCIPNFTReceiver
 * @dev Handles cross-chain NFT purchase messages via CCIP
 * 
 * This contract receives payment and purchase instructions from other chains
 * and executes the NFT purchase on the destination chain (Base Sepolia)
 */
contract CCIPNFTReceiver is CCIPReceiver {
    using SafeERC20 for IERC20;

    // Events
    event CrossChainPurchaseReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event MessageProcessed(bytes32 indexed messageId, bool success);

    event TokenRecovered(address indexed token, uint256 amount, address to);

    // Structs
    struct PurchaseMessage {
        address buyer;      // Buyer address on source chain
        address nftContract; // NFT contract address on this chain
        uint256 tokenId;    // Token ID to purchase
        uint256 amount;     // Payment amount
        bytes metadata;     // Additional data (e.g., royalty info)
    }

    // State variables
    address public marketplace; // Associated marketplace contract
    mapping(bytes32 => bool) public processedMessages; // Track processed messages

    // Errors
    error InvalidSender();
    error InvalidMessageFormat();
    error MessageAlreadyProcessed();
    error UnauthorizedMarketplace();
    error TransferFailed();

    /**
     * @param router Address of the CCIP router
     * @param _marketplace Address of the marketplace contract
     */
    constructor(address router, address _marketplace) CCIPReceiver(router) {
        if (_marketplace == address(0)) revert InvalidSender();
        marketplace = _marketplace;
    }

    /**
     * @dev Called by CCIP Router when a message arrives
     * @param anyReceivedMsg The message received from CCIP
     */
    function ccipReceive(
        Client.Any2EVMMessage memory anyReceivedMsg
    ) internal override {
        // Verify the message came from authorized marketplace on source chain
        if (keccak256(abi.encode(anyReceivedMsg.sender)) != keccak256(abi.encode(address(this)))) {
            revert InvalidSender();
        }

        bytes32 messageId = anyReceivedMsg.messageId;
        
        if (processedMessages[messageId]) {
            revert MessageAlreadyProcessed();
        }

        try this.processMessage(anyReceivedMsg) {
            processedMessages[messageId] = true;
            emit MessageProcessed(messageId, true);
        } catch {
            processedMessages[messageId] = true;
            emit MessageProcessed(messageId, false);
            revert("Message processing failed");
        }
    }

    /**
     * @dev Process the cross-chain purchase message
     * @param anyReceivedMsg The CCIP message
     */
    function processMessage(
        Client.Any2EVMMessage memory anyReceivedMsg
    ) external {
        // Decode the purchase message
        PurchaseMessage memory purchase = abi.decode(
            anyReceivedMsg.data,
            (PurchaseMessage)
        );

        // Validate message format
        if (purchase.nftContract == address(0) || purchase.amount == 0) {
            revert InvalidMessageFormat();
        }

        emit CrossChainPurchaseReceived(
            anyReceivedMsg.messageId,
            anyReceivedMsg.sourceChainSelector,
            purchase.buyer,
            purchase.nftContract,
            purchase.tokenId,
            purchase.amount
        );

        // Handle received tokens (ETH or ERC20)
        if (anyReceivedMsg.destTokenAmounts.length > 0) {
            // ERC20 token received
            Client.EVMTokenAmount memory tokenAmount = anyReceivedMsg.destTokenAmounts[0];
            
            // Transfer tokens to marketplace for processing
            IERC20(tokenAmount.token).safeTransfer(marketplace, tokenAmount.amount);
        } else {
            // Native ETH received (already in this contract)
            payable(marketplace).transfer(address(this).balance);
        }

        // Call marketplace to execute the purchase
        // Marketplace will handle:
        // 1. Verifying the listing exists
        // 2. Transferring NFT to buyer (cross-chain or wrapped)
        // 3. Distributing royalties via CRE workflow
        IMarketplace(marketplace).executeCrossChainPurchase{
            value: address(this).balance
        }(
            purchase.buyer,
            purchase.nftContract,
            purchase.tokenId,
            purchase.amount,
            purchase.metadata
        );
    }

    /**
     * @dev Update the marketplace address (admin only)
     * @param _marketplace New marketplace address
     */
    function setMarketplace(address _marketplace) external {
        if (_marketplace == address(0)) revert InvalidSender();
        marketplace = _marketplace;
    }

    /**
     * @dev Emergency withdrawal of stuck tokens
     * @param token Token address (address(0) for native ETH)
     * @param to Recipient address
     */
    function recoverTokens(address token, uint256 amount, address to) external {
        require(msg.sender == marketplace, "Only marketplace can recover");
        
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit TokenRecovered(token, amount, to);
    }

    receive() external payable {}
}

/**
 * @dev Minimal interface for Marketplace integration
 */
interface IMarketplace {
    function executeCrossChainPurchase(
        address buyer,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        bytes calldata metadata
    ) external payable;
}
