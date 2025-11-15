// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

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

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the "Provider" component
// This will wrap our entire app and manage the auth state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    // TODO: In a real app, we would also save the token to localStorage
    // to keep the user logged in after a refresh.
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // TODO: We would also remove the token from localStorage here.
  };

  const value = {
    token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook for easy access
// This lets any component call `useAuth()` to get the auth state
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}