"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Base Sepolia chain definition
const chains = [baseSepolia];

// Create wagmi config with explicit Coinbase Wallet support
const metadata = {
  name: 'NFT Factory',
  description: 'NFT Factory Platform',
  url: 'https://nftfactory.com',
  icons: ['https://avatars.githubusercontent.com/u/37784883']
};

const wagmiConfig = createConfig({
  chains,
  connectors: [
    coinbaseWallet({
      appName: 'NFT Factory',
      appLogoUrl: 'https://avatars.githubusercontent.com/u/37784883',
      darkMode: true,
    }),
    injected({ shimDisconnect: true }),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

// Create query client
const queryClient = new QueryClient();

export { wagmiConfig, queryClient };

export default function WalletConnectProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
