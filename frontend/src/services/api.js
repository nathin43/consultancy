import axios from 'axios';

/**
 * API Service Configuration
 * Base configuration for all API calls
 * Uses dynamic port detection for development environments
 */

// Determine the backend URL based on environment
const getBackendURL = () => {
  // In development, use the current host and the Vite proxy
  if (import.meta.env.DEV) {
    // This will use the Vite proxy configured in vite.config.js
    return '/api';
  }
  // In production, use the full URL
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
};

const API = axios.create({
  baseURL: getBackendURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method.toUpperCase(), config.url);
  return config;
});

// Handle responses and clear invalid tokens
API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.status === 401 && error.response?.data?.message === 'Admin not found') {
      // Clear invalid admin token and redirect to admin login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default API;
