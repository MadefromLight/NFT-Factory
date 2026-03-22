"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import TopNavigation from "@/common/navs/top/TopNavigation";
import Footer from "@/components/Footer";
import { orbitron } from "@/fonts/fonts";
import Button from "@/common/Button";
import Link from "next/link";

const MerchantDashboard = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalSales: "12.4K",
      totalRevenue: "8.7K",
      conversionRate: "3.2%",
      avgOrderValue: "245",
      totalProducts: 24,
      activeListings: 18,
      pendingOrders: 5,
      completedOrders: 47
    },
    analytics: {
      salesData: [1200, 1900, 1500, 2800, 2100, 3200, 2900],
      productPerformance: [
        { name: "Digital Art #1", sales: 45, revenue: "1.2K" },
        { name: "NFT Collection", sales: 32, revenue: "890" },
        { name: "Virtual Experience", sales: 28, revenue: "650" }
      ]
    },
    inventory: [
      { id: 1, name: "Digital Art Collection", stock: 15, price: "45", status: "active" },
      { id: 2, name: "Virtual Workshop", stock: 8, price: "120", status: "active" },
      { id: 3, name: "Premium NFT", stock: 0, price: "250", status: "out-of-stock" }
    ],
    orders: [
      { id: 1, customer: "0x1234...5678", product: "Digital Art #1", amount: "45", status: "pending", date: "2024-01-15" },
      { id: 2, customer: "0x9876...5432", product: "Virtual Workshop", amount: "120", status: "completed", date: "2024-01-14" },
      { id: 3, customer: "0x5555...7777", product: "Premium NFT", amount: "250", status: "shipped", date: "2024-01-13" }
    ],
    redemptions: [
      { id: 1, product: "Digital Art #1", customer: "0x1234...5678", status: "pending", date: "2024-01-15" },
      { id: 2, product: "Virtual Workshop", customer: "0x9876...5432", status: "completed", date: "2024-01-10" }
    ]
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, change, icon }: { title: string; value: string; change?: string; icon: string }) => (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-primary transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales" 
          value={dashboardData.overview.totalSales} 
          change="+12.5%" 
          icon="💰" 
        />
        <StatCard 
          title="Revenue" 
          value={`$${dashboardData.overview.totalRevenue}`} 
          change="+8.2%" 
          icon="📈" 
        />
        <StatCard 
          title="Conversion Rate" 
          value={dashboardData.overview.conversionRate} 
          change="+2.1%" 
          icon="📊" 
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${dashboardData.overview.avgOrderValue}`} 
          change="+5.7%" 
          icon="💳" 
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-4">Inventory Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Products</span>
              <span className="text-white font-medium">{dashboardData.overview.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Listings</span>
              <span className="text-green-400 font-medium">{dashboardData.overview.activeListings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Out of Stock</span>
              <span className="text-red-400 font-medium">{dashboardData.overview.totalProducts - dashboardData.overview.activeListings}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-4">Order Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Pending Orders</span>
              <span className="text-yellow-400 font-medium">{dashboardData.overview.pendingOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400 font-medium">{dashboardData.overview.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Orders</span>
              <span className="text-white font-medium">{dashboardData.overview.pendingOrders + dashboardData.overview.completedOrders}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-4">Trust Score</h3>
          <div className="text-center">
            <div className="text-4xl mb-2">⭐⭐⭐⭐</div>
            <div className="text-2xl text-yellow-400 font-bold mb-2">4.2/5</div>
            <div className="text-gray-400 text-sm">Verified Merchant</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-lg">Recent Activity</h3>
          <Button 
            handleClick={() => {}} 
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm"
          >
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {[
            { action: "New order received", product: "Digital Art #1", amount: "$45", time: "2 hours ago" },
            { action: "Product sold", product: "Virtual Workshop", amount: "$120", time: "5 hours ago" },
            { action: "Customer review", product: "Premium NFT", rating: "5 stars", time: "1 day ago" }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="bg-primary rounded-full w-2 h-2"></div>
                <div>
                  <p className="text-white">{activity.action}</p>
                  <p className="text-gray-400 text-sm">{activity.product}</p>
                </div>
              </div>
              <div className="text-right">
                {activity.amount && <p className="text-white font-medium">{activity.amount}</p>}
                {activity.rating && <p className="text-yellow-400">{activity.rating}</p>}
                <p className="text-gray-400 text-sm">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-xl">Product Inventory</h2>
        <Button 
          handleClick={() => {}} 
          className="bg-primary hover:opacity-90 px-4 py-2 text-black"
        >
          Add New Product
        </Button>
      </div>
      
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-white">Product</th>
                <th className="text-left p-4 text-white">Price</th>
                <th className="text-left p-4 text-white">Stock</th>
                <th className="text-left p-4 text-white">Status</th>
                <th className="text-left p-4 text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.inventory.map((item) => (
                <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-4 text-white">{item.name}</td>
                  <td className="p-4 text-white">${item.price}</td>
                  <td className={`p-4 ${item.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.stock > 0 ? item.stock : 'Out of Stock'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'active' 
                        ? 'bg-green-900 text-green-400' 
                        : 'bg-red-900 text-red-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button 
                        handleClick={() => {}} 
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 text-sm"
                      >
                        Edit
                      </Button>
                      <Button 
                        handleClick={() => {}} 
                        className="bg-red-700 hover:bg-red-600 px-3 py-1 text-sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-white text-xl">Order Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "All Orders", count: 52, active: true },
          { label: "Pending", count: 5, active: false },
          { label: "Processing", count: 3, active: false },
          { label: "Completed", count: 44, active: false }
        ].map((status, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              status.active 
                ? 'bg-primary border-primary text-black' 
                : 'bg-gray-900 border-gray-700 text-white hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold">{status.count}</div>
            <div className="text-sm">{status.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-white">Order ID</th>
                <th className="text-left p-4 text-white">Customer</th>
                <th className="text-left p-4 text-white">Product</th>
                <th className="text-left p-4 text-white">Amount</th>
                <th className="text-left p-4 text-white">Status</th>
                <th className="text-left p-4 text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-4 text-white">#{order.id}</td>
                  <td className="p-4 text-white">{order.customer}</td>
                  <td className="p-4 text-white">{order.product}</td>
                  <td className="p-4 text-white">${order.amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' 
                        ? 'bg-green-900 text-green-400' 
                        : order.status === 'pending'
                        ? 'bg-yellow-900 text-yellow-400'
                        : 'bg-blue-900 text-blue-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRedemptions = () => (
    <div className="space-y-6">
      <h2 className="text-white text-xl">Redemption Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-2">Pending Redemptions</h3>
          <p className="text-3xl text-yellow-400 font-bold">
            {dashboardData.redemptions.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-2">Completed</h3>
          <p className="text-3xl text-green-400 font-bold">
            {dashboardData.redemptions.filter(r => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-white text-lg mb-2">Total Requests</h3>
          <p className="text-3xl text-white font-bold">
            {dashboardData.redemptions.length}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-white">ID</th>
                <th className="text-left p-4 text-white">Product</th>
                <th className="text-left p-4 text-white">Customer</th>
                <th className="text-left p-4 text-white">Status</th>
                <th className="text-left p-4 text-white">Date</th>
                <th className="text-left p-4 text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.redemptions.map((redemption) => (
                <tr key={redemption.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-4 text-white">#{redemption.id}</td>
                  <td className="p-4 text-white">{redemption.product}</td>
                  <td className="p-4 text-white">{redemption.customer}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      redemption.status === 'completed' 
                        ? 'bg-green-900 text-green-400' 
                        : 'bg-yellow-900 text-yellow-400'
                    }`}>
                      {redemption.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{redemption.date}</td>
                  <td className="p-4">
                    <Button 
                      handleClick={() => {}} 
                      className="bg-primary hover:opacity-90 px-3 py-1 text-sm text-black"
                    >
                      {redemption.status === 'pending' ? 'Process' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <TopNavigation />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading merchant dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <TopNavigation />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-3xl text-white mb-4">Merchant Dashboard</h1>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to access your merchant dashboard
            </p>
            <Button 
              handleClick={() => connect({ connector: coinbaseWallet({ appName: 'NFT Factory', darkMode: true }) })} 
              className="bg-primary hover:opacity-90 px-8 py-3 text-black"
            >
              Connect Wallet
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <TopNavigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`${orbitron.className} text-3xl text-white mb-2`}>Merchant Dashboard</h1>
              <p className="text-gray-400">Manage your business and track performance</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Connected Wallet</p>
              <p className="text-primary font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "inventory", label: "Inventory", icon: "📦" },
              { id: "orders", label: "Orders", icon: "🛒" },
              { id: "redemptions", label: "Redemptions", icon: "🎁" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-black'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-900 bg-opacity-50 rounded-xl border border-gray-700 p-6">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "inventory" && renderInventory()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "redemptions" && renderRedemptions()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MerchantDashboard;