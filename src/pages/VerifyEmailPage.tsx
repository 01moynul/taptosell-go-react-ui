// src/pages/VerifyEmailPage.tsx
import React, { useState } from 'react';
// We use useLocation to safely read the email query parameter from the URL
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../services/api'; // Our configured API client
import axios from 'axios';

function VerifyEmailPage() {
  // 1. Use useLocation to get the URL's query string
  const location = useLocation();

  // 2. Extract the 'email' parameter from the query string once upon component load
  const initialEmail = new URLSearchParams(location.search).get('email') || '';

  const [email] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Handler for verifying the code
  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // API Blueprint: POST /v1/auth/verify-email
      await apiClient.post('/auth/verify-email', { email, code });

      setMessage('Email verified successfully! Your account is now pending approval.');
      
      // Verification successful, redirect to Login after a short delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 'Verification failed. Invalid code or email.';
        setError(errorMessage);
      } else {
        setError('An unexpected network error occurred.');
      }
    }

    setLoading(false);
  };

  // Handler for resending the code
  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // API Blueprint: POST /v1/auth/resend-code
      await apiClient.post('/auth/resend-code', { email });

      setMessage('A new verification code has been sent.');

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 'Failed to resend code.';
        setError(errorMessage);
      } else {
        setError('An unexpected network error occurred.');
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Verify Your Email</h2>
      <p>Please enter the 6-digit code sent to: <strong>{email}</strong></p>
      
      <form onSubmit={handleVerify}>
        <div>
          <label htmlFor="code">Verification Code:</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
        </div>
        
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

        <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px' }}>
        Didn't receive the code? 
        <button onClick={handleResend} disabled={loading} style={{ border: 'none', background: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px' }}>
            {loading ? 'Sending...' : 'Resend Code'}
        </button>
      </p>

      <p>
        <Link to="/login">Go to Login Page</Link>
      </p>
    </div>
  );
}

export default VerifyEmailPage;