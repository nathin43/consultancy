import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Customer Registration Page Component
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [passwordStrength, setPasswordStrength] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false
  });

  /**
   * Validation Functions
   */
  const validateName = (value) => {
    if (!value.trim()) {
      return 'Full name is required';
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return 'Full name can only contain letters and spaces';
    }
    if (value.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address (example@domain.com)';
    }
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) {
      return 'Phone number is required';
    }
    if (!/^\d+$/.test(value)) {
      return 'Phone number can only contain digits';
    }
    if (value.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return '';
  };

  const getPasswordStrength = (value) => {
    if (value.length === 0) return '';
    
    const hasLowerCase = /[a-z]/.test(value);
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    if (value.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      return 'Excellent';
    }
    if (value.length >= 6 && hasLowerCase && hasNumber) {
      return 'Strong';
    }
    return 'Poor';
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  /**
   * Check if all validations pass
   */
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      formData.phone.trim() !== '' &&
      !validationErrors.name &&
      !validationErrors.email &&
      !validationErrors.password &&
      !validationErrors.confirmPassword &&
      !validationErrors.phone
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Auto-convert email to lowercase
    if (name === 'email') {
      finalValue = value.toLowerCase();
    }

    // Restrict phone to digits only and max 10
    if (name === 'phone') {
      finalValue = value.replace(/[^\d]/g, '').slice(0, 10);
    }

    setFormData({ ...formData, [name]: finalValue });

    // Real-time validation
    let fieldError = '';
    if (name === 'name') {
      fieldError = validateName(finalValue);
    } else if (name === 'email') {
      fieldError = validateEmail(finalValue);
    } else if (name === 'phone') {
      fieldError = validatePhone(finalValue);
    } else if (name === 'password') {
      fieldError = validatePassword(finalValue);
      setPasswordStrength(getPasswordStrength(finalValue));
    } else if (name === 'confirmPassword') {
      fieldError = validateConfirmPassword(finalValue, formData.password);
    }

    setValidationErrors({
      ...validationErrors,
      [name]: fieldError
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched for validation display
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true
    });

    if (!isFormValid()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);

    const userData = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone
    };

    const result = await register(userData);

    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Google registration failed');
      }
    } catch (err) {
      setError('An error occurred during Google registration');
      console.error('Google registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google registration failed. Please try again.');
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'Excellent':
        return '#10b981'; // green
      case 'Strong':
        return '#f59e0b'; // amber
      case 'Poor':
        return '#ef4444'; // red
      default:
        return '#d1d5db'; // gray
    }
  };

  if (!googleClientId || googleClientId === 'dummy') {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <div className="container">
            <div className="auth-card">
              <div className="alert alert-danger">
                Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Navbar />

      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <h1>Register</h1>
            <p className="auth-subtitle">Create your account to start shopping</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your full name"
                  style={{
                    borderColor:
                      touched.name && validationErrors.name ? '#ef4444' : 'inherit'
                  }}
                />
                {touched.name && validationErrors.name && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✗ {validationErrors.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  style={{
                    borderColor:
                      touched.email && validationErrors.email ? '#ef4444' : 'inherit'
                  }}
                />
                {touched.email && validationErrors.email && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✗ {validationErrors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your phone number"
                  style={{
                    borderColor:
                      touched.phone && validationErrors.phone ? '#ef4444' : 'inherit'
                  }}
                />
                {touched.phone && validationErrors.phone && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✗ {validationErrors.phone}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter password (min 6 characters)"
                  style={{
                    borderColor:
                      touched.password && validationErrors.password ? '#ef4444' : 'inherit'
                  }}
                />
                {formData.password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>
                        Password Strength:
                      </span>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStrengthColor()
                      }}></span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: getStrengthColor()
                      }}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                      {passwordStrength === 'Excellent' && (
                        <div style={{ color: '#10b981', display: 'flex', gap: '4px' }}>
                          <span>✓</span>
                          <span>Excellent security</span>
                        </div>
                      )}
                      {passwordStrength === 'Strong' && (
                        <div>
                          <div style={{ color: '#10b981', display: 'flex', gap: '4px' }}>
                            <span>✓</span>
                            <span>Good! Add uppercase letter and special character for Excellent</span>
                          </div>
                        </div>
                      )}
                      {passwordStrength === 'Poor' && (
                        <div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span>•</span>
                            <span>Add letters and numbers</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {touched.password && validationErrors.password && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✗ {validationErrors.password}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
                  style={{
                    borderColor:
                      touched.confirmPassword && validationErrors.confirmPassword ? '#ef4444' : 'inherit'
                  }}
                />
                {touched.confirmPassword && validationErrors.confirmPassword && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✗ {validationErrors.confirmPassword}
                  </div>
                )}
                {touched.confirmPassword && !validationErrors.confirmPassword && formData.confirmPassword && (
                  <div style={{
                    color: '#10b981',
                    fontSize: '13px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || !isFormValid()}
                style={{
                  opacity: loading || !isFormValid() ? 0.6 : 1,
                  cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '24px 0', padding: '20px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ color: '#5f6368', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>or continue with</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  auto_select={false}
                  itp_supported={false}
                />
              </div>
            </div>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </GoogleOAuthProvider>
  );
};

export default Register;
