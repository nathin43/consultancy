import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import './AdminReports.css';

const AdminReports = () => {
  const { admin } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    searchUser: '',
    reportType: '',
    reportStatus: '',
    startDate: '',
    endDate: ''
  });
  const [draftFilters, setDraftFilters] = useState({
    searchUser: '',
    reportType: '',
    reportStatus: '',
    startDate: '',
    endDate: ''
  });
  const [trendStats, setTrendStats] = useState({
    total: { current: 0, previous: 0 },
    generated: { current: 0, previous: 0 },
    downloaded: { current: 0, previous: 0 },
    thisMonth: { current: 0, previous: 0 }
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });

  // Fetch all reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.currentPage);
      if (filters.searchUser) queryParams.append('searchUser', filters.searchUser);
      if (filters.reportType) queryParams.append('reportType', filters.reportType);
      if (filters.reportStatus) queryParams.append('reportStatus', filters.reportStatus);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await api.get(`/reports?${queryParams.toString()}`);
      if (response.data.success) {
        setReports(response.data.reports);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1
        });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access Denied: Only Main Admin can view all reports');
      } else {
        toast.error('Failed to fetch reports');
      }
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/stats/dashboard');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.currentPage, filters]);

  useEffect(() => {
    fetchStats();
    fetchTrendStats();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDraftFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    const cleared = {
      searchUser: '',
      reportType: '',
      reportStatus: '',
      startDate: '',
      endDate: ''
    };
    setDraftFilters(cleared);
    setFilters(cleared);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // View report details
  const handleViewDetails = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      if (response.data.success) {
        setSelectedReport(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch report details');
    }
  };

  // Download report
  const handleDownloadReport = async (reportId) => {
    try {
      const response = await api.put(`/reports/${reportId}/download`);
      if (response.data.success) {
        toast.success('Report downloaded successfully');
        // Refresh reports to show updated download count
        fetchReports();
      }
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Generated': '#4CAF50',
      'Downloaded': '#2196F3',
      'Archived': '#9E9E9E'
    };
    return colors[status] || '#666';
  };

  // Get report type badge color
  const getTypeColor = (type) => {
    const colors = {
      'Order Report': '#0066cc',
      'Payment Report': '#FF9800',
      'Invoice': '#9C27B0'
    };
    return colors[type] || '#666';
  };

  const getMonthRange = (offset = 0) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const getReportCount = async (params) => {
    const query = new URLSearchParams({ page: 1, limit: 1, ...params });
    const response = await api.get(`/reports?${query.toString()}`);
    return response.data?.totalReports || 0;
  };

  const fetchTrendStats = async () => {
    try {
      const { start: thisStart, end: thisEnd } = getMonthRange(0);
      const { start: lastStart, end: lastEnd } = getMonthRange(-1);

      const [
        lastTotal,
        lastGenerated,
        lastDownloaded,
        thisTotal,
        thisGenerated,
        thisDownloaded
      ] = await Promise.all([
        getReportCount({ startDate: lastStart.toISOString(), endDate: lastEnd.toISOString() }),
        getReportCount({ status: 'Generated', startDate: lastStart.toISOString(), endDate: lastEnd.toISOString() }),
        getReportCount({ status: 'Downloaded', startDate: lastStart.toISOString(), endDate: lastEnd.toISOString() }),
        getReportCount({ startDate: thisStart.toISOString(), endDate: thisEnd.toISOString() }),
        getReportCount({ status: 'Generated', startDate: thisStart.toISOString(), endDate: thisEnd.toISOString() }),
        getReportCount({ status: 'Downloaded', startDate: thisStart.toISOString(), endDate: thisEnd.toISOString() })
      ]);

      setTrendStats({
        total: { current: thisTotal, previous: lastTotal },
        generated: { current: thisGenerated, previous: lastGenerated },
        downloaded: { current: thisDownloaded, previous: lastDownloaded },
        thisMonth: { current: thisTotal, previous: lastTotal }
      });
    } catch (error) {
      console.error('Error fetching trend stats:', error);
    }
  };

  const getTrendMeta = (current, previous) => {
    if (!previous) {
      return {
        direction: current > 0 ? 'up' : 'neutral',
        label: current > 0 ? '100%' : '0%'
      };
    }
    const diff = ((current - previous) / previous) * 100;
    return {
      direction: diff >= 0 ? 'up' : 'down',
      label: `${Math.abs(diff).toFixed(1)}%`
    };
  };

  const formatReportId = (id) => (id ? id.slice(-8).toUpperCase() : 'N/A');

  const hasActiveFilters = Object.values(draftFilters).some(Boolean);

  const totalTrend = getTrendMeta(trendStats.total.current, trendStats.total.previous);
  const generatedTrend = getTrendMeta(trendStats.generated.current, trendStats.generated.previous);
  const downloadedTrend = getTrendMeta(trendStats.downloaded.current, trendStats.downloaded.previous);
  const thisMonthTrend = getTrendMeta(trendStats.thisMonth.current, trendStats.thisMonth.previous);

  return (
    <AdminLayout>
      <div className="admin-reports-container">
        {/* Header */}
        <div className="reports-header">
          <h1>📊 Reports Management</h1>
          <p>View, filter, and download all customer reports</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="reports-stats">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Total Reports</div>
                <div className="stat-value">{stats.totalReports || 0}</div>
                <div className={`stat-trend ${totalTrend.direction}`}>
                  <span className="trend-arrow">{totalTrend.direction === 'down' ? '↓' : '↑'}</span>
                  <span>{totalTrend.label} vs last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Generated Reports</div>
                <div className="stat-value">{stats.generated || 0}</div>
                <div className={`stat-trend ${generatedTrend.direction}`}>
                  <span className="trend-arrow">{generatedTrend.direction === 'down' ? '↓' : '↑'}</span>
                  <span>{generatedTrend.label} vs last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⬇️</div>
              <div className="stat-content">
                <div className="stat-label">Downloaded Reports</div>
                <div className="stat-value">{stats.downloaded || 0}</div>
                <div className={`stat-trend ${downloadedTrend.direction}`}>
                  <span className="trend-arrow">{downloadedTrend.direction === 'down' ? '↓' : '↑'}</span>
                  <span>{downloadedTrend.label} vs last month</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-label">This Month Reports</div>
                <div className="stat-value">{stats.thisMonth || 0}</div>
                <div className={`stat-trend ${thisMonthTrend.direction}`}>
                  <span className="trend-arrow">{thisMonthTrend.direction === 'down' ? '↓' : '↑'}</span>
                  <span>{thisMonthTrend.label} vs last month</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="reports-filters">
          <div className={`filter-group ${draftFilters.searchUser ? 'active' : ''}`}>
            <label>Search User Email</label>
            <input
              type="text"
              name="searchUser"
              placeholder="Enter user email..."
              value={draftFilters.searchUser}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className={`filter-group ${draftFilters.reportType ? 'active' : ''}`}>
            <label>Report Type</label>
            <select
              name="reportType"
              value={draftFilters.reportType}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="Order Report">Order Report</option>
              <option value="Payment Report">Payment Report</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>

          <div className={`filter-group ${draftFilters.reportStatus ? 'active' : ''}`}>
            <label>Report Status</label>
            <select
              name="reportStatus"
              value={draftFilters.reportStatus}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Generated">Generated</option>
              <option value="Downloaded">Downloaded</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className={`filter-group ${draftFilters.startDate ? 'active' : ''}`}>
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={draftFilters.startDate}
              onChange={handleFilterChange}
              className="filter-input date-input"
              placeholder="YYYY-MM-DD"
            />
            <small className="filter-hint">YYYY-MM-DD</small>
          </div>

          <div className={`filter-group ${draftFilters.endDate ? 'active' : ''}`}>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={draftFilters.endDate}
              onChange={handleFilterChange}
              className="filter-input date-input"
              placeholder="YYYY-MM-DD"
            />
            <small className="filter-hint">YYYY-MM-DD</small>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="filter-btn clear-btn"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="filter-btn apply-btn"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="reports-table-container">
          {loading ? (
            <div className="loading-skeleton">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton-row">
                  <div className="skeleton-cell id"></div>
                  <div className="skeleton-cell user"></div>
                  <div className="skeleton-cell type"></div>
                  <div className="skeleton-cell order"></div>
                  <div className="skeleton-cell amount"></div>
                  <div className="skeleton-cell status"></div>
                  <div className="skeleton-cell date"></div>
                  <div className="skeleton-cell actions"></div>
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <>
              <div className="reports-table-scroll">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>User Name / Email</th>
                      <th>Report Type</th>
                      <th>Order ID</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report._id} className="report-row">
                        <td data-label="Report ID" className="report-id" title={report._id}>
                          {formatReportId(report._id)}
                        </td>
                        <td data-label="User" className="user-cell">
                          <div className="user-name">{report.userName || report.user?.name || 'Unknown User'}</div>
                          <div className="user-email">{report.userEmail || report.user?.email || 'N/A'}</div>
                        </td>
                        <td data-label="Report Type">
                          <span
                            className="badge type-badge"
                            style={{ backgroundColor: getTypeColor(report.reportType) }}
                          >
                            {report.reportType}
                          </span>
                        </td>
                        <td data-label="Order ID" className="order-id">
                          {report.order?.orderNumber || report.orderNumber || 'N/A'}
                        </td>
                        <td data-label="Total Amount" className="amount">
                          ₹{report.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                        <td data-label="Status">
                          <span
                            className="status-pill"
                            style={{ backgroundColor: getStatusColor(report.reportStatus) }}
                          >
                            {report.reportStatus}
                          </span>
                        </td>
                        <td data-label="Created Date" className="date">
                          {formatDate(report.reportGeneratedAt)}
                        </td>
                        <td data-label="Actions" className="actions">
                          <button
                            onClick={() => handleViewDetails(report._id)}
                            className="action-btn view-btn"
                            title="View Report"
                            aria-label="View report"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 5c5.5 0 9.5 4.7 10.5 6.2a1 1 0 0 1 0 1.6C21.5 14.3 17.5 19 12 19S2.5 14.3 1.5 12.8a1 1 0 0 1 0-1.6C2.5 9.7 6.5 5 12 5Zm0 3.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" fill="currentColor" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadReport(report._id)}
                            className="action-btn download-btn"
                            title="Download Report"
                            aria-label="Download report"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.29a1 1 0 1 1 1.4 1.42l-4.01 4a1 1 0 0 1-1.4 0l-4.01-4a1 1 0 1 1 1.4-1.42L11 13.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill="currentColor" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration">
                <svg viewBox="0 0 120 90" aria-hidden="true">
                  <rect x="8" y="18" width="104" height="64" rx="12" fill="#f1f5f9" />
                  <rect x="20" y="30" width="80" height="8" rx="4" fill="#cbd5e1" />
                  <rect x="20" y="46" width="60" height="8" rx="4" fill="#dbe3ec" />
                  <rect x="20" y="62" width="70" height="8" rx="4" fill="#cbd5e1" />
                  <circle cx="96" cy="26" r="10" fill="#e2e8f0" />
                  <path d="M92 26h8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p>No reports available yet</p>
              <small>Try changing filters or broaden the date range.</small>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedReport && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Report Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {/* User Info */}
                <div className="detail-section">
                  <h3>User Information</h3>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedReport.user?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{selectedReport.user?.email}</span>
                  </div>
                </div>

                {/* Order Info */}
                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-row">
                    <span className="label">Order Number:</span>
                    <span className="value">{selectedReport.order?.orderNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Order Status:</span>
                    <span className="value">{selectedReport.order?.orderStatus}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Order Date:</span>
                    <span className="value">{formatDate(selectedReport.order?.createdAt)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="detail-section">
                  <h3>Items</h3>
                  <div className="items-list">
                    {selectedReport.items?.map((item, index) => (
                      <div key={index} className="item">
                        <span>{item.productName}</span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                        <span className="item-price">₹{item.itemTotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="detail-section">
                  <h3>Amount Summary</h3>
                  <div className="detail-row">
                    <span className="label">Items Total:</span>
                    <span className="value">₹{(selectedReport.items?.reduce((sum, item) => sum + (item.itemTotal || 0), 0) || selectedReport.totalAmount)?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row total">
                    <span className="label">Total Amount:</span>
                    <span className="value">₹{selectedReport.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="detail-section">
                  <h3>Payment Information</h3>
                  <div className="detail-row">
                    <span className="label">Payment Method:</span>
                    <span className="value">{selectedReport.paymentMethod}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Payment Status:</span>
                    <span className="value">{selectedReport.paymentStatus}</span>
                  </div>
                  {selectedReport.transactionId && (
                    <div className="detail-row">
                      <span className="label">Transaction ID:</span>
                      <span className="value">{selectedReport.transactionId}</span>
                    </div>
                  )}
                </div>

                {/* Report Info */}
                <div className="detail-section">
                  <h3>Report Information</h3>
                  <div className="detail-row">
                    <span className="label">Report Type:</span>
                    <span className="value">{selectedReport.reportType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Report Status:</span>
                    <span className="value">{selectedReport.reportStatus}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Generated At:</span>
                    <span className="value">{formatDate(selectedReport.reportGeneratedAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Downloads:</span>
                    <span className="value">{selectedReport.downloadCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => handleDownloadReport(selectedReport._id)}
                  className="action-btn download-btn"
                >
                  ⬇️ Download Report
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="close-modal-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
