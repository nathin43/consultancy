import { useContext } from 'react';
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
          <h2>⚡ Mani Electrical</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <p className="admin-name">{admin?.name}</p>
            <p className="admin-role">{admin?.role}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-danger">
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}</h1>
          <a href="/" target="_blank" className="view-site-link">
            🌐 View Customer Site
          </a>
        </div>

        <div className="admin-main">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
