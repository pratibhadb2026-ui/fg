import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Session expired or invalid:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/login', 'POST', { username, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
