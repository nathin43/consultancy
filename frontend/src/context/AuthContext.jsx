import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

/**
 * Authentication Context Provider
 * Manages user authentication state and operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('user');
    const adminData = localStorage.getItem('admin');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    if (adminToken && adminData) {
      const parsedAdmin = JSON.parse(adminData);
      setAdmin(parsedAdmin);
    }

    setLoading(false);
  }, []);

  // Customer Login
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Customer Register with OTP (DEPRECATED - OTP removed from system)
  const registerWithOTP = async (userData) => {
    console.warn('registerWithOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Verify OTP and complete registration (DEPRECATED - OTP removed from system)
  const verifyOTP = async (email, otp) => {
    console.warn('verifyOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Resend OTP (DEPRECATED - OTP removed from system)
  const resendOTP = async (email) => {
    console.warn('resendOTP is deprecated. OTP verification has been removed from the system.');
    return { success: false, message: 'OTP verification is no longer available' };
  };

  // Customer Register (Old method - kept for backward compatibility)
  const register = async (userData) => {
    try {
      const { data } = await API.post('/auth/register', userData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Customer Logout
  const logout = async () => {
    try {
      // Call logout endpoint to clear session
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // DO NOT clear cart - cart is persisted in MongoDB linked to user ID
      // When user logs back in, cart will be restored from database
      setUser(null);
    }
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    try {
      const { data } = await API.post('/auth/admin/login', { email, password });
      
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      setAdmin(data.admin);
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Admin login failed'
      };
    }
  };

  // Admin Logout
  const adminLogout = async () => {
    try {
      // Call admin logout endpoint
      await API.post('/auth/admin/logout');
    } catch (error) {
      console.error('Error during admin logout:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      setAdmin(null);
    }
  };

  // Login with Google
  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await API.post('/auth/google', { credential });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google authentication failed'
      };
    }
  };

  const value = {
    user,
    admin,
    loading,
    login,
    register,
    registerWithOTP,
    verifyOTP,
    resendOTP,
    logout,
    loginWithGoogle,
    adminLogin,
    adminLogout,
    isAuthenticated: !!user,
    isAdmin: !!admin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
