import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [extraData, setExtraData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data.user);
          setExtraData(res.data.extraData);
        } catch (error) {
          console.error(error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    const meRes = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${res.data.token}` }
    });
    setUser(meRes.data.user);
    setExtraData(meRes.data.extraData);
  };

  const register = async (userData) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
    localStorage.setItem('token', res.data.token);
    const meRes = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${res.data.token}` }
    });
    setUser(meRes.data.user);
    setExtraData(meRes.data.extraData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setExtraData(null);
  };

  return (
    <AuthContext.Provider value={{ user, extraData, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
