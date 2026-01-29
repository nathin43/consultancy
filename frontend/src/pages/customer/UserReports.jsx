import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import './UserReports.css';

/**
 * User Reports Component
 * Displays user's generated reports with download capability
 */
const UserReports = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    reportType: '',
    reportStatus: '',
    startDate: '',
    endDate: ''
  });

  // Fetch user's reports
  const fetchUserReports = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.reportType) queryParams.append('type', filters.reportType);
      if (filters.reportStatus) queryParams.append('status', filters.reportStatus);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await api.get(`/reports/user/${user._id}?${queryParams.toString()}`);
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserReports();
    }
  }, [user?._id, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // View report details
  const handleViewDetails = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      if (response.data.success) {
        setSelectedReport(response.data.report);
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
        // Refresh reports
        fetchUserReports();
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
    <div className="user-reports-section">
      <div className="reports-header">
        <h3>📊 My Reports</h3>
        <p>View and download your order reports and invoices</p>
      </div>

      {/* Filters */}
      <div className="reports-filters">
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
          <label>Status</label>
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
          <label>From Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
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
            <p>Loading your reports...</p>
          </div>
        ) : reports.length > 0 ? (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Report Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Generated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id} className="report-row">
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
        ) : (
          <div className="empty-state">
            <p>📭 No reports yet</p>
            <small>Your generated reports will appear here</small>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Details</h3>
              <button
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Order Info */}
              <div className="detail-section">
                <h4>Order Information</h4>
                <div className="detail-row">
                  <span className="label">Order Number:</span>
                  <span className="value">{selectedReport.order?.orderNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Order Date:</span>
                  <span className="value">{formatDate(selectedReport.order?.createdAt)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="detail-section">
                <h4>Items Ordered</h4>
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
                <h4>Amount Summary</h4>
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
                <h4>Payment Details</h4>
                <div className="detail-row">
                  <span className="label">Method:</span>
                  <span className="value">{selectedReport.paymentMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">{selectedReport.paymentStatus}</span>
                </div>
              </div>

              {/* Report Info */}
              <div className="detail-section">
                <h4>Report Information</h4>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{selectedReport.reportType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">{selectedReport.reportStatus}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Generated:</span>
                  <span className="value">{formatDate(selectedReport.reportGeneratedAt)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleDownloadReport(selectedReport._id)}
                className="action-btn download-btn"
              >
                ⬇️ Download
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
  );
};

export default UserReports;
