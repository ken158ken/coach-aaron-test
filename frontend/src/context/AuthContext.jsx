import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

// Check if we're running on the server
const isServer = typeof window === 'undefined';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (!isServer) {
      checkAuth();
    }
  }, []);

  const login = async (email, password) => {
    if (isServer) return { success: false, message: 'Cannot login on server' };
    
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.error || '登入失敗' };
    }
  };

  const register = async (data) => {
    if (isServer) return { success: false, message: 'Cannot register on server' };
    
    try {
      const res = await api.post('/api/auth/register', data);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.error || '註冊失敗' };
    }
  };

  const logout = async () => {
    if (isServer) return;
    
    try {
      await api.post('/api/auth/logout');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, refreshUser, loading, mounted }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
