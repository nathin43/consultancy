import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import LightbulbIcon from './LightbulbIcon';
import './Navbar.css';

/**
 * Navigation Bar Component
 * Main navigation for customer website
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand-section">
          <Link to="/" className="navbar-brand">
            <LightbulbIcon size={32} color="#ffffff" />
            Mani Electrical
          </Link>

          <div className="navbar-auth-dropdown">
            {isAuthenticated ? (
              <div className="auth-dropdown-wrapper">
                <button 
                  className="auth-dropdown-toggle"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="auth-icon">👤</span>
                  <span className="auth-name">{user?.name}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {dropdownOpen && (
                  <div className="auth-dropdown-menu">
                    <Link to="/orders" className="dropdown-item">My Orders</Link>
                    <Link to="/profile" className="dropdown-item">Profile</Link>
                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-dropdown-wrapper">
                <button 
                  className="auth-dropdown-toggle"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="auth-icon">👤</span>
                  <span className="auth-name">Login</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {dropdownOpen && (
                  <div className="auth-dropdown-menu">
                    <Link to="/login" className="dropdown-item">Login</Link>
                    <Link to="/register" className="dropdown-item">Sign Up</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <ul className="navbar-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li>
              <Link to="/cart" className="cart-link">
                🛒 Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
