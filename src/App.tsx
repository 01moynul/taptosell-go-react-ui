// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';

// Supplier Pages
import SupplierProductFormPage from './pages/SupplierProductFormPage'; // Marketplace Form (Complex)
import SupplierMyProductsPage from './pages/SupplierMyProductsPage';   // The List View
// [CRITICAL IMPORT] Make sure this matches your file name exactly
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

      {/* SUPPLIER ROUTES */}
      
      {/* 1. The List View (Dashboard) */}
      <Route path="/supplier/products" element={<SupplierMyProductsPage />} />

      {/* 2. Marketplace Operations (Public) */}
      <Route path="/supplier/products/add" element={<SupplierProductFormPage />} />
      <Route path="/supplier/products/edit/:id" element={<SupplierProductFormPage />} />

      {/* 3. Private Inventory Operations (Private) 
         [FIX IS HERE] These routes must point to 'SupplierInventoryFormPage', NOT 'SupplierMyProductsPage'
      */}
      <Route path="/supplier/inventory/add" element={<SupplierInventoryFormPage />} />
      <Route path="/supplier/inventory/edit/:id" element={<SupplierInventoryFormPage />} />

      {/* Default route */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;