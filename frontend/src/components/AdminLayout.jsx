import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './AdminLayout.css';

/**
 * Admin Layout Component
 * Provides navigation sidebar for admin pages
 */
const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, adminLogout } = useContext(AuthContext);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '📦', label: 'Products' },
    { path: '/admin/orders', icon: '🛒', label: 'Orders' },
    { path: '/admin/customers', icon: '👥', label: 'Customers' }
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>⚡ Mani</h2>
          <p>Admin</p>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}</h1>
          
          <div className="header-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="view-site-link">
              🌐 View Site
            </a>
            
            <div className="profile-dropdown-wrapper">
              <button 
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                title={admin?.name}
              >
                <span className="profile-avatar">{admin?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              </button>
              
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <p className="profile-name">{admin?.name}</p>
                    <p className="profile-role">{admin?.role}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="profile-logout"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-main">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
