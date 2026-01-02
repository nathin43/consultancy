import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Private Route Component
 * Protects routes that require customer authentication
 * Redirects admins to admin dashboard
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="spinner"></div>;
  }

  // If admin tries to access customer routes, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
