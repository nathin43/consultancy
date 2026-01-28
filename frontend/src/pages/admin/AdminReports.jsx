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
    fetchStats();
  }, [pagination.currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Generated</div>
                <div className="stat-value">{stats.generated || 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⬇️</div>
              <div className="stat-content">
                <div className="stat-label">Downloaded</div>
                <div className="stat-value">{stats.downloaded || 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-label">This Month</div>
                <div className="stat-value">{stats.thisMonth || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="reports-filters">
          <div className="filter-group">
            <label>Search User Email</label>
            <input
              type="text"
              name="searchUser"
              placeholder="Enter user email..."
              value={filters.searchUser}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Report Type</label>
            <select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="Order Report">Order Report</option>
              <option value="Payment Report">Payment Report</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Report Status</label>
            <select
              name="reportStatus"
              value={filters.reportStatus}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Generated">Generated</option>
              <option value="Downloaded">Downloaded</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
        </div>

        {/* Reports Table */}
        <div className="reports-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : reports.length > 0 ? (
            <>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Order ID</th>
                    <th>Report Type</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Downloads</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report._id} className="report-row">
                      <td>{report.user?.email}</td>
                      <td className="order-id">{report.order?.orderNumber || 'N/A'}</td>
                      <td>
                        <span
                          className="badge type-badge"
                          style={{ backgroundColor: getTypeColor(report.reportType) }}
                        >
                          {report.reportType}
                        </span>
                      </td>
                      <td className="amount">₹{report.totalAmount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span
                          className="badge status-badge"
                          style={{ backgroundColor: getStatusColor(report.reportStatus) }}
                        >
                          {report.reportStatus}
                        </span>
                      </td>
                      <td className="downloads">{report.downloadCount || 0}</td>
                      <td className="date">{formatDate(report.reportGeneratedAt)}</td>
                      <td className="actions">
                        <button
                          onClick={() => handleViewDetails(report._id)}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report._id)}
                          className="action-btn download-btn"
                          title="Download Report"
                        >
                          ⬇️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
              <p>📭 No reports found</p>
              <small>Try adjusting your filters</small>
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
                    <span className="label">Subtotal:</span>
                    <span className="value">₹{selectedReport.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tax:</span>
                    <span className="value">₹{selectedReport.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Shipping:</span>
                    <span className="value">₹{selectedReport.shippingCost?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row total">
                    <span className="label">Total:</span>
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
