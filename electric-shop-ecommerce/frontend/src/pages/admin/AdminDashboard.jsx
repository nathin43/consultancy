import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminDashboard.css';

/**
 * Admin Dashboard Page
 * Overview of store statistics and recent activities
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [categorySales, setCategorySales] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await API.get('/admin/dashboard');
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setCategorySales(data.categorySales);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <span style={{ color: '#2563eb' }}>💰</span>
            </div>
            <div className="stat-content">
              <h3>Total Sales</h3>
              <p className="stat-value">₹{stats?.totalSales?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <span style={{ color: '#16a34a' }}>🛒</span>
            </div>
            <div className="stat-content">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats?.totalOrders || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <span style={{ color: '#d97706' }}>📦</span>
            </div>
            <div className="stat-content">
              <h3>Total Products</h3>
              <p className="stat-value">{stats?.totalProducts || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0e7ff' }}>
              <span style={{ color: '#6366f1' }}>👥</span>
            </div>
            <div className="stat-content">
              <h3>Total Customers</h3>
              <p className="stat-value">{stats?.totalCustomers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fed7aa' }}>
              <span style={{ color: '#ea580c' }}>⏳</span>
            </div>
            <div className="stat-content">
              <h3>Pending Orders</h3>
              <p className="stat-value">{stats?.pendingOrders || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2' }}>
              <span style={{ color: '#dc2626' }}>📉</span>
            </div>
            <div className="stat-content">
              <h3>Out of Stock</h3>
              <p className="stat-value">{stats?.outOfStock || 0}</p>
            </div>
          </div>
        </div>

        {/* Category Sales */}
        <div className="dashboard-section">
          <h2>Sales by Category</h2>
          <div className="category-sales">
            {Object.entries(categorySales).map(([category, sales]) => (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-sales">₹{sales.toLocaleString()}</span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${(sales / Math.max(...Object.values(categorySales))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <h2>Recent Orders</h2>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order.orderNumber}</td>
                    <td>{order.user?.name}</td>
                    <td>₹{order.totalPrice.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    confirmed: 'primary',
    processing: 'primary',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger'
  };
  return colors[status] || 'primary';
};

export default AdminDashboard;
