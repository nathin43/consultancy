import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

/**
 * Customer Registration Page Component
 */
const Register = () => {
  const navigate = useNavigate();
  const { registerWithOTP, verifyOTP, loginWithGoogle } = useContext(AuthContext);
  const [step, setStep] = useState(1); // Step 1: Registration, Step 2: OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      // Step 1: Registration
      // Validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setLoading(true);

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India'
        }
      };

      const result = await registerWithOTP(userData);

      if (result.success) {
        setRegisteredEmail(formData.email);
        setStep(2);
      } else {
        setError(result.message);
      }

      setLoading(false);
    } else {
      // Step 2: OTP Verification
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);

      const result = await verifyOTP(registeredEmail, otp);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }

      setLoading(false);
    }
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
    setError('Google registration failed. Please try again.');
  };

  return (
    <>
      <Navbar />

      <div className="auth-page">
        <div className="container">
          <div className="auth-card">
            <h1>{step === 1 ? 'Register' : 'Verify Email'}</h1>
            <p className="auth-subtitle">
              {step === 1 
                ? 'Create your account to start shopping' 
                : 'Enter the OTP sent to your email'}
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {step === 1 && (
              <div style={{ marginBottom: '20px' }}>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your-google-client-id-here' ? (
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
                ) : (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      ⚠️ Google Sign-In not configured. Please add VITE_GOOGLE_CLIENT_ID to .env.local
                    </p>
                  </div>
                )}
                <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    width: '100%',
                    height: '1px',
                    backgroundColor: '#ddd'
                  }}></div>
                  <p style={{
                    color: '#999',
                    backgroundColor: '#fff',
                    padding: '0 10px',
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: '14px'
                  }}>or register with email</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {step === 1 ? (
                // Step 1: Registration Form
                <>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
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
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter password (min 6 characters)"
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                    />
                  </div>

                  <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Address</h3>

                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="form-group">
                    <label>Zip Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      placeholder="Enter zip code"
                      pattern="[0-9]{6}"
                      title="Please enter a valid 6-digit zip code"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Continue'}
                  </button>
                </>
              ) : (
                // Step 2: OTP Verification Form
                <>
                  <div className="form-group">
                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                      Enter the 6-digit OTP sent to <strong>{registeredEmail}</strong>
                    </p>
                    <label>OTP Code *</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      required
                      placeholder="000000"
                      maxLength="6"
                      style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '10px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b35',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px'
                      }}
                    >
                      Back to Registration
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Register;
