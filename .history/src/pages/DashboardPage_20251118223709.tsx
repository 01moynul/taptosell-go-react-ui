// src/pages/DashboardPage.tsx

import { useState } from 'react'; // Added useState for Chat toggle
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 
import MyInventoryPage from '../components/supplier/MyInventoryPage'; 
import SupplierMyProductsPage from './SupplierMyProductsPage'; 
import SupplierWalletPage from './SupplierWalletPage'; 
import ProductApprovalQueue from '../components/manager/ProductApprovalQueue';
import WithdrawalRequestQueue from '../components/manager/WithdrawalRequestQueue';
import PriceAppealQueue from '../components/manager/PriceAppealQueue';
import GlobalSettingsPage from '../components/manager/GlobalSettingsPage';
import GlobalTaxonomyManager from '../components/manager/GlobalTaxonomyManager';
import UserManagementPage from '../components/manager/UserManagementPage';
import { AIChatWindow } from '../components/shared/AIChatWindow'; // Phase 6.7: Import Chat Component

/**
 * Helper to get the current 'view' parameter from the URL.
 * e.g., /dashboard?view=inventory -> returns 'inventory'
 */
const useDashboardView = () => {
    return new URLSearchParams(useLocation().search).get('view') || 'products';
};

/**
 * The main component for all user dashboards, routing based on role and view parameter.
 */
function DashboardPage() {
    const { user } = useAuth();
    const currentView = useDashboardView();
    
    // State to toggle the floating AI Chat window
    const [isChatOpen, setIsChatOpen] = useState(false);

    // 1. Loading/Auth Check
    if (!user) {
        return <div className="taptosell-container">Loading User Data...</div>; 
    }

    // --- HELPER: Render the Floating Chat Widget ---
    const renderChatWidget = () => (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* The Chat Window (Conditional Render) */}
            {isChatOpen && (
                <div className="mb-2 w-[350px] shadow-2xl animate-fade-in-up">
                    <AIChatWindow />
                </div>
            )}
            
            {/* The Toggle Button */}
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="bg-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all font-bold flex items-center gap-2"
            >
                {isChatOpen ? (
                    <>❌ Close Assistant</>
                ) : (
                    <>🤖 AI Assistant</>
                )}
            </button>
        </div>
    );

    // 2. Role-Based Navigation & Content
    const renderSupplierContent = () => {
        // Defines the supplier's main navigation menu
        const navItems = [
            { id: 'products', label: 'Marketplace Products', Component: SupplierMyProductsPage },
            { id: 'inventory', label: 'My Private Inventory', Component: MyInventoryPage }, 
            { id: 'wallet', label: 'My Wallet', Component: SupplierWalletPage },
        ];

        const activeItem = navItems.find(item => item.id === currentView) || navItems[0];
        const ActiveComponent = activeItem.Component;

        return (
            <div className="supplier-dashboard">
                <nav className="dashboard-nav">
                    {navItems.map((item) => (
                        <Link 
                            key={item.id} 
                            to={`?view=${item.id}`} 
                            className={`nav-link ${item.id === currentView ? 'active' : ''}`}
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

    // Defines the content for the Operational Admin/Manager role
    const renderManagerContent = () => {
        // Defines the Manager's main navigation menu
        const navItems = [
            { id: 'products', label: 'Product Approval Queue', Component: ProductApprovalQueue },
            { id: 'withdrawals', label: 'Withdrawal Request Queue', Component: WithdrawalRequestQueue },
            { id: 'appeals', label: 'Price Appeal Queue', Component: PriceAppealQueue },
            { id: 'users', label: 'User Directory', Component: UserManagementPage },
            { id: 'taxonomy', label: 'Categories & Brands', Component: GlobalTaxonomyManager },
            { id: 'settings', label: 'Global Settings', Component: GlobalSettingsPage },
        ];

        const activeItem = navItems.find(item => item.id === currentView) || navItems[0];
        const ActiveComponent = activeItem.Component;

        return (
            <div className="manager-dashboard">
                <nav className="dashboard-nav">
                    {navItems.map((item) => (
                        <Link 
                            key={item.id} 
                            to={`?view=${item.id}`} 
                            className={`nav-link ${item.id === currentView ? 'active' : ''}`}
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

    // Display appropriate dashboard based on user role
    if (user.role === 'supplier') {
        return (
            <div className="taptosell-container relative">
                <h1>Supplier Dashboard</h1>
                {renderSupplierContent()}
                {renderChatWidget()}
            </div>
        );
    } 
    
    // Manager/Operational Admin & Super Admin Dashboard
    if (user.role === 'manager' || user.role === 'administrator') {
        return (
            <div className="taptosell-container relative">
                <h1>Manager Dashboard</h1>
                {renderManagerContent()}
                {renderChatWidget()}
            </div>
        );
    }

    // Placeholder for dropshipper dashboard
    if (user.role === 'dropshipper') {
        return (
            <div className="taptosell-container relative">
                <h1>Dropshipper Dashboard</h1>
                <p>Welcome, Dropshipper! Your views are coming soon.</p>
                {renderChatWidget()}
            </div>
        );
    }

    // Default fallback
    return (
        <div className="taptosell-container relative">
            <h1>User Dashboard</h1>
            <p>Welcome, {user.role}. Your dashboard is under construction.</p>
            {renderChatWidget()}
        </div>
    );
}

export default DashboardPage;