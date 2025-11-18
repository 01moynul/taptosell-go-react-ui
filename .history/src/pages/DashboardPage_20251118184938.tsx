// src/pages/DashboardPage.tsx

import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Assuming this hook exists
import MyInventoryPage from '../components/supplier/MyInventoryPage'; // NEW IMPORT
import SupplierMyProductsPage from './SupplierMyProductsPage'; // Existing component
import SupplierWalletPage from './SupplierWalletPage'; // Placeholder for existing 
import ProductApprovalQueue from '../components/manager/ProductApprovalQueue';
import WithdrawalRequestQueue from '../components/manager/WithdrawalRequestQueue';
import PriceAppealQueue from '../components/manager/PriceAppealQueue';
import GlobalSettingsPage from '../components/manager/GlobalSettingsPage';

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

    // 1. Loading/Auth Check
    if (!user) {
        // You can customize this to a full-page loading spinner or redirect to login
        return <div className="taptosell-container">Loading User Data...</div>; 
    }

    // 2. Role-Based Navigation & Content
    const renderSupplierContent = () => {
        // Defines the supplier's main navigation menu
        const navItems = [
            { id: 'products', label: 'Marketplace Products', Component: SupplierMyProductsPage },
            { id: 'inventory', label: 'My Private Inventory', Component: MyInventoryPage }, // NEW INVENTORY ITEM
            { id: 'wallet', label: 'My Wallet', Component: SupplierWalletPage },
            // Add other supplier views here (e.g., 'orders', 'settings')
        ];

        // Find the component to render based on the URL parameter
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
            // Add other manager views here (e.g., 'users', 'withdrawals', 'settings')
        ];

        // Find the component to render based on the URL parameter
        // Default to 'products' if no view or invalid view is found
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
            <div className="taptosell-container">
                <h1>Supplier Dashboard</h1>
                {renderSupplierContent()}
            </div>
        );
    } 
    
    // Manager/Operational Admin & Super Admin Dashboard
    if (user.role === 'manager' || user.role === 'administrator') {
        return (
            <div className="taptosell-container">
                <h1>Manager Dashboard</h1>
                {renderManagerContent()}
            </div>
        );
    }

    // Placeholder for dropshipper dashboard
    if (user.role === 'dropshipper') {
        return (
            <div className="taptosell-container">
                <h1>Dropshipper Dashboard</h1>
                <p>Welcome, Dropshipper! Your views are coming soon.</p>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="taptosell-container">
            <h1>User Dashboard</h1>
            <p>Welcome, {user.role}. Your dashboard is under construction.</p>
        </div>
    );
}

export default DashboardPage;