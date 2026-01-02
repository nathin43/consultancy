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
      setAdmin(JSON.parse(adminData));
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

  // Customer Register with OTP
  const registerWithOTP = async (userData) => {
    try {
      const { data } = await API.post('/auth/register', userData);
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Verify OTP and complete registration
  const verifyOTP = async (email, otp) => {
    try {
      const { data } = await API.post('/auth/verify-otp', { email, otp });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed'
      };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      const { data } = await API.post('/auth/resend-otp', { email });
      
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP'
      };
    }
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
      // Call logout endpoint to clear cart from database
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
