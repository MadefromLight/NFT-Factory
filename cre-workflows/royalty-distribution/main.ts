/**
 * Cross-Chain NFT Royalty Distribution Workflow
 * 
 * This CRE workflow automatically distributes NFT sale proceeds across multiple chains:
 * - Triggers on marketplace sale events (EVM log trigger)
 * - Calculates fee splits: creator royalties, platform fees, seller proceeds
 * - Distributes via CCIP to recipients on different chains
 * - Logs all transactions for transparency
 * 
 * @workflow royalty-distribution
 * @chain Base Sepolia (primary), Ethereum Sepolia (destination)
 */

import { cre } from "@chainlink/cre-sdk-ts";
import { evm } from "@chainlink/cre-sdk-ts/capabilities/blockchain/evm";
import { ccip } from "@chainlink/cre-sdk-ts/capabilities/ccip";
import { http } from "@chainlink/cre-sdk-ts/capabilities/networking/http";

// ============================================
// Configuration Interface
// ============================================
interface Config {
  marketplaceAddress: string;
  ccipRouterAddress: string;
  supportedChains: {
    [key: string]: {
      selector: string;
      enabled: boolean;
      rpcUrl: string;
    };
  };
  feeDistribution: {
    platformFeeBps: number;
    maxCreatorRoyaltyBps: number;
  };
  alertWebhook?: string; // Optional webhook for notifications
}

// ============================================
// Type Definitions
// ============================================
interface SaleEvent {
  tokenContract: string;
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  platformFee: bigint;
  royaltyFee: bigint;
}

interface RoyaltyRecipient {
  address: string;
  chainSelector: string;
  amount: bigint;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate fee distribution from sale price
 */
function calculateFees(
  price: bigint,
  config: Config
): { platformFee: bigint; creatorRoyalty: bigint; sellerProceeds: bigint } {
  const platformFee = (price * BigInt(config.feeDistribution.platformFeeBps)) / BigInt(10000);
  const creatorRoyalty = (price * BigInt(config.feeDistribution.maxCreatorRoyaltyBps)) / BigInt(10000);
  const sellerProceeds = price - platformFee - creatorRoyalty;

  return { platformFee, creatorRoyalty, sellerProceeds };
}

/**
 * Fetch creator royalty info from NFT contract
 */
async function fetchCreatorRoyalty(
  runtime: cre.Runtime,
  tokenContract: string,
  tokenId: bigint,
  chainSelector: string
): Promise<{ receiver: string; amount: bigint }> {
  const evmClient = new evm.Client({ chainSelector });

  // ABI for royaltyInfo function (EIP-2981)
  const royaltyABI = [
    "function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)"
  ];

  const contract = new evm.Contract(tokenContract, royaltyABI, evmClient);
  
  try {
    const result = await contract.read("royaltyInfo", [tokenId, /* salePrice */ 0n]);
    return {
      receiver: result[0] as string,
      amount: result[1] as bigint
    };
  } catch (error) {
    runtime.log(`Failed to fetch royalty info: ${error}`);
    return { receiver: "0x0000000000000000000000000000000000000000", amount: 0n };
  }
}

/**
 * Send tokens cross-chain via CCIP
 */
async function sendCrossChainPayment(
  runtime: cre.Runtime,
  recipient: RoyaltyRecipient,
  ccipRouter: string
): Promise<string> {
  const evmClient = new evm.Client({ chainSelector: "10344971235874465080" }); // Base Sepolia
  
  const ccipClient = new ccip.Client({ router: ccipRouter });

  // Prepare CCIP message
  const messageRequest: ccip.SendRequest = {
    destinationChainSelector: recipient.chainSelector,
    receiver: recipient.address,
    data: "0x", // No additional data needed for simple transfer
    tokenAmounts: [
      {
        token: "0x0000000000000000000000000000000000000000", // Native ETH
        amount: recipient.amount
      }
    ]
  };

  try {
    const messageId = await ccipClient.send(runtime, messageRequest);
    runtime.log(`CCIP message sent: ${messageId}`);
    return messageId;
  } catch (error) {
    runtime.log(`CCIP transfer failed: ${error}`);
    throw error;
  }
}

/**
 * Send alert notification via webhook
 */
async function sendAlert(
  runtime: cre.Runtime,
  webhookUrl: string,
  eventData: any
): Promise<void> {
  const httpClient = new http.Client();

  try {
    await http.sendRequest(runtime, {
      url: webhookUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventData)
    });
    runtime.log("Alert sent successfully");
  } catch (error) {
    runtime.log(`Failed to send alert: ${error}`);
  }
}

