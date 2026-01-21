import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './AdminLogin.css';

/**
 * Admin Login Page Component
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useContext(AuthContext);
  const { success, error: showError, warning } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill demo credentials for testing
  const autoFillDemo = () => {
    setFormData({
      email: 'admin@electricshop.com',
      password: 'admin123'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate input
    if (!formData.email.trim() || !formData.password.trim()) {
      const errorMsg = 'Please enter both email and password';
      showError(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      // Clear any old tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const result = await adminLogin(formData.email, formData.password);

      if (result.success) {
        success('Admin Login Successful! Welcome to dashboard.');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 500);
      } else {
        showError(result.message || 'Login failed. Please check your credentials.');
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      showError('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="header-icon">⚡</div>
            <h1>Mani Electrical</h1>
            <p className="header-subtitle">Admin Panel</p>
            <p className="header-description">Manage your store efficiently</p>
          </div>

          <div className="form-container">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@electricshop.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="btn-login"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-text">
                    <span className="spinner"></span>
                    Logging in...
                  </span>
                ) : (
                  'Login to Admin Panel'
                )}
              </button>
            </form>

            <div className="divider">or</div>

            <div className="demo-credentials-card">
              <div className="demo-header">
                <h4>Demo Credentials</h4>
                <p className="demo-hint">Use these to test the admin panel</p>
              </div>
              <div className="credentials-content">
                <div className="credential-item">
                  <span className="credential-label">Email:</span>
                  <span className="credential-value">admin@electricshop.com</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Password:</span>
                  <span className="credential-value">admin123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={autoFillDemo}
                className="btn-autofill"
              >
                Auto-fill Credentials
              </button>
            </div>
          </div>

          <div className="admin-login-footer">
            <a href="/" className="back-link">
              ← Back to Customer Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
