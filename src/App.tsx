// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';

// Supplier Pages
import SupplierProductFormPage from './pages/SupplierProductFormPage';

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
      {/* Matches the <Link> in SupplierMyProductsPage */}
      <Route path="/supplier/products/add" element={<SupplierProductFormPage />} />
      
      {/* [NEW] Edit Route - Matches the "Edit" button */}
      <Route path="/supplier/products/edit/:id" element={<SupplierProductFormPage />} />

      {/* Default route */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;