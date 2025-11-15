// src/pages/LoginPage.tsx
import React, { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // To show login errors
  const [loading, setLoading] = useState(false); // To disable the button

  // This function will run when the form is submitted
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the browser from refreshing
    setLoading(true);
    setError('');

    // TODO: We will add the API call here in the next step
    console.log('Logging in with:', { email, password });
    
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real call:
    // try {
    //   // const response = await apiClient.post('/login', { email, password });
    //   // Handle successful login (save token, redirect)
    // } catch (err) {
    //   setError('Invalid email or password.');
    // }

    setLoading(false);
  };

  return (
    <div>
      <h2>Login to TapToSell</h2>
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
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;