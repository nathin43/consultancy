import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartLoginRequired.css';

/**
 * Cart Login Required Component
 * Shows an animated message when user tries to access cart without logging in
 */
const CartLoginRequired = ({ autoRedirect = true, redirectDelay = 4000 }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(Math.floor(redirectDelay / 1000));

  // Auto-redirect countdown
  useEffect(() => {
    if (!autoRedirect) return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/login');
    }, redirectDelay);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [autoRedirect, redirectDelay, navigate]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  return (
    <div className="cart-login-overlay">
      <div className="cart-login-card">
        {/* Animated Icon */}
        <div className="cart-login-icon-wrapper">
          <div className="cart-lock-animation">
            {/* Shopping Cart Icon */}
            <svg className="cart-icon-animated" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1" fill="currentColor"/>
              <circle cx="20" cy="21" r="1" fill="currentColor"/>
            </svg>
            {/* Lock Icon Overlay */}
            <svg className="lock-icon-animated" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Message Content */}
        <div className="cart-login-content">
          <h2 className="cart-login-title">Please Login to View Your Cart</h2>
          <p className="cart-login-description">
            You need to sign in before accessing your shopping cart.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="cart-login-actions">
          <button 
            className="cart-login-btn cart-login-btn-primary"
            onClick={handleLoginClick}
          >
            🔐 Login Now
          </button>
          <button 
            className="cart-login-btn cart-login-btn-secondary"
            onClick={handleContinueShopping}
          >
            🛍️ Continue Shopping
          </button>
        </div>

        {/* Auto-redirect Notice */}
        {autoRedirect && countdown > 0 && (
          <div className="cart-login-redirect-notice">
            Redirecting to login in <span className="countdown-number">{countdown}</span> {countdown === 1 ? 'second' : 'seconds'}...
          </div>
        )}
      </div>
    </div>
  );
};

export default CartLoginRequired;
