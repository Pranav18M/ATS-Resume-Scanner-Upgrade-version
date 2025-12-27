// src/utils/auth.js
const TOKEN_KEY = 'ats_auth_token';
const USER_KEY = 'ats_user_data';

export const authUtils = {
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Failed to store token:', error);
      return false;
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return true;
    } catch (error) {
      console.error('Failed to remove token:', error);
      return false;
    }
  },

  isAuthenticated: () => {
    const token = authUtils.getToken();
    return token !== null && token !== undefined && token !== '';
  },

  setUserData: (userData) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to store user data:', error);
      return false;
    }
  },

  getUserData: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  isTokenExpired: (token) => {
    try {
      const decoded = authUtils.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  },

  clearAuth: () => {
    authUtils.removeToken();
    return true;
  }
};

export default authUtils;