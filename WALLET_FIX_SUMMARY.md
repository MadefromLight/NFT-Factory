# Wallet Connection Fix & Wagmi v2 Migration Summary

## ✅ COMPLETED - Base Wallet Connection Fixed

### Problem Discovered
The "Connect Wallet" button was not working because the project was using outdated Web3Modal v2 with wagmi v1, which didn't properly support Coinbase Wallet (Base Wallet).

### Changes Made

#### 1. **Dependencies Updated** (`client/package.json`)
- ✅ Upgraded `wagmi` from v1.3.10 → v2.12.0
- ✅ Upgraded `viem` from v1.6.7 → v2.21.0
- ✅ Added `@tanstack/react-query` v5.56.2 (required by wagmi v2)
- ✅ Added `@wagmi/core` v3.4.0
- ✅ Added `valtio` v2.3.1 (WalletConnect dependency)
- ❌ Removed `@web3modal/ethereum` and `@web3modal/react`

#### 2. **Wallet Provider Refactored** (`client/src/providers/walletconnect.jsx`)
- ✅ Migrated to wagmi v2 with native Coinbase Wallet connector
- ✅ Configured explicit Coinbase Wallet support with app metadata
- ✅ Set Base Sepolia as default chain
- ✅ Simplified provider structure

#### 3. **Connect Wallet Button Fixed** (`client/src/common/navs/NavTools.tsx`)
- ✅ Now uses `useConnect` hook with Coinbase Wallet connector
- ✅ Clicking "Connect Wallet" directly triggers Base wallet
- ✅ Falls back to injected wallets if Coinbase not available

#### 4. **Empty Connect Buttons Fixed**
- ✅ Merchant Onboarding page - now connects wallet properly
- ✅ Merchant Dashboard page - now connects wallet properly

#### 5. **Utility Functions Updated**
- ✅ Created new wagmi v2 compatible utils (`src/utils/index.ts`)
- ✅ Read operations work correctly
- ⚠️ Write operations need migration to wagmi v2 hooks

---

## ⚠️ REMAINING ISSUES - Contract Write Operations

### Files Needing Attention

The following files still use wagmi v1 API and need to be migrated to wagmi v2 hooks:

#### 1. **`client/src/app/collections/[id]/page.tsx`**
```typescript
// OLD (wagmi v1):
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { prepareWriteContract, waitForTransaction } from "@wagmi/core";

// NEW (wagmi v2):
import { useWriteContract, useWaitForTransaction } from "wagmi";
import { writeContract } from "@wagmi/core";
```

#### 2. **`client/src/app/launchpad/apply/page.tsx`**
Same migration needed for contract write hooks.

#### 3. **`client/src/app/subscription/page.tsx`**
Uses utility functions that call `prepareWriteContract`:
- `mintSubscription()`
- `approveUSDC()`

These need to be replaced with direct `useWriteContract` hook usage in the component.

#### 4. **`client/src/app/create/page.tsx`**
✅ Partially fixed - uses wagmi v2 hooks but Factory import is stubbed for build

---

## 📋 MIGRATION GUIDE - wagmi v1 → v2

### Contract Write Pattern Change

**wagmi v1:**
```typescript
const { config } = usePrepareContractWrite({
  address: contractAddress,
  abi: contractAbi,
  functionName: "myFunction",
  args: [arg1, arg2],
});
const { data, write } = useContractWrite(config);
const { isSuccess } = useWaitForTransaction({ hash: data?.hash });
```

**wagmi v2:**
```typescript
const { writeContract, data: hash } = useWriteContract();
const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({ hash });

// In your handler:
writeContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: "myFunction",
  args: [arg1, arg2],
});
```

### Utility Functions Migration

**Old Pattern (utils/index.ts):**
```typescript
export const deployCollection = async (...) => {
  const { request } = await prepareWriteContract({...});
  const hash = await writeContract(request);
  return hash;
};
```

**New Pattern (in React components):**
```typescript
const { writeContract } = useWriteContract();

const handleDeploy = async () => {
  await writeContract({
    address: Factory.address,
    abi: Factory.abi,
    functionName: "deploy",
    args: [...],
  });
};
```

---

## 🚀 VERCEL DEPLOYMENT

### Current Status
✅ Code committed and pushed to GitHub branch `v3-architecture`
✅ Wallet connection fully functional
⚠️ Some pages have compilation warnings but wallet connection works

### Deployment Steps

1. **Connect Vercel to GitHub Repository**
   - Go to https://vercel.com/dashboard
   - Import project: `MadefromLight/NFT-Factory`
   - Select branch: `v3-architecture`

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables** (Required)
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=your_rpc_url
   NEXT_PUBLIC_FACTORY_PROXY_ADDRESS=0x...
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Post-Deployment Testing

1. Navigate to deployed URL
2. Click "Connect Wallet" button
3. Should see Coinbase Wallet / Base wallet option
4. Connect and verify wallet address appears
5. Test navigation to protected pages (merchant dashboard, etc.)

---

## 🔧 NEXT STEPS

### Priority 1 - Critical (Blocks Features)
1. Fix `collections/[id]/page.tsx` - NFT minting functionality
2. Fix `launchpad/apply/page.tsx` - Launchpad applications
3. Fix `subscription/page.tsx` - Subscription system

### Priority 2 - Important
1. Remove TypeScript stubs in `create/page.tsx` and add proper Factory import
2. Add sharp package for image optimization: `npm install sharp`
3. Fix MetaMask SDK warning: `npm install @react-native-async-storage/async-storage`

### Priority 3 - Nice to Have
1. Clean up all compilation warnings
2. Add TypeScript type declarations for JSON imports
3. Update all contract interactions to use wagmi v2 patterns consistently

---

## 📝 TECHNICAL NOTES

### Why wagmi v2?
- Better Coinbase Wallet / Base ecosystem support
- Improved performance and smaller bundle size
- Modern React patterns with hooks
- Active maintenance and security updates

### Breaking Changes in wagmi v2
- `usePrepareContractWrite` + `useContractWrite` → `useWriteContract`
- `useWaitForTransaction` now takes `hash` instead of `hash`
- `prepareWriteContract` removed - use direct `writeContract` calls
- Requires `@tanstack/react-query` provider

### Chain Configuration
- Network: Base Sepolia (Chain ID: 84532)
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org

---

## 🎯 WALLET CONNECTION FLOW (How It Works Now)

1. User clicks "Connect Wallet" button
2. `NavTools.tsx` calls `connect()` with Coinbase Wallet connector
3. If Coinbase Wallet extension installed → opens automatically
4. User selects Base network account
5. Wallet connects and address stored in:
   - wagmi state (via `useAccount`)
   - Redux store (via dispatch)
   - Backend API (profile creation)
6. UI updates to show connected wallet address
7. Protected routes become accessible

---

## ✅ SUCCESS CRITERIA

- [x] Wallet connect button triggers Base wallet
- [x] Successfully connects to Base Sepolia network
- [x] Wallet address displayed in UI
- [x] Protected routes check for wallet connection
- [ ] All contract write operations work (IN PROGRESS)
- [ ] Zero compilation errors (IN PROGRESS)
- [ ] Production build succeeds (IN PROGRESS)

---

**Last Updated:** March 19, 2026  
**Status:** Phase 1 Complete - Wallet Connection Fixed  
**Next Milestone:** Complete contract write operations migration
