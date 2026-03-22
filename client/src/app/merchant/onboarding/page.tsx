"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import TopNavigation from "@/common/navs/top/TopNavigation";
import Footer from "@/components/Footer";
import { orbitron } from "@/fonts/fonts";
import Button from "@/common/Button";
import Link from "next/link";

const MerchantOnboarding = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    description: "",
    walletAddress: address || "",
  });

  const totalSteps = 4;

  const steps = [
    { id: 1, title: "Wallet Connection", description: "Connect your crypto wallet" },
    { id: 2, title: "Business Profile", description: "Tell us about your business" },
    { id: 3, title: "Verification", description: "Upload required documents" },
    { id: 4, title: "Subscription", description: "Choose your plan" },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Handle final submission
    console.log("Business data submitted:", businessData);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex flex-col items-center ${step.id <= currentStep ? 'text-primary' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step.id <= currentStep 
                ? 'border-primary bg-primary text-black' 
                : 'border-gray-500'
            }`}>
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <span className="text-sm mt-2 hidden md:block">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-1 mx-2 ${step.id < currentStep ? 'bg-primary' : 'bg-gray-500'}`}></div>
          )}
        </div>
      ))}
    </div>
  );

  const StepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <h2 className={`${orbitron.className} text-2xl text-white mb-4`}>
              Connect Your Wallet
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Securely connect your cryptocurrency wallet to verify your identity and enable transactions on our platform.
            </p>
            
            {!isConnected ? (
              <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 max-w-md mx-auto">
                <div className="text-5xl mb-4">💳</div>
                <h3 className="text-white text-lg mb-2">Wallet Not Connected</h3>
                <p className="text-gray-400 mb-6">
                  Please connect your wallet to continue the onboarding process
                </p>
                <Button handleClick={() => connect({ connector: coinbaseWallet({ appName: 'NFT Factory', darkMode: true }) })} className="w-full bg-primary hover:opacity-90">
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md mx-auto">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-white text-lg mb-2">Wallet Connected</h3>
                <p className="text-green-400 mb-4">
                  Successfully connected to: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <div className="text-sm text-gray-400">
                  Ready to proceed with your business setup
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className={`${orbitron.className} text-2xl text-white mb-4 text-center`}>
              Tell Us About Your Business
            </h2>
            <p className="text-gray-300 mb-8 text-center">
              Share some basic information about your business to help customers find you.
            </p>
            
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
              <div className="space-y-6">
                <div>
                  <label className="block text-white mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({...businessData, businessName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="Enter your business name"
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-2">Business Type *</label>
                  <select
                    value={businessData.businessType}
                    onChange={(e) => setBusinessData({...businessData, businessType: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                  >
                    <option value="">Select business type</option>
                    <option value="digital-goods">Digital Goods</option>
                    <option value="services">Services</option>
                    <option value="art-creatives">Art & Creatives</option>
                    <option value="gaming">Gaming</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white mb-2">Website (Optional)</label>
                  <input
                    type="url"
                    value={businessData.website}
                    onChange={(e) => setBusinessData({...businessData, website: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-2">Business Description</label>
                  <textarea
                    value={businessData.description}
                    onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:outline-none"
                    placeholder="Tell us about what you sell and your business"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center max-w-2xl mx-auto">
            <h2 className={`${orbitron.className} text-2xl text-white mb-4`}>
              Business Verification
            </h2>
            <p className="text-gray-300 mb-8">
              Upload documents to verify your business identity and build trust with customers.
            </p>
            
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-white text-lg mb-2">Required Documents</h3>
                  <p className="text-gray-400 mb-6">
                    Please upload the following documents for verification
                  </p>
                </div>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="text-white">Business Registration</h4>
                      <p className="text-gray-400 text-sm">Certificate or license document</p>
                    </div>
                    <Button handleClick={() => {}} className="bg-gray-700 hover:bg-gray-600 px-4 py-2">
                      Upload
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="text-white">Government ID</h4>
                      <p className="text-gray-400 text-sm">Owner/representative identification</p>
                    </div>
                    <Button handleClick={() => {}} className="bg-gray-700 hover:bg-gray-600 px-4 py-2">
                      Upload
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="text-white">Tax Identification</h4>
                      <p className="text-gray-400 text-sm">Tax registration or EIN document</p>
                    </div>
                    <Button handleClick={() => {}} className="bg-gray-700 hover:bg-gray-600 px-4 py-2">
                      Upload
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400 text-xl mt-1">ℹ️</div>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-1">Why Verify?</h4>
                      <p className="text-blue-300 text-sm">
                        Verification builds customer trust, unlocks advanced features, and helps protect your business.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center max-w-4xl mx-auto">
            <h2 className={`${orbitron.className} text-2xl text-white mb-4`}>
              Choose Your Subscription Plan
            </h2>
            <p className="text-gray-300 mb-12">
              Select the plan that best fits your business needs and growth goals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  name: "Starter",
                  price: "0.5",
                  period: "per month",
                  currency: "USDC",
                  features: ["Up to 10 products", "Basic analytics", "Standard support", "Community access"],
                  popular: false,
                  disabled: false
                },
                {
                  name: "Professional",
                  price: "2.5",
                  period: "per month",
                  currency: "USDC",
                  features: ["Up to 100 products", "Advanced analytics", "Priority support", "API access", "Marketing tools"],
                  popular: true,
                  disabled: false
                },
                {
                  name: "Enterprise",
                  price: "10",
                  period: "per month",
                  currency: "USDC",
                  features: ["Unlimited products", "Custom analytics", "24/7 support", "Dedicated account manager", "White-label options"],
                  popular: false,
                  disabled: true
                }
              ].map((plan, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-900 p-6 rounded-lg border-2 ${
                    plan.popular 
                      ? 'border-primary shadow-lg shadow-primary/20' 
                      : 'border-gray-700 hover:border-gray-600'
                  } relative ${plan.disabled ? 'opacity-50' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-white text-xl font-medium mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl text-white font-bold">${plan.price}</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                    <div className="text-gray-400 text-sm">({plan.currency} tokens)</div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <span className="text-green-400">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-primary hover:opacity-90 text-black' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    } ${plan.disabled ? 'cursor-not-allowed' : ''}`}
                  >
                    {plan.disabled ? 'Coming Soon' : 'Select Plan'}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-white text-lg mb-4 text-center">Ready to Get Started?</h3>
              <p className="text-gray-400 text-center mb-6">
                Complete your merchant profile and start selling to customers worldwide
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  handleClick={handlePrevious}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3"
                >
                  Previous
                </Button>
                <Button 
                  handleClick={handleSubmit}
                  className="bg-primary hover:opacity-90 px-6 py-3 text-black"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <TopNavigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <StepIndicator />
          <StepContent />
          
          {currentStep < totalSteps && (
            <div className="flex justify-between items-center mt-12 max-w-2xl mx-auto">
              <Button
                handleClick={handlePrevious}
                className={`bg-gray-700 hover:bg-gray-600 px-6 py-3 ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </Button>
              
              <div className="text-gray-400">
                Step {currentStep} of {totalSteps}
              </div>
              
              <Button
                handleClick={handleNext}
                className={`bg-primary hover:opacity-90 px-6 py-3 text-black ${currentStep === 1 && !isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </Button>
            </div>
          )}
          
          {currentStep === totalSteps && (
            <div className="text-center mt-8">
              <Link href="/merchant/dashboard" className="text-primary hover:underline">
                Go to Merchant Dashboard →
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MerchantOnboarding;