// Wagmi v2 Compatible Utility Functions
// This file provides read-only contract interaction utilities
// For write operations, use wagmi v2 hooks (useWriteContract, useSimulateContract) directly in components

import { readContract as readContractData } from "@wagmi/core";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "wagmi/chains";
import Factory from "../../constants/Factory.json";
import SimpleCollectible from "../../constants/SimpleCollectible.json";
import SubscriptionNFT from "../../constants/SubscriptionNFT.json";
import Marketplace from "../../constants/Marketplace.json";

// Base Sepolia Chain ID
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Create public client for reading
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Tier enum mapping
export enum SubscriptionTier {
  COAL = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
}

// Factory Contract Read Functions
export const readFactoryContract = async (
  functionName: string,
  args: any[] = []
) => {
  if (!Factory.address) {
    throw new Error("Factory address not configured. Please deploy contracts first.");
  }
  
  const data = await readContractData({
    address: Factory.address as `0x${string}`,
    abi: Factory.abi,
    functionName,
    args,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  } as any, { publicClient });

  return data;
};

// SimpleCollectible Contract Read Functions
export const readSimpleCollectibleContract = async (
  address: `0x${string}`,
  functionName: string,
  args: any[] = []
) => {
  try {
    const data = await readContractData({
      address,
      abi: SimpleCollectible.abi,
      functionName,
      args,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    } as any);

    return functionName === "name" ? String(data).split(",")[0] : data;
  } catch (err) {
    console.error("Error reading contract:", err);
    return null;
  }
};

// Helper Functions
export const getAllCollections = async () => {
  try {
    const collections = await readFactoryContract("getMarketPlaces");
    return collections as `0x${string}`[];
  } catch (err) {
    console.error("Error fetching collections:", err);
    return [];
  }
};

export const getCollectionDetails = async (collectionAddress: `0x${string}`) => {
  try {
    const [name, symbol, totalSupply] = await Promise.all([
      readSimpleCollectibleContract(collectionAddress, "name"),
      readSimpleCollectibleContract(collectionAddress, "symbol"),
      readSimpleCollectibleContract(collectionAddress, "totalSupply"),
    ]);

    return { name, symbol, totalSupply, address: collectionAddress };
  } catch (err) {
    console.error("Error fetching collection details:", err);
    return null;
  }
};

export const getUserNFTs = async (
  collectionAddress: `0x${string}`,
  userAddress: `0x${string}`
) => {
  try {
    const tokenIds = await readSimpleCollectibleContract(
      collectionAddress,
      "getTokenData",
      [userAddress]
    );
    return tokenIds as bigint[];
  } catch (err) {
    console.error("Error fetching user NFTs:", err);
    return [];
  }
};

export const getNFTMetadata = async (
  collectionAddress: `0x${string}`,
  tokenId: bigint
) => {
  try {
    const tokenURI = await readSimpleCollectibleContract(
      collectionAddress,
      "tokenURI",
      [tokenId]
    );
    return tokenURI as string;
  } catch (err) {
    console.error("Error fetching NFT metadata:", err);
    return null;
  }
};

// ============ SubscriptionNFT Contract Functions ============

export const readSubscriptionNFTContract = async (
  functionName: string,
  args: any[] = []
) => {
  if (!SubscriptionNFT.address) {
    throw new Error("SubscriptionNFT address not configured.");
  }

  const data = await readContractData({
    address: SubscriptionNFT.address as `0x${string}`,
    abi: SubscriptionNFT.abi,
    functionName,
    args,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  } as any);

  return data;
};

export const getUserSubscription = async (walletAddress: `0x${string}`) => {
  try {
    const result = await readSubscriptionNFTContract("getSubscriptionId", [walletAddress]);
    const subscriptionId = (result as unknown[])[0];
    return BigInt(subscriptionId as string);
  } catch (err) {
    console.error("Error fetching user subscription:", err);
    return null;
  }
};

export const hasActiveSubscription = async (walletAddress: `0x${string}`) => {
  try {
    const result = await readSubscriptionNFTContract("hasActiveSubscription", [walletAddress]);
    // Handle both array and direct boolean return
    if (Array.isArray(result)) {
      return Boolean(result[0]);
    }
    return Boolean(result);
  } catch (err) {
    console.error("Error checking subscription status:", err);
    return false;
  }
};

