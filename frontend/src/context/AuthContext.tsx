'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: string | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token: newToken } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', username);
      setToken(newToken);
      setUser(username);
      toast.success('התחברת בהצלחה!');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'שגיאה בהתחברות';
      toast.error(msg);
      throw error;
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/signup', { username, password });
      const { token: newToken } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', username);
      setToken(newToken);
      setUser(username);
      toast.success('נרשמת בהצלחה!');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'שגיאה בהרשמה';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('התנתקת בהצלחה');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
