// src/pages/DashboardPage.tsx

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api'; // Used for fetching trending products

// --- Component Imports (Role Specific) ---
import SupplierMyProductsPage from './SupplierMyProductsPage';
import SupplierWalletPage from './SupplierWalletPage';

import ProductApprovalQueue from '../components/manager/ProductApprovalQueue';
import WithdrawalRequestQueue from '../components/manager/WithdrawalRequestQueue';
import PriceAppealQueue from '../components/manager/PriceAppealQueue';
import GlobalSettingsPage from '../components/manager/GlobalSettingsPage';
import GlobalTaxonomyManager from '../components/manager/GlobalTaxonomyManager';
import UserManagementPage from '../components/manager/UserManagementPage';
import { AIChatWindow } from '../components/shared/AIChatWindow';

import ManagerDashboardStats from '../components/manager/ManagerDashboardStats';

// --- Service Imports ---
import { fetchDropshipperStats, type DropshipperStats } from '../services/dashboardService';
import { fetchMyOrders, type DropshipperOrder } from '../services/orderService';

// --- Helper for URL View Params ---
const useDashboardView = () => {
    return new URLSearchParams(useLocation().search).get('view') || 'products';
};

// --- Types ---
interface TrendingProduct {
    id: number;
    name: string;
    price: number;
    tts_price: number;
    images: string[] | null;
}

// Helper Interface to fix "unknown" user type issues
interface UserWithProfile {
    full_name?: string;
    email: string;
    role: string;
}

/**
 * The main component for all user dashboards.
 * It renders different layouts based on user.role.
 */
