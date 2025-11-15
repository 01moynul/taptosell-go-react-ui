// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// 1. Import the new page
import VerifyEmailPage from './pages/VerifyEmailPage';

// We will create these page components in the next steps
// import CatalogPage from './pages/CatalogPage'
// import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* 2. Add the new route */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* We will add our routes here, for example:
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/dashboard" element={<DashboardPage />} /> 
      */}

      {/* For now, just a placeholder route */}
      <Route path="/" element={<div>Home Page - Placeholder</div>} />
    </Routes>
  );
}

export default App;