# 🚀 Vercel Deployment Guide - NFT Factory Client

## Quick Start Deployment

### Option 1: Vercel CLI (Recommended)

```bash
# Navigate to client directory
cd "/Users/mac/NFT Factory/NFTFactory/client"

# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. **Push code to GitHub** ✅ (Already done - branch: `v3-architecture`)
   - Repository: https://github.com/MadefromLight/NFT-Factory
   - Branch: `v3-architecture`

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select: `MadefromLight/NFT-Factory`
   - Configure:
     - **Framework Preset:** Next.js
     - **Root Directory:** `client`
     - **Build Command:** `npm run build`
     - **Output Directory:** `.next`
     - **Install Command:** `npm install`

3. **Add Environment Variables**
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=d53916a1cd392d59c255e0b115c9d442
   NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/KgTV8U-VkMAe7rYR_0ltT
   
   # ✅ Contracts Already Deployed on Base Sepolia!
   NEXT_PUBLIC_FACTORY_PROXY_ADDRESS=0x211C3c71Aa0Aac76eaA989CA193D03b132358960
   NEXT_PUBLIC_COLLECTION_IMPLEMENTATION=0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0
   NEXT_PUBLIC_SUBSCRIPTION_NFT=0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~3-5 minutes)
   - Get your deployment URL!

---

## ⚠️ Important Notes

### Current Build Status
- ✅ Wallet connection fully functional
- ⚠️ Some TypeScript warnings (non-blocking)
- ⚠️ MetaMask SDK warning (optional dependency)
- ✅ Production build succeeds with warnings

### Known Warnings (Safe to Ignore for Now)
```
1. Module not found: '@react-native-async-storage/async-storage'
   - This is an optional MetaMask SDK dependency
   - Doesn't affect Coinbase Wallet functionality
   
2. Attempted import error from wagmi v1 API
   - Affects: collections/[id]/page.tsx, launchpad/apply/page.tsx
   - These pages need wagmi v2 migration
   - Doesn't block wallet connection or core functionality

3. Factory import stub in create/page.tsx
   - Contract addresses now configured in .env.local and constants/*.json
   - Create page uses stub for build compatibility
```

---

## 🧪 Post-Deployment Testing Checklist

### 1. Wallet Connection Test
- [ ] Navigate to deployed site
- [ ] Click "Connect Wallet" button
- [ ] Verify Coinbase Wallet / Base wallet appears
- [ ] Connect wallet successfully
- [ ] Verify wallet address displays in UI
- [ ] Check Redux state has wallet address

### 2. Navigation Test
- [ ] Access protected routes after connecting:
  - `/merchant/dashboard`
  - `/merchant/onboarding`
  - `/profile`
- [ ] Verify wallet connection persists across page refreshes

### 3. Network Test
- [ ] Verify connected to Base Sepolia network
- [ ] Check transaction explorer links work
- [ ] Confirm RPC calls succeed (check browser console)

---

## 🔧 Troubleshooting

### Build Fails on Vercel

**Error: TypeScript compilation fails**
```bash
# Solution: Check build logs in Vercel dashboard
# Common fixes:
1. Verify Node version (should be 18+)
2. Clear cache: vercel --force
3. Check environment variables are set correctly
```

**Error: Module not found**
```bash
# Solution: Ensure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "fix: Add missing dependencies"
git push
```

### Wallet Connection Doesn't Work

**Check these in order:**
1. Browser console for errors
2. Network tab for failed RPC calls
3. Verify WalletConnect project ID is valid: `d53916a1cd392d59c255e0b115c9d442`
4. Check Base Sepolia RPC endpoint is accessible
5. Ensure wallet extension is installed and unlocked
6. Verify contract addresses are correct:
   - Factory Proxy: `0x211C3c71Aa0Aac76eaA989CA193D03b132358960`
   - SubscriptionNFT: `0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e`

### Connected But Can't Interact

**Possible issues:**
- Wrong network (should be Base Sepolia)
- Insufficient testnet ETH
- ✅ Contract addresses ARE configured correctly:
  - Factory Proxy: `0x211C3c71Aa0Aac76eaA989CA193D03b132358960`
  - Collection Implementation: `0xA068c85535B4fBF25B959Dcf1187b48fC7BE9Cf0`
  - SubscriptionNFT: `0x5ca321ADff3189dB3A0210F58B0e7732c2c4082e`
- Check `.env.local` values match deployed contracts

---

## 📊 Performance Optimization

### Recommended Additions (Optional)

1. **Image Optimization**
   ```bash
   cd client
   npm install sharp
   git add .
   git commit -m "feat: Add sharp for image optimization"
   git push
   ```

2. **Analytics** (Optional)
   - Add Vercel Analytics
   - Add Google Analytics
   - Track wallet connection events

3. **Caching**
   - Enable Vercel's Edge Caching
   - Configure revalidation for dynamic content

---

## 🌐 Custom Domain Setup

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your domain: `nftfactory.com`
   - Follow DNS configuration instructions

2. **DNS Records:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - Takes ~5-10 minutes to activate

---

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to `v3-architecture` branch:

```bash
# Make changes
git add .
git commit -m "feat: Your new feature"
git push origin v3-architecture

# Vercel will automatically:
# 1. Detect the push
# 2. Run npm install
# 3. Run npm run build
# 4. Deploy to preview URL
# 5. Update production deployment
```

---

## 📈 Monitoring & Logs

### View Deployment Logs
1. Vercel Dashboard → Your Project
2. Click on latest deployment
3. View build logs in real-time

### Monitor Runtime Errors
1. Enable Vercel Analytics
2. Check Function logs for server-side errors
3. Use browser console for client-side errors

### Performance Metrics
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Core Web Vitals automatically tracked

---

## 🎯 Production Readiness Checklist

Before going live:

- [ ] All environment variables configured in Vercel
- [ ] Contract addresses deployed and configured
- [ ] Wallet connection tested on production
- [ ] All critical user flows tested
- [ ] Error handling implemented
- [ ] Loading states working properly
- [ ] Mobile responsive design verified
- [ ] SEO meta tags configured
- [ ] Social sharing images added
- [ ] Analytics tracking enabled
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active

---

## 🆘 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **wagmi Docs:** https://wagmi.sh
- **Base Docs:** https://docs.base.org

### Community Support
- Vercel Discord: https://discord.gg/vercel
- Next.js GitHub Discussions: https://github.com/vercel/next.js/discussions

---

## 📞 Contact

For deployment issues or questions:
- Check `WALLET_FIX_SUMMARY.md` for technical details
- Review deployment logs in Vercel dashboard
- Test locally first: `npm run dev`

---

**Last Updated:** March 19, 2026  
**Current Branch:** `v3-architecture`  
**Status:** Ready for Deployment ✅
