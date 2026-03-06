import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './OrderConfirmation.css';

/**
 * Order Confirmation Page
 * Shown after a successful Razorpay payment.
 * Receives order data via React Router location.state.
 */
const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { order, items, totalAmount, paymentId } = location.state || {};

  // Guard: if accessed directly (no state), send to orders
  useEffect(() => {
    if (!order) {
      navigate('/orders', { replace: true });
    }
  }, []);

  if (!order) return null;

  const orderNumber = order.orderNumber || order._id?.slice(-8).toUpperCase();
  const itemCount   = items?.length || 0;

  return (
    <>
      <Navbar />

      <div className="oc-page">
        <div className="oc-container">

          {/* ── Success Header ───────────────────────────────────── */}
          <div className="oc-success-card">
            <div className="oc-checkmark-wrap">
              <svg className="oc-checkmark-svg" viewBox="0 0 52 52" aria-hidden="true">
                <circle className="oc-check-circle" cx="26" cy="26" r="25" />
                <path   className="oc-check-path"   d="M14 27l8 8 16-16" />
              </svg>
            </div>

            <h1 className="oc-main-title">Order Confirmed!</h1>
            <p className="oc-main-sub">
              Thank you for shopping with Mani Electricals.
              Your order has been placed and is being processed.
            </p>

            <div className="oc-ids-row">
              <div className="oc-id-chip">
                <span className="oc-id-label">Order #</span>
                <span className="oc-id-value">{orderNumber}</span>
              </div>
              {paymentId && (
                <div className="oc-id-chip oc-id-chip--green">
                  <span className="oc-id-label">Payment ID</span>
                  <span className="oc-id-value">{paymentId.slice(-14)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Body Grid ────────────────────────────────────────── */}
          <div className="oc-grid">

            {/* Items Ordered */}
            <div className="oc-card">
              <h2 className="oc-card-title">
                <span>🛍️</span>
                Items Ordered
                <span className="oc-count-badge">{itemCount}</span>
              </h2>

              <div className="oc-items">
                {items?.map((item, i) => (
                  <div key={i} className="oc-item">
                    <img
                      src={item.image || item.product?.image}
                      alt={item.name}
                      className="oc-item-img"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64?text=Item';
                      }}
                    />
                    <div className="oc-item-info">
                      <p className="oc-item-name">{item.name}</p>
                      <p className="oc-item-qty">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                    </div>
                    <p className="oc-item-price">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="oc-total-bar">
                <span>Total Paid</span>
                <span className="oc-total-amount">
                  ₹{totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Right column */}
            <div className="oc-right">

              {/* Delivery address */}
              {order.shippingAddress && (
                <div className="oc-card">
                  <h2 className="oc-card-title">
                    <span>📦</span> Delivery To
                  </h2>
                  <div className="oc-address">
                    <p className="oc-address-name">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city},&nbsp;
                      {order.shippingAddress.state}&nbsp;–&nbsp;
                      {order.shippingAddress.zipCode}
                    </p>
                    <p>📞 {order.shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {/* What's next + action buttons */}
              <div className="oc-card">
                <h2 className="oc-card-title">
                  <span>✅</span> What's Next?
                </h2>

                <div className="oc-steps">
                  <div className="oc-step">
                    <div className="oc-step-dot">1</div>
                    <p>Order confirmation sent to your email</p>
                  </div>
                  <div className="oc-step">
                    <div className="oc-step-dot">2</div>
                    <p>Items packed &amp; dispatched within 24 hours</p>
                  </div>
                  <div className="oc-step">
                    <div className="oc-step-dot">3</div>
                    <p>Tracking details shared once shipped</p>
                  </div>
                </div>

                <div className="oc-actions">
                  <button
                    className="oc-btn oc-btn--primary"
                    onClick={() => navigate('/orders')}
                  >
                    View My Orders
                  </button>
                  <button
                    className="oc-btn oc-btn--secondary"
                    onClick={() => navigate('/products')}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default OrderConfirmation;
