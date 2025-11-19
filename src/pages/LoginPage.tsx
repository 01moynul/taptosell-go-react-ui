// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api'; 
import { useAuth } from '../hooks/useAuth'; 
import axios from 'axios';

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    role: string;
  };
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST /v1/login
      const response = await apiClient.post<LoginResponse>('/login', { 
        email, 
        password 
      });

      if (response.data.token && response.data.user) {
        // 1. Save global auth state
        auth.login(response.data.token, response.data.user);

        // 2. Role-Based Redirection Logic
        const role = response.data.user.role;

        if (role === 'dropshipper') {
          // Dropshippers go to their main dashboard (Wallet/Orders)
          navigate('/dashboard');
        } else if (role === 'supplier') {
          // Suppliers go to their Product Management view
          navigate('/dashboard?view=products');
        } else if (role === 'manager' || role === 'administrator') {
          // Managers go to the Approval Queue
          navigate('/dashboard?view=products');
        } else {
          // Fallback
          navigate('/dashboard'); 
        }

      } else {
        setError('Login successful, but required data was missing.');
      }

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // FIX: The Go Backend sends {"error": "..."} usually, but sometimes {"message": "..."}
        // We check both properties to be safe.
        const errorMessage = err.response.data.error || err.response.data.message || 'Login failed. Check credentials.';
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred during the network request.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to TapToSell</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-500">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;