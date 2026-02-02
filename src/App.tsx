// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Required for notifications

// --- Core Pages ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';

// --- Dropshipper Imports ---
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import DropshipperWalletPage from './pages/DropshipperWalletPage';
import DropshipperOrdersPage from './pages/DropshipperOrdersPage';

// --- Supplier Imports ---
import SupplierProductFormPage from './pages/SupplierProductFormPage'; 
import SupplierMyProductsPage from './pages/SupplierMyProductsPage';   
import SupplierInventoryFormPage from './pages/SupplierInventoryFormPage'; 
import SupplierWalletPage from './pages/SupplierWalletPage'; //

function App() {
  return (    
    <>
      {/* 1. Global Toast Notifications Container */}
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* --- Shared Protected Routes --- */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalog" element={<CatalogPage />}  />

        {/* --- DROPSHIPPER ROUTES --- */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/dropshipper/wallet" element={<DropshipperWalletPage />} />
        <Route path="/dropshipper/orders" element={<DropshipperOrdersPage />} />
        <Route path="/dropshipper/orders/:id" element={<DropshipperOrdersPage />} />

        {/* --- SUPPLIER ROUTES --- */}
        <Route path="/supplier/products" element={<SupplierMyProductsPage />} />
        <Route path="/supplier/products/add" element={<SupplierProductFormPage />} />
        <Route path="/supplier/products/edit/:id" element={<SupplierProductFormPage />} />
        <Route path="/supplier/inventory/add" element={<SupplierInventoryFormPage />} />
        <Route path="/supplier/inventory/edit/:id" element={<SupplierInventoryFormPage />} />
        [cite_start]{/* Added route for the Wallet Page [cite: 1412] */}
        <Route path="/supplier/wallet" element={<SupplierWalletPage />} />

        {/* --- Redirects & Defaults --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div className="p-10 text-center">404: Page Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;