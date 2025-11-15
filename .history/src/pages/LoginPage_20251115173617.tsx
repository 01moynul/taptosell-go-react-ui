// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Note: Link needs to be imported
import apiClient from '../services/api'; // Our API client
import { useAuth } from '../hooks/useAuth'; // Our global auth hook
import axios from 'axios';

// Define the expected structure of the successful API response
interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    role: string;
    // Note: The Go API Blueprint says the user object returns role and ID.
  };
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get the login function from our global context
  const auth = useAuth();
  // Hook for navigation after successful login
  const navigate = useNavigate();

  // This function will run when the form is submitted
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the browser from refreshing
    setLoading(true);
    setError('');

    try {
      // API Blueprint: POST /v1/login
      const response = await apiClient.post<LoginResponse>('/login', { 
        email, 
        password 
      });

      // Check if the response contains the token and user data
      if (response.data.token && response.data.user) {
        // 1. Save the token and user data globally using our context
        auth.login(response.data.token, response.data.user);

        // 2. Redirect the user based on their role (simplified logic for now)
        // Dropshippers go to the Catalog, others go to the Dashboard
        if (response.data.user.role === 'dropshipper') {
          navigate('/catalog');
        } else {
          navigate('/dashboard'); 
        }

      } else {
        setError('Login successful, but required data was missing.');
      }

    } catch (err) {
      // Handle 401 Unauthorized, suspended users, unverified users, etc.
      if (axios.isAxiosError(err) && err.response) {
        // Assume the Go API returns the error message in the response data
        const errorMessage = err.response.data.message || 'Login failed. Check credentials.';
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred during the network request.');
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Login to TapToSell</h2>
      
      {/* Link to Registration Page */}
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {/* Show an error message if one exists */}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;