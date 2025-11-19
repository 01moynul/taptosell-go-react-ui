// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';

// 1. IMPORT THE NEW PAGE
import SupplierProductFormPage from './pages/SupplierProductFormPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/catalog" element={<CatalogPage />}  />

      {/* 2. ADD THE ROUTE HERE */}
      <Route path="/supplier/add-product" element={<SupplierProductFormPage />} />

      {/* Default route */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;