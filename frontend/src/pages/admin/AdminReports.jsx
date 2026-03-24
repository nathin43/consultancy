import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import ModernReportChart from '../../components/admin/ModernReportChart';
import './AdminReportsNewStyle.css';

const AdminReports = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [filter, setFilter] = useState('last7');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const getDateWindow = useCallback((selectedFilter) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (selectedFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        range: 'daily',
        periodDays: 1,
      };
    }

    if (selectedFilter === 'last30') {
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        range: 'monthly',
        periodDays: 30,
      };
    }

    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      range: 'weekly',
      periodDays: 7,
    };
  }, []);

  const toIsoDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const toCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const calculateGrowth = (orders, periodDays, endDate) => {
    const end = new Date(endDate);
    const currentStart = new Date(end);
    currentStart.setDate(end.getDate() - (periodDays - 1));
    currentStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - (periodDays - 1));
    previousStart.setHours(0, 0, 0, 0);

    const deliveredRevenue = (item) => {
      const status = String(item.orderStatus || item.status || '').toLowerCase();
      if (status !== 'delivered' && status !== 'completed') return 0;
      return Number(item.totalAmount || 0);
    };

    const currentRevenue = (orders || []).reduce((sum, item) => {
      const createdAt = new Date(item.createdAt);
      if (Number.isNaN(createdAt.getTime())) return sum;
      if (createdAt >= currentStart && createdAt <= end) {
        return sum + deliveredRevenue(item);
      }
      return sum;
    }, 0);

    const previousRevenue = (orders || []).reduce((sum, item) => {
      const createdAt = new Date(item.createdAt);
      if (Number.isNaN(createdAt.getTime())) return sum;
      if (createdAt >= previousStart && createdAt <= previousEnd) {
        return sum + deliveredRevenue(item);
      }
      return sum;
    }, 0);

    if (previousRevenue <= 0) {
      return currentRevenue > 0 ? 100 : 0;
    }

    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  };

  const buildPaymentSplitText = (paymentSummary) => {
    const cod = Number(paymentSummary?.codPayments || 0);
    const online = Number(paymentSummary?.onlinePayments || 0);
    return `COD: ${cod} | Online: ${online}`;
  };

  const fetchDashboardData = useCallback(
    async ({ isRefresh = false, showRefreshToast = false } = {}) => {
      const { start, end, range, periodDays } = getDateWindow(filter);
      const params = {
        dateFrom: toIsoDate(start),
        dateTo: toIsoDate(end),
        range,
      };

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [salesRes, stockRes, customersRes, paymentsRes, ordersRes, refundStatsRes] = await Promise.all([
          api.get('/admin/reports/sales', { params }),
          api.get('/admin/reports/stock', { params }),
          api.get('/admin/reports/customers', { params }),
          api.get('/admin/reports/payments', { params }),
          api.get('/admin/reports/orders', { params }),
          api.get('/refunds/stats'),
        ]);

        const sales = salesRes.data || {};
        const stock = stockRes.data || {};
        const customers = customersRes.data || {};
        const payments = paymentsRes.data || {};
        const orders = ordersRes.data || {};
        const refundStats = refundStatsRes.data || {};

        const salesData = sales.data || [];
        const salesSummary = sales.summary || {};
        const stockSummary = stock.summary || {};
        const customerSummary = customers.summary || {};
        const paymentSummary = payments.summary || {};
        const orderSummary = orders.summary || {};
        const refundSummary = refundStats.stats || {};

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const newCustomersThisWeek = (customers.data || []).filter((item) => {
          const createdAt = new Date(item.createdAt);
          return !Number.isNaN(createdAt.getTime()) && createdAt >= weekStart;
        }).length;

        const deliveredSalesToday = salesData
          .filter((item) => {
            const status = String(item.orderStatus || item.status || '').toLowerCase();
            if (status !== 'delivered' && status !== 'completed') return false;
            const createdAt = new Date(item.createdAt);
            return (
              !Number.isNaN(createdAt.getTime()) &&
              createdAt.toDateString() === now.toDateString()
            );
          })
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

        const deliveredSalesThisMonth = salesData
          .filter((item) => {
            const status = String(item.orderStatus || item.status || '').toLowerCase();
            if (status !== 'delivered' && status !== 'completed') return false;
            const createdAt = new Date(item.createdAt);
            return (
              !Number.isNaN(createdAt.getTime()) &&
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

        const growthPercent = calculateGrowth(salesData, periodDays, end);

        const salesChartData = (sales.chart?.labels || []).map((label, index) => ({
          label,
          value: Number(sales.chart?.data?.[index] || 0),
        }));

        const ordersStatusChartData = [
          { label: 'Pending', value: Number(orderSummary.pending || 0) },
          { label: 'Delivered', value: Number(orderSummary.delivered || 0) },
          { label: 'Cancelled', value: Number(orderSummary.cancelled || 0) },
        ];

        const paymentMethodsChartData = [
          { label: 'COD', value: Number(paymentSummary.codPayments || 0) },
          { label: 'Online', value: Number(paymentSummary.onlinePayments || 0) },
        ];

        const cards = [
          {
            id: 'sales',
            title: 'Sales Report',
            icon: '💰',
            path: '/admin/reports/sales',
            metric: toCurrency(salesSummary.totalRevenue),
            details: `Daily: ${toCurrency(deliveredSalesToday)} | Monthly: ${toCurrency(deliveredSalesThisMonth)}`,
            highlight: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}% growth`,
            tint: 'sales',
          },
          {
            id: 'stock',
            title: 'Stock Report',
            icon: '📦',
            path: '/admin/reports/stock',
            metric: `${Number(stockSummary.lowStock || 0)} low stock`,
            details: `Out of stock: ${Number(stockSummary.outOfStock || 0)}`,
            highlight: `${Number(stockSummary.totalProducts || 0)} total products`,
            tint: 'stock',
          },
          {
            id: 'customers',
            title: 'Customer Report',
            icon: '👥',
            path: '/admin/reports/customers',
            metric: `${Number(customerSummary.totalCustomers || 0)} customers`,
            details: `New this week: ${newCustomersThisWeek}`,
            highlight: `${Number(customerSummary.activeCustomers || 0)} active`,
            tint: 'customers',
          },
          {
            id: 'payments',
            title: 'Payment Report',
            icon: '💳',
            path: '/admin/reports/payments',
            metric: `${Number(paymentSummary.totalTransactions || 0)} transactions`,
            details: buildPaymentSplitText(paymentSummary),
            highlight: `Amount: ${toCurrency(paymentSummary.totalAmount)}`,
            tint: 'payments',
          },
          {
            id: 'orders',
            title: 'Order Report',
            icon: '📋',
            path: '/admin/reports/orders',
            metric: `${Number(orderSummary.totalOrders || 0)} orders`,
            details: `Pending: ${Number(orderSummary.pending || 0)} | Delivered: ${Number(orderSummary.delivered || 0)}`,
            highlight: `Cancelled: ${Number(orderSummary.cancelled || 0)}`,
            tint: 'orders',
          },
        ];

        setDashboardData({
          cards,
          chartData: {
            sales: salesChartData,
            orders: ordersStatusChartData,
            payments: paymentMethodsChartData,
          },
          summaries: {
            totalRevenue: Number(salesSummary.totalRevenue || 0),
            totalOrders: Number(orderSummary.totalOrders || 0),
            totalCustomers: Number(customerSummary.totalCustomers || 0),
            totalRefunds: Number(refundSummary.totalRefundAmount || 0),
          },
          totals: {
            salesRows: salesData.length,
            stockRows: (stock.data || []).length,
            customerRows: (customers.data || []).length,
            paymentRows: (payments.data || []).length,
            orderRows: (orders.data || []).length,
          },
        });

        if (showRefreshToast) {
          success('Reports updated successfully');
        }
      } catch (err) {
        console.error('Failed to fetch reports dashboard:', err);
        error(err.response?.data?.message || 'Failed to load reports dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, getDateWindow, success, error]
  );

  const handleRefresh = () => {
    fetchDashboardData({ isRefresh: true, showRefreshToast: true });
  };

  const handleNavigateToReport = (path) => navigate(path);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isEmpty = useMemo(() => {
    if (!dashboardData?.totals) return false;
    const { salesRows, stockRows, customerRows, paymentRows, orderRows } = dashboardData.totals;
    return salesRows + stockRows + customerRows + paymentRows + orderRows === 0;
  }, [dashboardData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-reports">
          <div className="reports-main-header skeleton-block" />
          <div className="summary-grid">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="summary-card skeleton-card" />
            ))}
          </div>
          <div className="report-categories-grid">
            {[1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="report-category-card skeleton-card report-card-skeleton" />
            ))}
          </div>
          <div className="chart-grid">
            {[1, 2, 3].map((key) => (
              <div key={key} className="chart-card skeleton-card" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-reports">
        <div className="reports-main-header">
          <div className="header-left">
            <h1>📊 Reports Dashboard</h1>
            <p className="subtitle">Real-time business intelligence with dynamic filters and chart analytics</p>
          </div>
          <div className="reports-header-actions">
            <select
              className="reports-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={refreshing}
            >
              <option value="today">Today</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
            </select>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <span className="btn-spinner" /> : <span>↻</span>}
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card revenue">
            <p>Total Revenue</p>
            <h3>{toCurrency(dashboardData?.summaries?.totalRevenue)}</h3>
          </div>
          <div className="summary-card orders">
            <p>Total Orders</p>
            <h3>{dashboardData?.summaries?.totalOrders || 0}</h3>
          </div>
          <div className="summary-card customers">
            <p>Total Customers</p>
            <h3>{dashboardData?.summaries?.totalCustomers || 0}</h3>
          </div>
          <div className="summary-card refunds">
            <p>Total Refunds</p>
            <h3>{toCurrency(dashboardData?.summaries?.totalRefunds)}</h3>
          </div>
        </div>

        {isEmpty ? (
          <div className="empty-state">No data available</div>
        ) : (
          <>
            <div className="report-categories-section">
              <h2 className="section-title">Live Report Cards</h2>
              <div className="report-categories-grid">
                {(dashboardData?.cards || []).map((category) => (
                  <div
                    key={category.id}
                    className={`report-category-card tint-${category.tint}`}
                    onClick={() => handleNavigateToReport(category.path)}
                  >
                    <div className="category-icon-wrapper">
                      <span className="category-icon">{category.icon}</span>
                    </div>
                    <div className="category-content">
                      <h3 className="category-title">{category.title}</h3>
                      <p className="category-metric">{category.metric}</p>
                      <p className="category-description">{category.details}</p>
                      <p className="category-highlight">{category.highlight}</p>
                    </div>
                    <div className="category-arrow">→</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <ModernReportChart
                  type="line"
                  data={dashboardData?.chartData?.sales || []}
                  xKey="label"
                  valueKey="value"
                  title="Sales Graph"
                  description="Revenue trend based on selected filter"
                  valuePrefix="₹"
                  showArea
                  showPeakLow
                />
              </div>

              <div className="chart-card">
                <ModernReportChart
                  type="pie"
                  data={dashboardData?.chartData?.orders || []}
                  xKey="label"
                  valueKey="value"
                  title="Orders Status"
                  description="Pending vs delivered vs cancelled"
                  colors={['#f59e0b', '#10b981', '#ef4444']}
                />
              </div>

              <div className="chart-card">
                <ModernReportChart
                  type="bar"
                  data={dashboardData?.chartData?.payments || []}
                  xKey="label"
                  valueKey="value"
                  title="Payment Methods"
                  description="COD vs online split"
                  valueSuffix=" txns"
                  colors={['#0ea5e9', '#8b5cf6']}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
