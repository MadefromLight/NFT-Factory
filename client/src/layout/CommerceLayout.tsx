import Button from "@/common/Button";
import TopNavigation from "@/common/navs/top/TopNavigation";
import FAQ from "@/components/Faq";
import Footer from "@/components/Footer";
import { orbitron, poppins } from "@/fonts/fonts";
import Image from "next/image";
import Link from "next/link";

const CommerceLayout = () => {
    return (
        <>
            <TopNavigation />
            <main className="w-full mt-28">
                <div className="w-[97%] tablet_l:w-[94%] laptop_l:w-[89%] max-w-[1280px] mx-auto">
                    
                    {/* Hero Section - Commerce Focus */}
                    <section className="flex flex-col tablet_l:flex-row justify-between items-center mt-6">
                        <div className="my-8 tablet_l:my-0 w-full tablet_l:w-[53%] laptop_l:w-[500px]">
                            <h1 className={`${orbitron.className} text-primary text-3xl laptop_l:text-4xl mb-4`}>
                                Build Your Web3 Business
                            </h1>
                            <p className="mb-8 text-white text-lg">
                                Create digital products, manage inventory, and sell to customers worldwide using blockchain technology. 
                                No technical expertise required.
                            </p>
                            
                            {/* 3-Step Merchant Onboarding */}
                            <div className="mb-10">
                                <h2 className={`${orbitron.className} text-xl text-white mb-4`}>
                                    Get Started in 3 Simple Steps
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary text-black rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                            1
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Connect Your Wallet</h3>
                                            <p className="text-gray-300 text-sm">Securely connect your crypto wallet to get started</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary text-black rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                            2
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Create Your Store</h3>
                                            <p className="text-gray-300 text-sm">Set up your business profile and start creating digital products</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary text-black rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                            3
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Start Selling</h3>
                                            <p className="text-gray-300 text-sm">List your products and reach customers globally</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <Link href="/merchant/onboarding">
                                    <Button
                                        className={`${orbitron.className} text-xl px-8 py-3 bg-gradient-linear hover:opacity-90 transition-opacity`}
                                    >
                                        Start Selling
                                    </Button>
                                </Link>
                                <Link href="/marketplace">
                                    <Button
                                        className={`${orbitron.className} text-xl px-8 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-colors`}
                                    >
                                        Browse Marketplace
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="w-full tablet_l:w-[50%] laptop_l:w-[45%]">
                            <Image 
                                src="/images/Group.svg" 
                                alt="Web3 Commerce Platform" 
                                height={500} 
                                width={500}
                                className="rounded-lg"
                            />
                        </div>
                    </section>

                    {/* Verified Merchant Badge System */}
                    <section className="mt-20 mb-16">
                        <div className="text-center mb-12">
                            <h2 className={`${orbitron.className} text-2xl text-white mb-4`}>
                                Trusted by Verified Merchants
                            </h2>
                            <p className="text-gray-300 max-w-2xl mx-auto">
                                Join thousands of businesses building trust through blockchain verification
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-green-500 rounded-full w-3 h-3"></div>
                                    <span className="text-green-400 font-medium">Verified Merchant</span>
                                </div>
                                <h3 className="text-white text-lg mb-2">Business Verification</h3>
                                <p className="text-gray-400 text-sm">
                                    Get verified to build trust with customers and access premium features
                                </p>
                            </div>
                            
                            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-500 rounded-full w-3 h-3"></div>
                                    <span className="text-blue-400 font-medium">Trust Score</span>
                                </div>
                                <h3 className="text-white text-lg mb-2">Reputation System</h3>
                                <p className="text-gray-400 text-sm">
                                    Earn trust points through successful transactions and customer reviews
                                </p>
                            </div>
                            
                            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-purple-500 rounded-full w-3 h-3"></div>
                                    <span className="text-purple-400 font-medium">Premium Tier</span>
                                </div>
                                <h3 className="text-white text-lg mb-2">Advanced Features</h3>
                                <p className="text-gray-400 text-sm">
                                    Unlock advanced analytics, marketing tools, and priority support
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Key Features Section */}
                    <section className="mt-16 mb-20">
                        <div className="text-center mb-12">
                            <h2 className={`${orbitron.className} text-2xl text-white mb-4`}>
                                Everything You Need to Sell Online
                            </h2>
                            <p className="text-gray-300 max-w-2xl mx-auto">
                                Powerful tools designed for modern businesses in the Web3 economy
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: "Digital Products",
                                    description: "Create and sell digital goods, NFTs, and virtual experiences",
                                    icon: "🛍️"
                                },
                                {
                                    title: "Smart Escrow",
                                    description: "Automated protection for both buyers and sellers",
                                    icon: "🔒"
                                },
                                {
                                    title: "Global Payments",
                                    description: "Accept crypto payments from customers worldwide",
                                    icon: "💳"
                                },
                                {
                                    title: "Analytics Dashboard",
                                    description: "Track sales, customers, and business performance",
                                    icon: "📊"
                                }
                            ].map((feature, index) => (
                                <div key={index} className="bg-gray-900 bg-opacity-30 p-6 rounded-lg border border-gray-700 hover:border-primary transition-colors">
                                    <div className="text-3xl mb-4">{feature.icon}</div>
                                    <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <div className="mt-14 mb-28 relative">
                        <FAQ />
                    </div>
                </div>

                <Footer />
                <div className="absolute bottom-0 right-0 bg-gradient-to-br from-transparent via-transparent to-primary opacity-10 w-[30%] h-[500px]"></div>
            </main>
        </>
    );
};

export default CommerceLayout;