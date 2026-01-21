import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import LightbulbIcon from './LightbulbIcon';
import './Navbar.css';

/**
 * Navigation Bar Component
 * Main navigation for customer website
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { info } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    info('You have been logged out 👋');
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="main-header">
        <div className="header-container">
          
          {/* LEFT - Logo */}
          <div className="header-left">
            <Link to="/" className="navbar-brand">
              <LightbulbIcon size={28} color="#ffffff" />
              <span className="brand-text">Mani Electrical</span>
            </Link>
          </div>

          {/* RIGHT - Search + Login */}
          <div className="header-right">
            {/* Search Box */}
            <div className="search-box">
              <form onSubmit={handleSearch} className="search-form">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Login Button / Auth Dropdown */}
            <div className="auth-dropdown-wrapper">
              <button 
                className={`login-btn ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={isAuthenticated ? `Logged in as ${user?.name}` : "Login or Sign Up"}
              >
                <span className="user-icon">👤</span>
                <span className="login-text">{isAuthenticated ? user?.name?.split(' ')[0] : 'Sign In'}</span>
              </button>

              {dropdownOpen && (
                <div className="auth-dropdown-menu active">
                  <div className="dropdown-header">
                    <div className="user-greeting">{isAuthenticated ? 'Logged in as' : 'Account'}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                      {isAuthenticated ? user?.name : 'Guest'}
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  {isAuthenticated ? (
                    <>
                      <Link to="/orders" className="dropdown-item orders-item" onClick={() => setDropdownOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4"></path>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                        </svg>
                        <span>My Orders</span>
                      </Link>
                      
                      <Link to="/profile" className="dropdown-item settings-item" onClick={() => setDropdownOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                        </svg>
                        <span>Settings</span>
                      </Link>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4m7-4l4-4m0 0l-4-4m4 4H9"></path>
                        </svg>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-6-4l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                        <span>Login</span>
                      </Link>
                      <Link to="/register" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                          <circle cx="10" cy="7" r="4"></circle>
                          <path d="M17 11h6m-3-3v6"></path>
                        </svg>
                        <span>Sign Up</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="navbar-menu-section">
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
    </nav>
  );
};

export default Navbar;
