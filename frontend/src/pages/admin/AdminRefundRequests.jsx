import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './AdminRefundRequests.css';

const REFUND_STATUS_OPTIONS = ['all', 'pending', 'processing', 'approved', 'rejected', 'completed'];

const RefundStatusBadge = ({ status }) => {
  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
  };

  const cssMap = {
    pending: 'rr-status-new',
    processing: 'rr-status-in-progress',
    approved: 'rr-status-approved',
    rejected: 'rr-status-rejected',
    completed: 'rr-status-completed',
  };

  return (
    <span className={`rr-status-badge ${cssMap[status] || 'rr-status-new'}`}>
      {labels[status] || String(status || 'Pending')}
    </span>
  );
};

const AdminRefundRequests = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('processing');
  const [actionLoading, setActionLoading] = useState('');
  const [replySending, setReplySending] = useState(false);

  const { loading, run } = useAdminLoader();
  const { success, error: toastError } = useToast();

  const fetchRefunds = useCallback(async () => {
    try {
      const { data } = await API.get('/refunds?source=order_cancellation');
      if (data.success) {
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error('Failed to fetch refund requests:', err);
      toastError('Failed to load refund requests.');
    }
  }, [toastError]);

  useEffect(() => {
    run(fetchRefunds);
  }, [run, fetchRefunds]);

  useEffect(() => {
    let next = [...refunds];

    if (statusFilter !== 'all') {
      next = next.filter((item) => item.refundStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      next = next.filter((item) => {
        const orderNumber = item.order?.orderNumber || '';
        const name = item.user?.name || '';
        const email = item.user?.email || '';
        const reason = item.cancelReason || item.reason || '';
        const message = item.userMessage || '';

        return (
          orderNumber.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          reason.toLowerCase().includes(q) ||
          message.toLowerCase().includes(q)
        );
      });
    }

    setFilteredRefunds(next);
  }, [refunds, statusFilter, searchQuery]);

  const pendingCount = refunds.filter((item) => ['pending', 'processing'].includes(item.refundStatus)).length;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getPaymentLabel = (refund) => {
    const method = refund.paymentMethod || refund.order?.paymentMethod || '';
    if (!method) return 'ONLINE';
    const normalized = String(method).toLowerCase();
    if (normalized === 'cash on delivery' || normalized === 'cod') return 'COD';
    return 'ONLINE';
  };

  const handleUpdateStatus = async (refundId, nextStatus) => {
    setActionLoading(`${refundId}-${nextStatus}`);
    try {
      const { data } = await API.put(`/refunds/${refundId}`, { refundStatus: nextStatus });
      if (data.success) {
        setRefunds((prev) =>
          prev.map((item) => (item._id === refundId ? { ...item, refundStatus: nextStatus } : item))
        );

        if (selectedRefund?._id === refundId) {
          setSelectedRefund((prev) => ({ ...prev, refundStatus: nextStatus }));
        }

        if (nextStatus === 'approved') {
          success('Refund processed successfully');
        } else {
          success('Refund status updated successfully');
        }
      }
    } catch (err) {
      toastError('Failed to update refund status.');
    } finally {
      setActionLoading('');
    }
  };

  const openReplyModal = (refund) => {
    setReplyModal(refund);
    setReplyText('');
    setReplyStatus(refund.refundStatus === 'pending' ? 'processing' : refund.refundStatus || 'processing');
  };

  const closeReplyModal = () => {
    setReplyModal(null);
    setReplyText('');
    setReplyStatus('processing');
  };

  const handleSendReply = async () => {
    if (!replyModal || !replyText.trim()) return;

    setReplySending(true);
    try {
      const { data } = await API.post(`/refunds/${replyModal._id}/reply`, {
        replyMessage: replyText.trim(),
        newStatus: replyStatus,
      });

      if (data.success) {
        setRefunds((prev) =>
          prev.map((item) =>
            item._id === replyModal._id
              ? {
                  ...item,
                  refundStatus: replyStatus,
                  adminReply: replyText.trim(),
                  adminReplyAt: new Date().toISOString(),
                }
              : item
          )
        );
        success('Reply sent to user successfully');
        closeReplyModal();
      }
    } catch (err) {
      toastError('Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="rr-page">
        <div className="rr-header">
          <div className="rr-header-left">
            <h1 className="rr-title">
              Refund Requests
              {pendingCount > 0 && <span className="rr-pending-badge">{pendingCount} pending</span>}
            </h1>
            <p className="rr-subtitle">Order cancellation refund handling and admin responses</p>
          </div>

          <div className="rr-header-stats">
            <div className="rr-stat-card">
              <span className="rr-stat-count">{refunds.length}</span>
              <span className="rr-stat-label">Total</span>
            </div>
            <div className="rr-stat-card rr-stat-pending">
              <span className="rr-stat-count">{refunds.filter((item) => item.refundStatus === 'pending').length}</span>
              <span className="rr-stat-label">Pending</span>
            </div>
            <div className="rr-stat-card rr-stat-progress">
              <span className="rr-stat-count">{refunds.filter((item) => item.refundStatus === 'processing').length}</span>
              <span className="rr-stat-label">Processing</span>
            </div>
            <div className="rr-stat-card rr-stat-approved">
              <span className="rr-stat-count">{refunds.filter((item) => item.refundStatus === 'approved' || item.refundStatus === 'completed').length}</span>
              <span className="rr-stat-label">Approved</span>
            </div>
          </div>
        </div>

        <div className="rr-filters">
          <div className="rr-search-box">
            <span className="rr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by order ID, customer, reason or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rr-search-input"
            />
            {searchQuery && (
              <button className="rr-search-clear" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="rr-status-tabs">
            {REFUND_STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                className={`rr-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredRefunds.length === 0 ? (
          <div className="rr-empty">
            <span className="rr-empty-icon">📭</span>
            <p>No refund requests found</p>
          </div>
        ) : (
          <div className="rr-table-wrapper">
            <table className="rr-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((refund) => {
                  const isHighlighted = ['pending', 'processing'].includes(refund.refundStatus);
                  const primaryProduct = refund.order?.items?.[0]?.name || 'N/A';
                  const moreItemsCount = Math.max((refund.order?.items?.length || 1) - 1, 0);
                  return (
                    <tr key={refund._id} className={isHighlighted ? 'rr-row-new rr-row-refund-highlight' : ''}>
                      <td>
                        <span className="rr-order-id">#{refund.order?.orderNumber || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="rr-customer">
                          <span className="rr-customer-name">{refund.user?.name || 'Customer'}</span>
                          <span className="rr-customer-email">{refund.user?.email || 'No email'}</span>
                          <span className="rr-customer-email">{refund.user?.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rr-product-name">{primaryProduct}</span>
                        {moreItemsCount > 0 && (
                          <span className="rr-product-more"> +{moreItemsCount} more</span>
                        )}
                      </td>
                      <td>{refund.cancelReason || refund.reason || 'N/A'}</td>
                      <td>
                        <div className="rr-payment-cell">
                          <span className="rr-paid-badge">{getPaymentLabel(refund)}</span>
                          <span className="rr-payment-text">{refund.order?.paymentStatus === 'paid' ? 'Already Paid' : 'Pending'}</span>
                        </div>
                      </td>
                      <td>₹{Number(refund.amount || refund.order?.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td>{formatDate(refund.createdAt)}</td>
                      <td>
                        <RefundStatusBadge status={refund.refundStatus} />
                      </td>
                      <td>
                        <div className="rr-actions">
                          <button className="rr-btn rr-btn-view" onClick={() => setSelectedRefund(refund)}>
                            👁 View
                          </button>
                          <button className="rr-btn rr-btn-reply" onClick={() => openReplyModal(refund)}>
                            💬 Reply
                          </button>
                          {!['approved', 'completed'].includes(refund.refundStatus) && (
                            <button
                              className="rr-btn rr-btn-approve"
                              disabled={actionLoading === `${refund._id}-approved`}
                              onClick={() => handleUpdateStatus(refund._id, 'approved')}
                            >
                              {actionLoading === `${refund._id}-approved` ? '...' : '✔ Approve'}
                            </button>
                          )}
                          {refund.refundStatus !== 'rejected' && (
                            <button
                              className="rr-btn rr-btn-reject"
                              disabled={actionLoading === `${refund._id}-rejected`}
                              onClick={() => handleUpdateStatus(refund._id, 'rejected')}
                            >
                              {actionLoading === `${refund._id}-rejected` ? '...' : '✕ Reject'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedRefund && (
          <div className="rr-modal-overlay" onClick={() => setSelectedRefund(null)}>
            <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Refund Request Details</h2>
                  <span className="rr-modal-id">Order #{selectedRefund.order?.orderNumber || 'N/A'}</span>
                </div>
                <button className="rr-modal-close" onClick={() => setSelectedRefund(null)}>✕</button>
              </div>
              <div className="rr-modal-body">
                <div className="rr-detail-grid">
                  <div className="rr-detail-row"><span className="rr-detail-label">Customer</span><span className="rr-detail-value">{selectedRefund.user?.name || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Email</span><span className="rr-detail-value">{selectedRefund.user?.email || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Phone</span><span className="rr-detail-value">{selectedRefund.user?.phone || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Product</span><span className="rr-detail-value">{selectedRefund.order?.items?.[0]?.name || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Reason</span><span className="rr-detail-value">{selectedRefund.cancelReason || selectedRefund.reason || 'N/A'}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Payment</span><span className="rr-detail-value"><span className="rr-paid-badge">{getPaymentLabel(selectedRefund)}</span></span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Amount</span><span className="rr-detail-value">₹{Number(selectedRefund.amount || selectedRefund.order?.totalAmount || 0).toLocaleString('en-IN')}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Submitted</span><span className="rr-detail-value">{formatDate(selectedRefund.createdAt)}</span></div>
                  <div className="rr-detail-row"><span className="rr-detail-label">Status</span><span className="rr-detail-value"><RefundStatusBadge status={selectedRefund.refundStatus} /></span></div>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">User Message</span>
                  <p className="rr-message-text">{selectedRefund.userMessage || 'No message provided.'}</p>
                </div>

                {selectedRefund.adminReply && (
                  <div className="rr-detail-message">
                    <span className="rr-detail-label">Admin Reply</span>
                    <p className="rr-message-text">{selectedRefund.adminReply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {replyModal && (
          <div className="rr-modal-overlay" onClick={closeReplyModal}>
            <div className="rr-modal rr-reply-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rr-modal-header">
                <div>
                  <h2 className="rr-modal-title">Reply to User</h2>
                  <span className="rr-modal-id">Order #{replyModal.order?.orderNumber || 'N/A'}</span>
                </div>
                <button className="rr-modal-close" onClick={closeReplyModal}>✕</button>
              </div>
              <div className="rr-modal-body">
                <div className="rr-reply-status-row">
                  <span className="rr-detail-label">Set Status</span>
                  <select className="rr-reply-status-select" value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="rr-detail-message">
                  <span className="rr-detail-label">User Message</span>
                  <p className="rr-message-text">{replyModal.userMessage || 'No message provided.'}</p>
                </div>

                <div className="rr-reply-compose">
                  <span className="rr-detail-label">Reply Message</span>
                  <textarea
                    className="rr-notes-textarea rr-reply-textarea"
                    rows={5}
                    placeholder="Type your reply for this refund request..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>

                <div className="rr-reply-actions">
                  <button className="rr-btn rr-btn-send-reply" onClick={handleSendReply} disabled={replySending || !replyText.trim()}>
                    {replySending ? 'Sending...' : 'Send Reply'}
                  </button>
                  <button className="rr-btn rr-btn-cancel" onClick={closeReplyModal}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRefundRequests;
