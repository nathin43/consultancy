import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import LightbulbIcon from './LightbulbIcon';
import './Navbar.css';

/**
 * Navigation Bar Component
 * Amazon/Flipkart inspired design with search bar and category menu
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { info } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleLogout = () => {
    setDropdownOpen(false);
    logout(() => {
      info('You have been logged out 👋');
      navigate('/');
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <nav className="navbar">
      {/* TOP HEADER - Main Navbar */}
      <div className="navbar-top">
        <div className="navbar-inner">
          {/* LEFT - Logo */}
          <div className="nav-left">
            <Link to="/" className="navbar-brand">
              <span className="logo-pill">
                <LightbulbIcon size={28} color="#ffffff" />
              </span>
              <div className="brand-content">
                <span className="brand-text">Mani Electricals</span>
              </div>
            </Link>
          </div>

          {/* CENTER - Main Navigation Links */}
          <div className="nav-center">
            <nav className="main-nav">
              <NavLink 
                to="/" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Home
              </NavLink>
              <NavLink 
                to="/products" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Products
              </NavLink>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}
              >
                Contact
              </NavLink>
            </nav>
          </div>

          {/* RIGHT - Search, User, Orders, Cart */}
          <div className="nav-right">
            {/* Search Bar */}
            <form className="search-container" onSubmit={handleSearch}>
              <div className="search-category-wrapper">
                <select
                  className="search-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Select category"
                >
                  <option value="All">All Categories</option>
                  <option value="Wires & Cables">Wires &amp; Cables</option>
                  <option value="Motors">Motors</option>
                  <option value="Pipes">Pipes</option>
                  <option value="Water Tanks">Water Tanks</option>
                  <option value="Fans">Fans</option>
                  <option value="Switches">Switches</option>
                  <option value="Pumps">Pumps</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Tools">Tools</option>
                </select>
                <svg className="search-category-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div className="search-divider"></div>
              <input
                type="text"
                className="search-input"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" className="search-button" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </form>

            {/* User Profile */}
            <div className="user-section">
              <button
                className={`user-button ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={isAuthenticated ? `Logged in as ${user?.name}` : 'Login or Sign Up'}
              >
                <span className="user-avatar">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5"></circle>
                      <path d="M20 21a8 8 0 1 0-16 0"></path>
                    </svg>
                  )}
                </span>
                <div className="user-info">
                  <span className="user-greeting">Hello, {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign in'}</span>
                  <span className="user-account">Account & Lists</span>
                </div>
                <svg className="user-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown active">
                  {!isAuthenticated && (
                    <>
                      <div className="dropdown-header">
                        <Link to="/login" className="dropdown-signin-btn" onClick={() => setDropdownOpen(false)}>
                          Sign in to your account
                        </Link>
                        <div className="dropdown-signup-text">
                          New customer? <Link to="/register" onClick={() => setDropdownOpen(false)}>Start here.</Link>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                    </>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <div className="dropdown-section">
                        <h3 className="dropdown-title">Your Account</h3>
                        <Link to="/profile" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Profile Settings
                        </Link>
                        <Link to="/orders" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                          </svg>
                          Your Orders
                        </Link>
                        <Link to="/support-messages" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                          </svg>
                          Support Messages
                        </Link>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-link logout-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4m7-4l4-4m0 0l-4-4m4 4H9"></path>
                        </svg>
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="cart-button">
              <div className="cart-icon-wrapper">
                <div className="cart-icon-bg">
                  <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                </div>
                {cartCount > 0 && (
                  <span className="cart-count" key={cartCount}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="cart-text">Cart</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="menu-toggle-bar"></span>
              <span className="menu-toggle-bar"></span>
              <span className="menu-toggle-bar"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`nav-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            {isAuthenticated ? (
              <>
                <div className="mobile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <span className="mobile-username">Hello, {user?.name?.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="mobile-username">Hello, Sign in</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mobile-menu-content">
          <div className="mobile-menu-section">
            <h3>Categories</h3>
            <Link to="/products?category=wires-cables" onClick={() => setMenuOpen(false)}>Wires & Cables</Link>
            <Link to="/products?category=motors" onClick={() => setMenuOpen(false)}>Motors</Link>
            <Link to="/products?category=pipes" onClick={() => setMenuOpen(false)}>Pipes</Link>
            <Link to="/products?category=water-tanks" onClick={() => setMenuOpen(false)}>Water Tanks</Link>
            <Link to="/products?category=fans" onClick={() => setMenuOpen(false)}>Fans</Link>
            <Link to="/products?category=switches" onClick={() => setMenuOpen(false)}>Switches</Link>
            <Link to="/products?category=pumps" onClick={() => setMenuOpen(false)}>Pumps</Link>
            <Link to="/products?category=lighting" onClick={() => setMenuOpen(false)}>Lighting</Link>
          </div>

          <div className="mobile-menu-divider"></div>

          <div className="mobile-menu-section">
            <h3>Quick Links</h3>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/products" onClick={() => setMenuOpen(false)}>All Products</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
          </div>

          {isAuthenticated && (
            <>
              <div className="mobile-menu-divider"></div>
              <div className="mobile-menu-section">
                <h3>Your Account</h3>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>Your Orders</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile Settings</Link>
                <Link to="/support-messages" onClick={() => setMenuOpen(false)}>Support Messages</Link>
                <button onClick={handleLogout} className="mobile-logout-btn">Sign Out</button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <>
              <div className="mobile-menu-divider"></div>
              <div className="mobile-menu-section">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="mobile-signin-btn">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="mobile-signup-btn">Create Account</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
