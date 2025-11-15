// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';
import axios from 'axios';

// Define the structure of the data we send to the API
interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  registrationKey?: string; // Optional for suppliers
}

// Define the API response structure
interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

function RegisterPage() {
  const [userType, setUserType] = useState<'dropshipper' | 'supplier'>('dropshipper');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Determine the API endpoint based on user type
    const endpoint = `/register/${userType}`;
    
    // Build the request payload
    const payload: RegisterPayload = {
      fullName, 
      email, 
      phoneNumber, 
      password 
    };
    
    // Add registrationKey only for suppliers
    if (userType === 'supplier') {
      payload.registrationKey = registrationKey;
    }

    try {
      // API Blueprint: POST /v1/register/dropshipper or /v1/register/supplier
      const response = await apiClient.post<RegisterResponse>(endpoint, payload);
      
      setMessage(response.data.message || 'Registration successful! Please verify your email.');
      
      // On success, redirect to the verification page
      navigate(`/verify-email?email=${email}`, { replace: true });

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 'Registration failed. Please check your data.';
        setError(errorMessage);
      } else {
        setError('An unexpected network error occurred.');
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Register as a {userType === 'dropshipper' ? 'Dropshipper' : 'Supplier'}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="radio"
            name="userType"
            checked={userType === 'dropshipper'}
            onChange={() => setUserType('dropshipper')}
          /> Dropshipper (Reseller)
        </label>
        <label style={{ marginLeft: '15px' }}>
          <input
            type="radio"
            name="userType"
            checked={userType === 'supplier'}
            onChange={() => setUserType('supplier')}
          /> Supplier (Requires Key)
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
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
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
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

        {/* Supplier-Specific Field */}
        {userType === 'supplier' && (
          <div>
            <label htmlFor="registrationKey">Registration Key:</label>
            <input
              type="text"
              id="registrationKey"
              value={registrationKey}
              onChange={(e) => setRegistrationKey(e.target.value)}
              required
            />
          </div>
        )}
        
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}

        <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
          {loading ? 'Processing...' : `Register as ${userType}`}
        </button>
      </form>
      
      <p style={{ marginTop: '20px' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default RegisterPage;