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
  const [chartData, setChartData] = useState(null);
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
      
      // Generate mock chart data
      setChartData({
        daily: generateDailyData(),
        monthly: generateMonthlyData()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data on error
      setChartData({
        daily: generateDailyData(),
        monthly: generateMonthlyData()
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDailyData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      sales: Math.floor(Math.random() * 50000) + 10000
    }));
  };

  const generateMonthlyData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      sales: Math.floor(Math.random() * 100000) + 50000
    }));
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
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2>Welcome back to your dashboard</h2>
          <p>Here's your store performance overview</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card premium">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <span style={{ color: '#2563eb' }}>💰</span>
              </div>
              <div className="stat-badge">+12.5%</div>
            </div>
            <div className="stat-content">
              <h3>Total Sales</h3>
              <p className="stat-value">₹{stats?.totalSales?.toLocaleString() || 0}</p>
              <span className="stat-subtitle">vs last month</span>
            </div>
          </div>

          <div className="stat-card premium">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <span style={{ color: '#16a34a' }}>🛒</span>
              </div>
              <div className="stat-badge green">+8.2%</div>
            </div>
            <div className="stat-content">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats?.totalOrders || 0}</p>
              <span className="stat-subtitle">vs last month</span>
            </div>
          </div>

          <div className="stat-card premium">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <span style={{ color: '#d97706' }}>📦</span>
              </div>
              <div className="stat-badge orange">+5.1%</div>
            </div>
            <div className="stat-content">
              <h3>Total Products</h3>
              <p className="stat-value">{stats?.totalProducts || 0}</p>
              <span className="stat-subtitle">in inventory</span>
            </div>
          </div>

          <div className="stat-card premium">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                <span style={{ color: '#6366f1' }}>👥</span>
              </div>
              <div className="stat-badge purple">+15.3%</div>
            </div>
            <div className="stat-content">
              <h3>Total Customers</h3>
              <p className="stat-value">{stats?.totalCustomers || 0}</p>
              <span className="stat-subtitle">active users</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Daily Sales</h3>
            <div className="chart-wrapper">
              {chartData?.daily && (
                <div className="bar-chart">
                  {chartData.daily.map((item, idx) => (
                    <div key={idx} className="bar-item">
                      <div className="bar-column" style={{ height: `${(item.sales / 60000) * 200}px` }}></div>
                      <label>{item.day}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="chart-container">
            <h3>Sales Performance</h3>
            <div className="performance-metrics">
              <div className="metric">
                <div className="metric-circle" style={{ background: 'conic-gradient(#7c3aed 0deg 270deg, #e5e7eb 270deg)' }}>
                  <span>75%</span>
                </div>
                <p>Monthly Target</p>
              </div>
              <div className="metric">
                <div className="metric-circle" style={{ background: 'conic-gradient(#3b82f6 0deg 180deg, #e5e7eb 180deg)' }}>
                  <span>60%</span>
                </div>
                <p>Growth Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat-item">
            <span className="quick-stat-label">⏳ Pending Orders</span>
            <span className="quick-stat-value">{stats?.pendingOrders || 0}</span>
          </div>
          <div className="quick-stat-item">
            <span className="quick-stat-label">📉 Out of Stock</span>
            <span className="quick-stat-value">{stats?.outOfStock || 0}</span>
          </div>
          <div className="quick-stat-item">
            <span className="quick-stat-label">⭐ Avg Rating</span>
            <span className="quick-stat-value">4.5</span>
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
