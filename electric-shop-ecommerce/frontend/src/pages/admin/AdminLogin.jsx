import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminLogin.css';

/**
 * Admin Login Page Component
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useContext(AuthContext);
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
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // Clear any old tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const result = await adminLogin(formData.email, formData.password);

      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>⚡ Mani Electrical</h1>
          <h2>Admin Panel</h2>
          <p>Login to manage your store</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter admin email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>
            <a href="/">← Back to Customer Site</a>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <h4>Demo Admin Credentials:</h4>
          <p><strong>Email:</strong> admin@electricshop.com</p>
          <p><strong>Password:</strong> admin123</p>
          <button type="button" onClick={autoFillDemo} className="btn btn-sm btn-outline" style={{ marginTop: '10px' }}>
            ← Auto-fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