// ============================================
// Main Workflow Callback
// ============================================

/**
 * Triggered when a sale event occurs on the marketplace
 */
async function onSaleEvent(
  config: Config,
  runtime: cre.Runtime,
  salePayload: SaleEvent
): Promise<void> {
  const logger = runtime.logger();
  logger.info("Sale event detected", {
    tokenContract: salePayload.tokenContract,
    tokenId: salePayload.tokenId.toString(),
    price: salePayload.price.toString()
  });

  // Step 1: Calculate fees
  const { platformFee, creatorRoyalty, sellerProceeds } = calculateFees(
    salePayload.price,
    config
  );

  logger.info("Fee distribution calculated", {
    platformFee: platformFee.toString(),
    creatorRoyalty: creatorRoyalty.toString(),
    sellerProceeds: sellerProceeds.toString()
  });

  // Step 2: Fetch creator royalty details
  const creatorInfo = await fetchCreatorRoyalty(
    runtime,
    salePayload.tokenContract,
    salePayload.tokenId,
    "10344971235874465080" // Base Sepolia
  );

  logger.info("Creator royalty info fetched", {
    receiver: creatorInfo.receiver,
    amount: creatorInfo.amount.toString()
  });

  // Step 3: Prepare recipients
  const recipients: RoyaltyRecipient[] = [
    {
      address: config.marketplaceAddress, // Platform fee recipient
      chainSelector: "10344971235874465080", // Base Sepolia
      amount: platformFee
    },
    {
      address: creatorInfo.receiver,
      chainSelector: "10344971235874465080", // Same chain for now
      amount: creatorInfo.amount
    },
    {
      address: salePayload.seller,
      chainSelector: "10344971235874465080", // Same chain for now
      amount: sellerProceeds
    }
  ];

  // Step 4: Execute cross-chain distributions
  const distributionResults: string[] = [];
  
  for (const recipient of recipients) {
    if (recipient.amount === 0n) continue;

    try {
      const messageId = await sendCrossChainPayment(
        runtime,
        recipient,
        config.ccipRouterAddress
      );
      distributionResults.push(messageId);
      logger.info("Payment sent", {
        to: recipient.address,
        amount: recipient.amount.toString(),
        messageId
      });
    } catch (error) {
      logger.error("Payment failed", {
        to: recipient.address,
        error: String(error)
      });
      
      // Send alert if configured
      if (config.alertWebhook) {
        await sendAlert(runtime, config.alertWebhook, {
          type: "PAYMENT_FAILED",
          recipient: recipient.address,
          amount: recipient.amount.toString(),
          error: String(error)
        });
      }
    }
  }

  // Step 5: Log completion
  logger.info("Distribution complete", {
    totalRecipients: recipients.length,
    successfulTransfers: distributionResults.length,
    messageIds: distributionResults
  });

  // Step 6: Send success notification
  if (config.alertWebhook) {
    await sendAlert(runtime, config.alertWebhook, {
      type: "ROYALTY_DISTRIBUTED",
      sale: salePayload,
      distributions: {
        platformFee: platformFee.toString(),
        creatorRoyalty: creatorRoyalty.toString(),
        sellerProceeds: sellerProceeds.toString(),
        successfulTransfers: distributionResults.length
      }
    });
  }
}

// ============================================
// Workflow Definition
// ============================================

export default async function initWorkflow(
  config: Config
): Promise<cre.Workflow<Config>> {
  // EVM Log Trigger configuration
  const logTriggerConfig: evm.LogTriggerConfig = {
    address: config.marketplaceAddress,
    eventSignature: "event Sold(address indexed tokenContract, uint256 indexed tokenId, address indexed seller, address buyer, uint256 price, uint256 platformFee, uint256 royaltyFee)",
    confirmations: 3
  };

  return cre.Workflow.fromHandlers([
    cre.Handler(
      evm.LogTrigger(logTriggerConfig),
      async (runtime, payload) => {
        const saleEvent: SaleEvent = {
          tokenContract: payload.args[0] as string,
          tokenId: payload.args[1] as bigint,
          seller: payload.args[2] as string,
          buyer: payload.args[3] as string,
          price: payload.args[4] as bigint,
          platformFee: payload.args[5] as bigint,
          royaltyFee: payload.args[6] as bigint
        };

        await onSaleEvent(config, runtime, saleEvent);
      }
    )
  ]);
}
