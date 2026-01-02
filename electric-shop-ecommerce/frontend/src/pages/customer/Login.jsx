import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

/**
 * Customer Login Page Component
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    const result = await loginWithGoogle(credentialResponse.credential);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <>
      <Navbar />

      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <h1>Login</h1>
            <p className="auth-subtitle">Welcome back! Please login to your account.</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your-google-client-id-here' ? (
                <>
                  <p style={{ color: '#666', marginBottom: '15px' }}>or</p>
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                      />
                    </div>
                  </GoogleOAuthProvider>
                </>
              ) : (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  color: '#666',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
                  ⚠️ Google Sign-In not configured. Please add VITE_GOOGLE_CLIENT_ID to .env.local
                </div>
              )}
            </div>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>

            {/* Demo Credentials */}
            <div className="demo-credentials">
              <h4>Demo Credentials:</h4>
              <p><strong>Email:</strong> john@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Login;
