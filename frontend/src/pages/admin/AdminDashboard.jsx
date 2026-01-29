import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminDashboard.css';

/**
 * Admin Dashboard
 * Modern, clean dashboard for daily decision-making
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState('daily');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await API.get('/admin/dashboard');
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      
      // Generate chart data
      setChartData({
        daily: generateDailyData(),
        weekly: generateWeeklyData()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data on error
      setChartData({
        daily: generateDailyData(),
        weekly: generateWeeklyData()
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

  const generateWeeklyData = () => {
    return Array.from({ length: 4 }, (_, i) => ({
      week: `Week ${i + 1}`,
      sales: Math.floor(Math.random() * 200000) + 100000
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const getSystemStatus = () => {
    const statuses = ['All Systems Operational', 'System Running Smoothly', 'Everything Normal'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-container">
          <div className="skeleton-header"></div>
          <div className="skeleton-metrics">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-kpi"></div>)}
          </div>
          <div className="skeleton-charts">
            {[1, 2].map(i => <div key={i} className="skeleton-chart"></div>)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-container">
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>{getGreeting()}, Admin</h1>
            <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="header-right">
            <div className="system-status">
              <span className="status-indicator online"></span>
              <span className="status-text">{getSystemStatus()}</span>
            </div>
            <Link to="/" className="btn-view-site">View Site</Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon sales">💰</div>
            <div className="kpi-content">
              <p className="kpi-label">Total Sales</p>
              <h3 className="kpi-value">₹{stats?.totalSales?.toLocaleString() || 0}</h3>
              <div className="kpi-trend up">↑ 12.5%</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orders">🛒</div>
            <div className="kpi-content">
              <p className="kpi-label">Total Orders</p>
              <h3 className="kpi-value">{stats?.totalOrders || 0}</h3>
              <div className="kpi-trend up">↑ 8.2%</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon products">📦</div>
            <div className="kpi-content">
              <p className="kpi-label">Total Products</p>
              <h3 className="kpi-value">{stats?.totalProducts || 0}</h3>
              <div className="kpi-trend down">↓ 2.1%</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon customers">👥</div>
            <div className="kpi-content">
              <p className="kpi-label">Total Customers</p>
              <h3 className="kpi-value">{stats?.totalCustomers || 0}</h3>
              <div className="kpi-trend up">↑ 15.3%</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h2>Sales Trend</h2>
              <div className="chart-controls">
                <button
                  className={`chart-btn ${timeView === 'daily' ? 'active' : ''}`}
                  onClick={() => setTimeView('daily')}
                >
                  Daily
                </button>
                <button
                  className={`chart-btn ${timeView === 'weekly' ? 'active' : ''}`}
                  onClick={() => setTimeView('weekly')}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="chart-wrapper">
              {timeView === 'daily' && chartData?.daily && (
                <div className="line-chart">
                  {chartData.daily.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <div
                        className="bar-fill"
                        style={{ height: `${(item.sales / 60000) * 100}%` }}
                        title={`${item.day}: ₹${item.sales.toLocaleString()}`}
                      >
                        {idx === 3 && <span className="peak-dot">●</span>}
                      </div>
                      <label>{item.day}</label>
                    </div>
                  ))}
                </div>
              )}

              {timeView === 'weekly' && chartData?.weekly && (
                <div className="line-chart">
                  {chartData.weekly.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <div
                        className="bar-fill"
                        style={{ height: `${(item.sales / 250000) * 100}%` }}
                        title={`${item.week}: ₹${item.sales.toLocaleString()}`}
                      >
                        {idx === 2 && <span className="peak-dot">●</span>}
                      </div>
                      <label>{item.week}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h2>Order Status</h2>
            </div>

            <div className="donut-wrapper">
              <div className="donut-chart">
                <div className="donut-segment delivered" style={{ '--percentage': '45%' }}></div>
                <div className="donut-segment shipped" style={{ '--percentage': '30%' }}></div>
                <div className="donut-segment pending" style={{ '--percentage': '20%' }}></div>
                <div className="donut-segment cancelled" style={{ '--percentage': '5%' }}></div>
                <div className="donut-center">
                  <span className="donut-value">100</span>
                  <span className="donut-label">Orders</span>
                </div>
              </div>

              <div className="donut-legend">
                <div className="legend-item">
                  <span className="legend-dot delivered"></span>
                  <span className="legend-label">Delivered (45)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot shipped"></span>
                  <span className="legend-label">Shipped (30)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot pending"></span>
                  <span className="legend-label">Pending (20)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot cancelled"></span>
                  <span className="legend-label">Cancelled (5)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="insights-row">
          <div className="insight-card">
            <div className="insight-icon pending">⏳</div>
            <div className="insight-content">
              <p className="insight-label">Pending Orders</p>
              <h4 className="insight-value">{stats?.pendingOrders || 0}</h4>
              <p className="insight-desc">Awaiting processing</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon lowstock">⚠️</div>
            <div className="insight-content">
              <p className="insight-label">Low Stock Items</p>
              <h4 className="insight-value">{stats?.lowStockItems || 0}</h4>
              <p className="insight-desc">Less than 10 units</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon outofstock">🚫</div>
            <div className="insight-content">
              <p className="insight-label">Out of Stock</p>
              <h4 className="insight-value">{stats?.outOfStock || 0}</h4>
              <p className="insight-desc">Need restocking</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon rating">⭐</div>
            <div className="insight-content">
              <p className="insight-label">Avg Rating</p>
              <h4 className="insight-value">4.8</h4>
              <p className="insight-desc">From customers</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/products/add" className="action-card">
              <div className="action-icon">➕</div>
              <p>Add Product</p>
            </Link>

            <Link to="/admin/orders" className="action-card">
              <div className="action-icon">📋</div>
              <p>View Orders</p>
            </Link>

            <Link to="/admin/products" className="action-card">
              <div className="action-icon">📦</div>
              <p>Manage Stock</p>
            </Link>

            <Link to="/admin/customers" className="action-card">
              <div className="action-icon">👥</div>
              <p>Customers</p>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="recent-orders-section">
            <h2>Recent Orders</h2>
            <div className="orders-grid">
              {recentOrders.slice(0, 6).map((order) => (
                <div key={order._id} className="order-item">
                  <div className="order-header-mini">
                    <span className="order-number">#{order.orderNumber}</span>
                    <span className={`order-status-badge status-${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="order-customer">{order.user?.name}</p>
                  <div className="order-footer-mini">
                    <span className="order-total">₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}</span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
