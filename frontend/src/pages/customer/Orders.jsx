import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';
import { useLoading } from '../../context/LoadingContext';
import API from '../../services/api';
import './Orders.css';

/**
 * Orders Page Component
 * View order history and status with 24-hour cancellation policy
 */
const Orders = () => {
  const cancellationReasonOptions = [
    { label: 'Ordered by mistake', icon: '🛒' },
    { label: 'Found better price', icon: '🏷️' },
    { label: 'Delivery too slow', icon: '🐢' },
    { label: 'Changed mind', icon: '🔄' },
    { label: 'Other', icon: '✍️' }
  ];

  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [refundMap, setRefundMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
    orderNumber: null,
    orderItems: [],
    totalAmount: 0,
    paymentMethod: '',
    paymentStatus: '',
    paymentId: '',
    paidAmount: 0,
    cancelReason: '',
    customCancelReason: '',
    refundMethod: 'original_payment_method',
    bankDetails: '',
    userMessage: '',
    validationError: ''
  });
  const [cancelling, setCancelling] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(!!location.state?.orderSuccess);
  const [dismissingSuccess, setDismissingSuccess] = useState(false);
  const { success, error: showError } = useToast();
  const { showLoader, hideLoader } = useLoading();

  const dismissSuccessOverlay = () => {
    setDismissingSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
      setDismissingSuccess(false);
    }, 420);
  };

  // Auto-dismiss success overlay after 3 seconds
  useEffect(() => {
    if (!showOrderSuccess) return;
    const timer = setTimeout(() => dismissSuccessOverlay(), 3000);
    return () => clearTimeout(timer);
  }, [showOrderSuccess]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const { data } = await API.get('/refunds/my/list');
        const fetchedRefunds = data?.refunds || [];
        const nextRefundMap = {};

        fetchedRefunds.forEach((refund) => {
          if (refund.order && refund.order._id) {
            nextRefundMap[refund.order._id] = refund;
          } else if (typeof refund.order === 'string') {
            nextRefundMap[refund.order] = refund;
          }
        });

        setRefundMap(nextRefundMap);
      } catch (_) {
        // Ignore polling failures silently.
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchOrders = async () => {
    showLoader('Loading orders...');
    setLoading(true);
    try {
      setError('');
      const [orderRes, refundRes] = await Promise.all([
        API.get('/orders/myorders'),
        API.get('/refunds/my/list').catch(() => ({ data: { refunds: [] } }))
      ]);

      const fetchedOrders = orderRes.data?.orders || [];
      const fetchedRefunds = refundRes.data?.refunds || [];
      const nextRefundMap = {};

      fetchedRefunds.forEach((refund) => {
        if (refund.order && refund.order._id) {
          nextRefundMap[refund.order._id] = refund;
        } else if (typeof refund.order === 'string') {
          nextRefundMap[refund.order] = refund;
        }
      });

      setOrders(fetchedOrders);
      setRefundMap(nextRefundMap);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error fetching orders';
      console.error('Error fetching orders:', error);
      setError(errorMsg);
      setOrders([]);
      setRefundMap({});
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  // Check if order is within 24-hour cancellation window
  const isWithinCancellationWindow = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = Date.now();
    const hoursDiff = (currentTime - orderTime) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Get hours remaining for cancellation
  const getHoursRemaining = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = Date.now();
    const hoursDiff = (currentTime - orderTime) / (1000 * 60 * 60);
    const remaining = Math.max(0, 24 - hoursDiff);
    return Math.floor(remaining);
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

  const openCancelModal = (order) => {
    setCancelModal({
      open: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderItems: order.items || [],
      totalAmount: order.totalAmount || order.totalPrice || 0,
      paymentMethod: order.paymentMethod || '',
      paymentStatus: order.paymentStatus || '',
      paymentId:
        order.razorpayPaymentId ||
        order.paymentDetails?.paymentId ||
        order.paymentDetails?.transactionId ||
        order.paymentDetails?.razorpayPaymentId ||
        '',
      paidAmount: order.totalAmount || order.totalPrice || 0,
      cancelReason: '',
      customCancelReason: '',
      refundMethod: 'original_payment_method',
      bankDetails: '',
      userMessage: '',
      validationError: ''
    });
  };

  const closeCancelModal = () => {
    setCancelModal({
      open: false,
      orderId: null,
      orderNumber: null,
      orderItems: [],
      totalAmount: 0,
      paymentMethod: '',
      paymentStatus: '',
      paymentId: '',
      paidAmount: 0,
      cancelReason: '',
      customCancelReason: '',
      refundMethod: 'original_payment_method',
      bankDetails: '',
      userMessage: '',
      validationError: ''
    });
  };

  const paymentMethodLower = (cancelModal.paymentMethod || '').toLowerCase();
  const isCodOrder = paymentMethodLower === 'cash on delivery' || paymentMethodLower === 'cod';
  const isOnlinePaymentOrder = !isCodOrder;

  const getExpectedRefundDate = (createdAt, refundStatus) => {
    const normalizedStatus = String(refundStatus || '').toLowerCase();
    if (normalizedStatus === 'completed') return 'Refund Completed';

    const baseDate = createdAt ? new Date(createdAt) : new Date();
    const expectedDate = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    return expectedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isCancelReasonValid = Boolean(
    cancelModal.cancelReason &&
    (cancelModal.cancelReason !== 'Other' || cancelModal.customCancelReason.trim())
  );

  const handleCancelOrder = async () => {
    const selectedReason = cancelModal.cancelReason?.trim();
    const customReason = cancelModal.customCancelReason?.trim();
    const hasValidReason = selectedReason && (selectedReason !== 'Other' || customReason);

    if (!hasValidReason) {
      setCancelModal((prev) => ({
        ...prev,
        validationError: 'Please select a cancellation reason before cancelling the order.'
      }));
      return;
    }

    setCancelling(true);
    try {
      const payload = {
        cancelReason: cancelModal.cancelReason,
        customCancelReason: cancelModal.customCancelReason,
        userMessage: isOnlinePaymentOrder ? cancelModal.userMessage?.trim() : '',
        refundMethod: isOnlinePaymentOrder ? cancelModal.refundMethod : null,
        bankDetails: isOnlinePaymentOrder && cancelModal.refundMethod === 'bank'
          ? cancelModal.bankDetails?.trim()
          : ''
      };

      const { data } = await API.put(`/orders/${cancelModal.orderId}/cancel`, payload);

      if (isCodOrder) {
        success('Order cancelled');
      } else {
        success('Order cancelled');
        success('Refund request sent to admin');
      }
      closeCancelModal();
      fetchOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="orders-page">
        <div className="container">

          {/* ── Order Success Banner ── */}
          {showOrderSuccess && (
            <div className={`os-overlay${dismissingSuccess ? ' os-overlay--out' : ''}`} onClick={dismissSuccessOverlay}>
              <div className="os-card" onClick={e => e.stopPropagation()}>
                <div className="os-icon-wrap">
                  <div className="os-icon-ring"></div>
                  <div className="os-icon-bg">
                    <svg className="os-check-svg" viewBox="0 0 52 52" fill="none">
                      <circle className="os-check-circle" cx="26" cy="26" r="24" />
                      <path className="os-check-path" d="M14 27l8 8 16-16" />
                    </svg>
                  </div>
                </div>
                <h2 className="os-title">Order Placed Successfully!</h2>
                <p className="os-desc">Your order has been placed and will be processed shortly.</p>
                <div className="os-chips">
                  <span className="os-chip">📦 Processing</span>
                  <span className="os-chip">🚚 Delivery Soon</span>
                  <span className="os-chip">✅ Confirmed</span>
                </div>
                <button className="os-btn" onClick={dismissSuccessOverlay}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                  View My Orders
                  <span className="os-btn__shimmer"></span>
                </button>
                <div className="os-progress">
                  <div className="os-progress__bar"></div>
                </div>
              </div>
            </div>
          )}

          <div className={`os-page-content${showOrderSuccess && !dismissingSuccess ? ' os-page-content--hidden' : ''}`}>
            <div className="orders-header">
              <h1>My Orders</h1>
              <p className="orders-subtitle">Track and manage your order history</p>
            </div>

          {/* Cancellation Policy Notice */}
          <div className="cancellation-policy-banner">
            <div className="policy-icon">ℹ️</div>
            <div className="policy-content">
              <h4>Order Cancellation Policy</h4>
              <p>
                Orders can be cancelled online within <strong>24 hours</strong> of placing the order.
                After 24 hours, please contact our support team for assistance.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? null : orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h2>No orders yet</h2>
              <p>Start shopping to see your orders here</p>
              <Link to="/products" className="btn-shop-now">Browse Products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const isCancellableStatus = ['pending', 'confirmed'].includes((order.orderStatus || '').toLowerCase());
                const canCancel = isCancellableStatus && isWithinCancellationWindow(order.createdAt);
                const hoursRemaining = getHoursRemaining(order.createdAt);
                const refundInfo = refundMap[order._id];
                const orderPaymentMethodLower = String(order.paymentMethod || '').toLowerCase();
                const orderIsCod = orderPaymentMethodLower === 'cash on delivery' || orderPaymentMethodLower === 'cod';
                const isRefundCompleted = ['completed'].includes(String(refundInfo?.refundStatus || '').toLowerCase());

                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div>
                        <h3>Order #{order.orderNumber}</h3>
                        <p className="order-date">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x80?text=Product';
                            }}
                          />
                          <div className="order-item-info">
                            <p className="item-name">{item.name}</p>
                            <p className="item-qty">Quantity: {item.quantity}</p>
                          </div>
                          <div className="item-price">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Items Total:</span>
                        <span>₹{(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString()}</span>
                      </div>
                      <div className="summary-total">
                        <span>Total Amount:</span>
                        <span>₹{order.totalAmount?.toLocaleString() || order.totalPrice?.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="order-footer">
                      <div className="order-details">
                        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                        <p><strong>Payment Status:</strong>
                          <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                          {order.paymentStatus === 'paid' && (
                            <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
                              Already Paid
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Cancellation Section */}
                      <div className="cancellation-section">
                        {canCancel && (
                          <>
                            <div className="cancel-time-remaining">
                              <span className="time-icon">⏰</span>
                              <span>{hoursRemaining > 0 ? `${hoursRemaining}h remaining to cancel` : 'Less than 1 hour to cancel'}</span>
                            </div>
                            <button
                              onClick={() => openCancelModal(order)}
                              className="btn-cancel-order"
                            >
                              Cancel Order
                            </button>
                          </>
                        )}

                        {isCancellableStatus && !canCancel && (
                          <div className="cancellation-expired">
                            <p className="expired-message">
                              Online cancellation is no longer available for this order.
                            </p>
                            <p className="support-info">
                              For cancellation requests after 24 hours, please{' '}
                              <Link to="/contact" className="contact-link">contact our support team</Link>.
                            </p>
                            <div className="support-options">
                              <span>📞 +91-9095399271</span>
                              <span>✉️ manielectricalshop@gmail.com</span>
                            </div>
                          </div>
                        )}

                        {order.orderStatus === 'cancelled' && (
                          <div className="order-cancelled-info">
                            <span className="cancelled-badge">Order Cancelled</span>
                            <button className="btn-cancel-order btn-cancel-order-disabled" disabled>
                              Already Cancelled
                            </button>
                            {order.cancelReason && (
                              <p className="order-cancelled-reason">Reason: {order.cancelReason}</p>
                            )}
                            {order.cancelledAt && (
                              <p className="order-cancelled-date">
                                Cancelled on {new Date(order.cancelledAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                            {!orderIsCod && refundInfo && (
                              <div className="order-refund-details">
                                <h4 className="order-refund-title">Refund Communication</h4>
                                <div className="order-refund-status">
                                  <span className="order-refund-label">Status:</span>
                                  <span
                                    className={`badge badge-${
                                      ['approved', 'completed'].includes(String(refundInfo.refundStatus || '').toLowerCase())
                                        ? 'success'
                                        : String(refundInfo.refundStatus || '').toLowerCase() === 'rejected'
                                          ? 'danger'
                                          : 'warning'
                                    }`}
                                  >
                                    {String(refundInfo.refundStatus || 'pending').toUpperCase()}
                                  </span>
                                </div>
                                <p className="order-refund-row"><strong>Refund Amount:</strong> ₹{Number(refundInfo.amount || order.totalAmount || 0).toLocaleString('en-IN')}</p>
                                <p className="order-refund-row">
                                  <strong>{isRefundCompleted ? 'Completed On:' : 'Expected Date:'}</strong> {getExpectedRefundDate(refundInfo.createdAt, refundInfo.refundStatus)}
                                </p>
                                <p className="order-refund-row"><strong>Your Message:</strong> {refundInfo.userMessage || 'No message provided.'}</p>
                                {refundInfo.adminReply ? (
                                  <div className="order-refund-reply">
                                    <span className="order-refund-reply-label">Admin Message</span>
                                    <p>{refundInfo.adminReply}</p>
                                  </div>
                                ) : (
                                  <p className="order-refund-row"><strong>Admin Reply:</strong> Waiting for response...</p>
                                )}
                                {isRefundCompleted && (
                                  <p className="order-refund-completed">Refund Completed</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>{/* end os-page-content */}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header — amber warning theme */}
            <div className="modal-header">
              <div className="modal-warning-icon-circle">
                <span className="modal-warning-icon-symbol">⚠</span>
              </div>
              <div className="modal-header-text">
                <h3 className="modal-header-title">
                  <span>Cancel Order</span>
                </h3>
                <p className="modal-header-subtitle">Order ID: #{cancelModal.orderNumber}</p>
              </div>
              <button className="modal-close" onClick={closeCancelModal} aria-label="Close">×</button>
            </div>

            {/* Body */}
            <div className="modal-body modal-body-compact-grid">
              <div className="modal-section modal-order-summary-card">
                <h4 className="modal-section-title">Product</h4>
                {cancelModal.orderItems.length > 0 && (
                  <div className="modal-order-summary-content">
                    <img
                      src={cancelModal.orderItems[0].image}
                      alt={cancelModal.orderItems[0].name}
                      className="modal-order-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/72x72?text=Product';
                      }}
                    />
                    <div className="modal-order-meta">
                      <p className="modal-order-product-name">
                        {cancelModal.orderItems[0].name}
                        {cancelModal.orderItems.length > 1 && ` +${cancelModal.orderItems.length - 1} more`}
                      </p>
                      <p className="modal-order-qty-price">
                        Qty:{cancelModal.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        <span className="modal-order-qty-divider">|</span>
                        ₹{Number(cancelModal.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="modal-order-payment-line">
                        Payment: {isCodOrder ? 'COD' : 'ONLINE'}
                        <span className="modal-order-qty-divider">•</span>
                        {(cancelModal.paymentStatus || (isCodOrder ? 'pending' : 'paid')).toUpperCase()}
                      </p>
                      {cancelModal.paymentId && (
                        <p className="modal-order-transaction-id">Txn ID: {cancelModal.paymentId}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-section cancel-reason-section">
                <h4 className="modal-section-title">Cancel Reason</h4>
                <div className="cancel-reason-radio-group">
                  {cancellationReasonOptions.map((reason) => (
                    <label
                      key={reason.label}
                      className={`cancel-reason-radio-label${cancelModal.cancelReason === reason.label ? ' cancel-reason-radio-label--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason.label}
                        checked={cancelModal.cancelReason === reason.label}
                        onChange={(e) => {
                          const nextReason = e.target.value;
                          setCancelModal((prev) => ({
                            ...prev,
                            cancelReason: nextReason,
                            customCancelReason: nextReason === 'Other' ? prev.customCancelReason : '',
                            validationError: ''
                          }));
                        }}
                      />
                      <span className="cancel-reason-radio-icon" aria-hidden="true">{reason.icon}</span>
                      <span>{reason.label}</span>
                    </label>
                  ))}
                </div>

                {cancelModal.cancelReason === 'Other' && (
                  <textarea
                    className="cancel-reason-textarea"
                    placeholder="Please tell us more"
                    rows={2}
                    value={cancelModal.customCancelReason}
                    onChange={(e) => setCancelModal((prev) => ({
                      ...prev,
                      customCancelReason: e.target.value,
                      validationError: ''
                    }))}
                  />
                )}

                {cancelModal.validationError && (
                  <p className="cancel-reason-error">
                    {cancelModal.validationError}
                  </p>
                )}
              </div>

              {!isCodOrder && (
                <div className="modal-section modal-section-right-stack">
                  <div className="refund-info-box refund-info-row-compact">
                    <h4 className="refund-info-title">Refund Info</h4>
                    <p className="refund-processing-note">₹{Number(cancelModal.paidAmount || 0).toLocaleString('en-IN')} | 3-5 business days</p>
                    <div className="refund-method-options refund-method-options-compact">
                      <label className={`refund-method-option${cancelModal.refundMethod === 'original_payment_method' ? ' refund-method-option--selected' : ''}`}>
                        <input
                          type="radio"
                          name="refundMethod"
                          value="original_payment_method"
                          checked={cancelModal.refundMethod === 'original_payment_method'}
                          onChange={(e) => setCancelModal((prev) => ({ ...prev, refundMethod: e.target.value }))}
                        />
                        <span>Original Payment Method</span>
                      </label>
                      <label className={`refund-method-option${cancelModal.refundMethod === 'bank' ? ' refund-method-option--selected' : ''}`}>
                        <input
                          type="radio"
                          name="refundMethod"
                          value="bank"
                          checked={cancelModal.refundMethod === 'bank'}
                          onChange={(e) => setCancelModal((prev) => ({ ...prev, refundMethod: e.target.value }))}
                        />
                        <span>Bank</span>
                      </label>
                    </div>
                    {cancelModal.refundMethod === 'bank' && (
                      <input
                        type="text"
                        className="refund-input"
                        placeholder="Bank account details"
                        value={cancelModal.bankDetails}
                        onChange={(e) => setCancelModal((prev) => ({ ...prev, bankDetails: e.target.value }))}
                      />
                    )}
                  </div>

                  <div className="optional-message-box message-admin-box">
                    <h4 className="modal-section-title">Message to Admin (Optional)</h4>
                    <textarea
                      className="cancel-reason-textarea optional-message-textarea"
                      placeholder="Explain your issue or refund request..."
                      rows={2}
                      value={cancelModal.userMessage}
                      onChange={(e) => setCancelModal((prev) => ({ ...prev, userMessage: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn-modal-secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="btn-modal-danger"
                onClick={handleCancelOrder}
                disabled={cancelling || !isCancelReasonValid}
              >
                {cancelling ? (
                  <>
                    <span className="btn-spinner"></span>
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Orders;