export const getSubscriptionDetails = async (walletAddress: `0x${string}`) => {
  try {
    // Get subscription ID
    const subIdResult = await readSubscriptionNFTContract("getSubscriptionId", [walletAddress]);
    const subscriptionId = Array.isArray(subIdResult) ? subIdResult[0] : subIdResult;
    
    if (!subscriptionId || subscriptionId === "0") {
      return null;
    }

    // Get subscription info
    const infoResult = await readSubscriptionNFTContract("getSubscriptionInfo", [subscriptionId]);
    const info = Array.isArray(infoResult) ? infoResult[0] : infoResult;

    // Get tier name
    const tierNames = ["COAL", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
    const tier = Number(info.tier || 0);
    const tierName = tierNames[tier] || "UNKNOWN";

    // Get verification status
    const statusNames = ["VERIFIED", "UNDER_REVIEW", "SUSPENDED"];
    const verificationStatus = Number(info.verificationStatus || 0);
    const statusName = statusNames[verificationStatus] || "UNKNOWN";

    return {
      subscriptionId: String(subscriptionId),
      tier,
      tierName,
      totalMintQuota: Number(info.totalMintQuota || 0),
      remainingMintQuota: Number(info.remainingMintQuota || 0),
      verificationStatus: statusName,
      isActive: Boolean(info.isActive || false),
      createdAt: info.createdAt ? new Date(Number(info.createdAt) * 1000).toISOString() : null,
    };
  } catch (err) {
    console.error("Error fetching subscription details:", err);
    return null;
  }
};

export const getTierPricing = async (tier: SubscriptionTier) => {
  try {
    const result = await readSubscriptionNFTContract("tierPrices", [tier]);
    // Handle both array and direct return
    const price = Array.isArray(result) ? result[0] : result;
    return price ? BigInt(price as string) : null;
  } catch (err) {
    console.error("Error fetching tier pricing:", err);
    return null;
  }
};

// Get USDC token address from SubscriptionNFT contract
export const getUSDCAddress = async () => {
  try {
    const result = await readSubscriptionNFTContract("usdcToken");
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error("Error fetching USDC address:", err);
    // Base Sepolia USDC address (default)
    return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  }
};

// Check USDC allowance
export const getUSDCAllowance = async (
  owner: `0x${string}`,
  spender: `0x${string}`
) => {
  try {
    const usdcAddress = await getUSDCAddress();
    const result = await readContractData({
      address: usdcAddress as `0x${string}`,
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          name: "allowance",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "allowance",
      args: [owner, spender],
      chainId: BASE_SEPOLIA_CHAIN_ID,
    } as any);
    return BigInt((result as unknown[])[0] as string);
  } catch (err) {
    console.error("Error fetching USDC allowance:", err);
    return BigInt(0);
  }
};

// Get NFTs owned by a user across all collections
export const getAllUserNFTs = async (userAddress: `0x${string}`) => {
  try {
    // Get all collections from factory
    const result = await readFactoryContract("getMarketPlaces");
    const collections = Array.isArray(result) ? result : [];
    const userNFTs: any[] = [];
    
    for (const collectionAddress of collections) {
      try {
        const addr = collectionAddress as `0x${string}`;
        // Get collection name
        const nameResult = await readSimpleCollectibleContract(addr, "name");
        const collectionName = Array.isArray(nameResult) ? nameResult[0] : nameResult;
        
        // Get balance of user in this collection
        const balanceResult = await readSimpleCollectibleContract(addr, "balanceOf", [userAddress]);
        const balance = Array.isArray(balanceResult) ? Number(balanceResult[0]) : Number(balanceResult);
        
        if (balance > 0) {
          // Get token IDs owned by user
          for (let i = 0; i < balance; i++) {
            try {
              const tokenIdResult = await readSimpleCollectibleContract(
                addr, 
                "tokenOfOwnerByIndex", 
                [userAddress, i]
              );
              const tokenId = Array.isArray(tokenIdResult) ? tokenIdResult[0] : tokenIdResult;
              
              // Get token URI
              const tokenURIResult = await readSimpleCollectibleContract(
                addr,
                "tokenURI",
                [tokenId]
              );
              const tokenURI = Array.isArray(tokenURIResult) ? tokenURIResult[0] : tokenURIResult;
              
              userNFTs.push({
                collectionAddress: addr,
                collectionName,
                tokenId: String(tokenId),
                tokenURI,
              });
            } catch (e) {
              console.error(`Error fetching token ${i} from ${collectionAddress}:`, e);
            }
          }
        }
      } catch (e) {
        console.error(`Error reading collection ${collectionAddress}:`, e);
      }
    }
    
    return userNFTs;
  } catch (err) {
    console.error("Error fetching user NFTs:", err);
    return [];
  }
};

// ============ Marketplace Contract Functions ============

export const readMarketplaceContract = async (
  functionName: string,
  args: any[] = []
) => {
  if (!Marketplace.address) {
    throw new Error("Marketplace address not configured.");
  }

  const data = await readContractData({
    address: Marketplace.address as `0x${string}`,
    abi: Marketplace.abi,
    functionName,
    args,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  } as any);

  return data;
};

// NOTE: Write functions should be implemented using wagmi v2 hooks in components
// Example:
// const { writeContract } = useWriteContract();
// const { data: simulateData } = useSimulateContract({ ... });
// await writeContract(simulateData!.request);
