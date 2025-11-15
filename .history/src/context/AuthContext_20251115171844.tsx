// src/context/AuthContext.tsx
import React, { createContext, useState } from 'react'; 
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

// 1. Export the Context so our hook can use it
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the "Provider" component
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

// 2. We have REMOVED the useAuth hook from this file.
// We will move it to its own file to fix the Fast Refresh error.