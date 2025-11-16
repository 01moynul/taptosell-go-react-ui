// src/context/AuthContext.tsx

// We only need the functions we use (createContext, useState)
import { createContext, useState } from 'react';
import { type ReactNode } from 'react';

// Define the shape of our user object
interface AuthUser {
  id: number;
  role: string;
}

// Define the shape of our context
interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

// Define the "Provider" component
export function AuthProvider({ children }: { children: ReactNode }) {
  // --- MODIFIED CODE START ---

  // Initialize state by checking localStorage for the token
  const initialToken = localStorage.getItem('tts_user_token');
  const initialUserJson = localStorage.getItem('tts_user_data');

  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(
    initialUserJson ? JSON.parse(initialUserJson) : null
  );

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    // Save token and user data to localStorage
    localStorage.setItem('tts_user_token', newToken);
    localStorage.setItem('tts_user_data', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Remove token and user data from localStorage
    localStorage.removeItem('tts_user_token');
    localStorage.removeItem('tts_user_data');
  };

  // --- MODIFIED CODE END ---

  const value = {
    token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// 2. We have REMOVED the useAuth hook from this file.
// We will move it to its own file to fix the Fast Refresh error.