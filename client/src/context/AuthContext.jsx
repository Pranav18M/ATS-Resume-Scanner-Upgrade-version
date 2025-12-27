// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import authUtils from '../utils/auth';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = authUtils.getToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      if (authUtils.isTokenExpired(token)) {
        authUtils.clearAuth();
        setLoading(false);
        return;
      }

      try {
        await authAPI.verifyToken();
        const userData = authUtils.getUserData();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        authUtils.clearAuth();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authUtils.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.token) {
        authUtils.setToken(response.token);
        
        const userData = {
          email: response.email || email,
          id: response.userId || response.id,
        };
        
        authUtils.setUserData(userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, message: 'No token received' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await authAPI.signup(email, password);
      
      if (response.token) {
        authUtils.setToken(response.token);
        
        const userData = {
          email: response.email || email,
          id: response.userId || response.id,
        };
        
        authUtils.setUserData(userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, message: 'No token received' };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Signup failed. Please try again.',
      };
    }
  };

  const logout = () => {
    try {
      authAPI.logout().catch(() => {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authUtils.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;