function DashboardPage() {
    const { user } = useAuth();
    const currentView = useDashboardView();
    
    // State to toggle the floating AI Chat window
    const [isChatOpen, setIsChatOpen] = useState(false);

    // --- Dropshipper State ---
    const [dsStats, setDsStats] = useState<DropshipperStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<DropshipperOrder[]>([]);
    const [trending, setTrending] = useState<TrendingProduct[]>([]);
    const [dsLoading, setDsLoading] = useState(false);

    // --- Data Fetching for Dropshippers ---
    useEffect(() => {
        if (user?.role === 'dropshipper') {
            const loadData = async () => {
                setDsLoading(true);
                try {
                    // Fetch Stats, Orders, AND Trending Products in parallel
                    const [statsRes, ordersRes, productsRes] = await Promise.all([
                        fetchDropshipperStats(),
                        fetchMyOrders(),
                        apiClient.get<{ products: TrendingProduct[] }>('/products/search')
                    ]);

                    setDsStats(statsRes);
                    setRecentOrders(ordersRes.slice(0, 5)); // Top 5 Orders
                    
                    // Top 5 Trending Products
                    if (productsRes.data && productsRes.data.products) {
                        setTrending(productsRes.data.products.slice(0, 5));
                    }
                } catch (error) {
                    console.error("Failed to load dropshipper dashboard", error);
                } finally {
                    setDsLoading(false);
                }
            };
            loadData();
        }
    }, [user]);


    // 1. Loading/Auth Check
    if (!user) {
        return <div className="p-8 text-center">Loading User Data...</div>; 
    }

    const safeUser = user as unknown as UserWithProfile;

    // --- HELPER: Render the Floating Chat Widget ---
    const renderChatWidget = () => (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {isChatOpen && (
                <div className="mb-2 w-[350px] shadow-2xl animate-fade-in-up">
                    <AIChatWindow />
                </div>
            )}
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="bg-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all font-bold flex items-center gap-2"
            >
                {isChatOpen ? <>❌ Close Assistant</> : <>🤖 AI Assistant</>}
            </button>
        </div>
    );

    // 2. Supplier Dashboard Content
    const renderSupplierContent = () => {
        const navItems = [
            { id: 'products', label: 'Products & Inventory', Component: SupplierMyProductsPage },
            { id: 'wallet', label: 'My Wallet', Component: SupplierWalletPage },
        ];

        const activeItem = navItems.find(item => item.id === currentView) || navItems[0];
        const ActiveComponent = activeItem.Component;

        return (
            <div className="supplier-dashboard">
                <nav className="flex gap-4 border-b mb-6 pb-2">
                    {navItems.map((item) => (
                        <Link 
                            key={item.id} 
                            to={`?view=${item.id}`} 
                            className={`px-4 py-2 rounded-t-lg font-medium ${
                                item.id === currentView 
                                ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="dashboard-content">
                    <ActiveComponent />
                </div>
            </div>
        );
    };

    // 3. Manager Dashboard Content
    const renderManagerContent = () => {
        const navItems = [
            { id: 'products', label: 'Product Approval', Component: ProductApprovalQueue },
            { id: 'withdrawals', label: 'Withdrawals', Component: WithdrawalRequestQueue },
            { id: 'appeals', label: 'Price Appeals', Component: PriceAppealQueue },
            { id: 'users', label: 'User Directory', Component: UserManagementPage },
            { id: 'taxonomy', label: 'Taxonomy', Component: GlobalTaxonomyManager },
            { id: 'settings', label: 'Settings', Component: GlobalSettingsPage },
        ];

        const activeItem = navItems.find(item => item.id === currentView) || navItems[0];
        const ActiveComponent = activeItem.Component;

        return (
            <div className="manager-dashboard">
                <ManagerDashboardStats />
                <nav className="flex flex-wrap gap-2 border-b mb-6 pb-2">
                    {navItems.map((item) => (
                        <Link 
                            key={item.id} 
                            to={`?view=${item.id}`} 
                            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                                item.id === currentView 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="dashboard-content">
                    <ActiveComponent />
                </div>
            </div>
        );
    };

    // --- MAIN RENDER LOGIC ---

    // A. Supplier View
    if (user.role === 'supplier') {
        return (
            <div className="p-6 max-w-7xl mx-auto relative">
                <h1 className="text-2xl font-bold mb-6">Supplier Dashboard</h1>
                {renderSupplierContent()}
                {renderChatWidget()}
            </div>
        );
    } 
    
    // B. Manager/Admin View
    if (user.role === 'manager' || user.role === 'administrator') {
        return (
            <div className="p-6 max-w-7xl mx-auto relative">
                <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
                {renderManagerContent()}
                {renderChatWidget()}
            </div>
        );
    }

    // C. Dropshipper View (The "Buyer's Cockpit")
    if (user.role === 'dropshipper') {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Welcome back, {safeUser.full_name || safeUser.email}
                    </h1>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Dropshipper
                    </span>
                </div>

                {dsLoading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                        <div className="h-64 bg-gray-200 rounded-lg"></div>
                    </div>
                ) : (
                    <>
                        {/* 1. KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet Balance</h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        RM {dsStats?.walletBalance.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <Link to="/dropshipper/wallet" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    + Top Up Wallet
                                </Link>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Processing Orders</h3>
                                <p className="mt-2 text-3xl font-bold text-green-600">
                                    {dsStats?.processingOrders || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Items currently being packed</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Action Required</h3>
                                <p className="mt-2 text-3xl font-bold text-red-600">
                                    {dsStats?.actionRequired || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Unpaid (On-Hold) Orders</p>
                            </div>
                        </div>

                        {/* 2. Recent Orders Widget */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                                <Link to="/dropshipper/orders" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    View All Orders &rarr;
                                </Link>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                        <tr>
                                            <th className="px-6 py-3">Order ID</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Total</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                    No orders yet. <Link to="/catalog" className="text-indigo-600 underline">Start shopping!</Link>
                                                </td>
                                            </tr>
                                        ) : (
                                            recentOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {new Date(order.order_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        RM {order.total_amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                                                            ${order.status === 'on-hold' ? 'bg-red-100 text-red-800' : 
                                                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                                              'bg-green-100 text-green-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {order.status === 'on-hold' ? (
                                                            <Link 
                                                                to={`/dropshipper/orders`} 
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                                            >
                                                                Pay Now
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">View Only</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Trending Products Carousel */}
                        <div className="mt-8">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Trending Now</h2>
                            {trending.length === 0 ? (
                                <p className="text-gray-500 text-sm">No products available yet.</p>
                            ) : (
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {trending.map((product) => (
                                        <Link 
                                            to={`/catalog`} 
                                            key={product.id} 
                                            className="min-w-[200px] w-[200px] bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex-shrink-0"
                                        >
                                            <div className="h-32 bg-gray-100 rounded-md mb-3 overflow-hidden flex items-center justify-center">
                                                {/* Simple image check: if array exists, show first one */}
                                                {product.images && product.images.length > 0 ? (
                                                     <img 
                                                        src={product.images[0]} 
                                                        alt={product.name} 
                                                        className="h-full w-full object-cover" 
                                                     />
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No Image</span>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-gray-900 truncate" title={product.name}>
                                                {product.name}
                                            </h3>
                                            <p className="text-indigo-600 font-bold mt-1">
                                                RM {product.tts_price.toFixed(2)}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
                {renderChatWidget()}
            </div>
        );
    }

    return (
        <div className="p-8 text-center">
            <h1 className="text-xl text-gray-500">Unknown User Role</h1>
            {renderChatWidget()}
        </div>
    );
}

export default DashboardPage;