// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';

// --- Dropshipper Imports ---
import CartPage from './pages/CartPage'; // NEW IMPORT
import CheckoutPage from './pages/CheckoutPage';
import DropshipperWalletPage from './pages/DropshipperWalletPage';
import DropshipperOrdersPage from './pages/DropshipperOrdersPage';

// --- Supplier Imports ---
import SupplierProductFormPage from './pages/SupplierProductFormPage'; 
import SupplierMyProductsPage from './pages/SupplierMyProductsPage';   
import SupplierInventoryFormPage from './pages/SupplierInventoryFormPage'; 

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/catalog" element={<CatalogPage />}  />

      {/* --- DROPSHIPPER ROUTES --- */}
      <Route path="/cart" element={<CartPage />} /> {/* REGISTERED ROUTE */}
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/dropshipper/wallet" element={<DropshipperWalletPage />} />
      
      {/* Both routes point to the Orders list for now to prevent 404s */}
      <Route path="/dropshipper/orders" element={<DropshipperOrdersPage />} />
      <Route path="/dropshipper/orders/:id" element={<DropshipperOrdersPage />} />
      {/* ------------------------------- */}

      {/* SUPPLIER ROUTES */}
      <Route path="/supplier/products" element={<SupplierMyProductsPage />} />
      <Route path="/supplier/products/add" element={<SupplierProductFormPage />} />
      <Route path="/supplier/products/edit/:id" element={<SupplierProductFormPage />} />
      <Route path="/supplier/inventory/add" element={<SupplierInventoryFormPage />} />
      <Route path="/supplier/inventory/edit/:id" element={<SupplierInventoryFormPage />} />

      {/* Default route */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;