import Link from "next/link";
import { usePathname } from "next/navigation";
import { orbitron } from "@/fonts/fonts";

const MerchantNavigation = () => {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", path: "/merchant/dashboard", icon: "📊" },
    { name: "Products", path: "/merchant/products", icon: "🛍️" },
    { name: "Orders", path: "/merchant/orders", icon: "📦" },
    { name: "Analytics", path: "/merchant/analytics", icon: "📈" },
    { name: "Settings", path: "/merchant/settings", icon: "⚙️" }
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/merchant/dashboard" className="flex items-center gap-2">
              <div className="text-2xl">🏪</div>
              <span className={`${orbitron.className} text-white text-xl font-bold`}>
                Merchant Portal
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-primary text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
          
          <div className="md:hidden">
            <button className="text-gray-400 hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MerchantNavigation;