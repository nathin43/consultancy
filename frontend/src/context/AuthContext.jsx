import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import LogoutTransition from '../components/LogoutTransition';

export const AuthContext = createContext();

/**
 * Custom hook to use the Auth context
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Context Provider
 * Manages user authentication state and operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);
  const [logoutType, setLogoutType] = useState(null); // 'user' | 'admin'

  // React to token-cleared events dispatched by the API response interceptor.
  // When a 401 clears localStorage.token outside of React, this keeps
  // isAuthenticated in sync so polling (bell, etc.) stops immediately.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:user-session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:user-session-expired', handleSessionExpired);
  }, []);

  // Restore session from localStorage on component mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // sessionStorage flag acts as a "session active" gate.
        // sessionStorage is cleared when the browser tab/window is closed,
        // so a fresh browser open always starts as guest.
        const sessionActive = sessionStorage.getItem('sessionActive');

        if (!sessionActive) {
          // No active session — clear any stale localStorage data and stay as guest
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          return;
        }

        // Snapshot tokens BEFORE any async call so we can detect if a
        // concurrent login replaced them while validation was in-flight.
        const snapshotToken = localStorage.getItem('token');
        const snapshotAdminToken = localStorage.getItem('adminToken');

        // Validate customer token against the backend
        if (snapshotToken) {
          try {
            const { data } = await API.get('/auth/me');
            // Only act if the token hasn't been replaced by a concurrent login
            if (localStorage.getItem('token') === snapshotToken) {
              if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
              } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }
          } catch {
            // 401 or network error — only clear if no concurrent login replaced the token
            if (localStorage.getItem('token') === snapshotToken) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        }

        // Validate admin token against the backend
        if (snapshotAdminToken) {
          try {
            const { data } = await API.get('/auth/admin/me');
            // Only act if the token hasn't been replaced by a concurrent login
            if (localStorage.getItem('adminToken') === snapshotAdminToken) {
              if (data.success && data.admin) {
                setAdmin(data.admin);
                localStorage.setItem('admin', JSON.stringify(data.admin));
              } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('admin');
              }
            }
          } catch {
            // 401 or network error — only clear if no concurrent login replaced the token
            if (localStorage.getItem('adminToken') === snapshotAdminToken) {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('admin');
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Customer Login
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('sessionActive', 'true');
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
      sessionStorage.setItem('sessionActive', 'true');
      setUser(data.user);

      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Refresh user profile from server
  const refreshUser = async () => {
    try {
      // Fetch fresh user data from backend
      const { data } = await API.get('/users/profile');
      
      if (!data.success) {
        console.error('Refresh user: Backend returned failure');
        return {
          success: false,
          message: data.message || 'Failed to refresh profile'
        };
      }

      if (!data.user) {
        console.error('Refresh user: No user data in response');
        return {
          success: false,
          message: 'No user data received'
        };
      }

      // Validate the user object has required fields
      if (!data.user._id || !data.user.email) {
        console.error('Refresh user: Invalid user object structure');
        return {
          success: false,
          message: 'Invalid user data received'
        };
      }

      // Update both state and localStorage with fresh data
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✅ User profile refreshed successfully at', new Date().toISOString());
      
      return {
        success: true,
        user: data.user,
        timestamp: data.timestamp
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh profile';
      console.error('❌ Error refreshing user profile:', errorMessage);
      
      // If unauthorized (401), user session is invalid
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // Customer Logout
  const logout = async (callback) => {
    // Prevent multiple logout attempts
    if (isLoggingOut) return;

    // Clear user state and storage IMMEDIATELY so navbar updates right away
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('sessionActive');
    setUser(null);

    // Trigger logout animation
    setLogoutType('user');
    setIsLoggingOut(true);
    
    // Store callback to execute after animation
    if (callback) {
      setLogoutCallback(() => callback);
    }
  };

  // Handle logout completion after animation
  const handleLogoutComplete = async () => {
    try {
      // Call logout endpoint to clear server session
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // State and storage already cleared in logout(), just finish up
      setIsLoggingOut(false);
      
      // Execute callback if provided
      if (logoutCallback) {
        logoutCallback();
        setLogoutCallback(null);
      }
    }
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    try {
      const { data } = await API.post('/auth/admin/login', { email, password });

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      sessionStorage.setItem('sessionActive', 'true');
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
  const adminLogout = async (callback) => {
    // Prevent multiple logout attempts
    if (isLoggingOut) return;

    // Save token BEFORE clearing so we can still call the logout endpoint
    const tokenToInvalidate = localStorage.getItem('adminToken');

    // Clear admin state and storage IMMEDIATELY so UI updates right away
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('sessionActive');
    setAdmin(null);

    // Trigger logout animation
    setLogoutType('admin');
    setIsLoggingOut(true);
    
    // Store both the callback and token for use after animation
    if (callback) {
      setLogoutCallback(() => callback);
    }
    // Stash token on window temporarily so handleAdminLogoutComplete can use it
    window.__adminLogoutToken = tokenToInvalidate;
  };

  // Handle admin logout completion after animation
  const handleAdminLogoutComplete = async () => {
    try {
      // Use the saved token (cleared from localStorage before animation started)
      const token = window.__adminLogoutToken;
      delete window.__adminLogoutToken;
      if (token) {
        await API.post('/auth/admin/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Non-critical – local state is already cleared
      console.error('Error during admin logout:', error);
    } finally {
      // State and storage already cleared in adminLogout(), just finish up
      setIsLoggingOut(false);
      
      // Execute callback if provided
      if (logoutCallback) {
        logoutCallback();
        setLogoutCallback(null);
      }
    }
  };

  // Login with Google
  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await API.post('/auth/google', { credential });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('sessionActive', 'true');
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
    refreshUser,
    logout,
    loginWithGoogle,
    adminLogin,
    adminLogout,
    isAuthenticated: !!user,
    isAdmin: !!admin
  };

  // Determine which logout completion handler to use
  const handleLogoutAnimationComplete = () => {
    setLogoutType(null);
    if (logoutType === 'admin') {
      handleAdminLogoutComplete();
    } else {
      handleLogoutComplete();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LogoutTransition 
        isActive={isLoggingOut} 
        onComplete={handleLogoutAnimationComplete}
      />
    </AuthContext.Provider>
  );
};
