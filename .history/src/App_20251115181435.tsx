// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage'; 
// import CatalogPage from './pages/CatalogPage'; // Will be created next

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Protected Routes - These need Auth Middleware */}
      <Route path="/dashboard" element={<DashboardPage />} />
      {/* <Route path="/catalog" element={<CatalogPage />} /> */}

      {/* Default route: Redirect to Login as unauthorized users need to sign in */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;