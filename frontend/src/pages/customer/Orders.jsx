import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './Orders.css';

/**
 * Orders Page Component
 * View order history and status
 */
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError('');
      const { data } = await API.get('/orders/myorders');
      console.log('Fetched orders:', data);
      setOrders(data.orders || []);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error fetching orders';
      console.error('Error fetching orders:', error);
      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await API.put(`/orders/${orderId}/cancel`);
      success('Order cancelled successfully 🎯');
      fetchOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="spinner"></div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="orders-page">
        <div className="container">
          <h1>My Orders</h1>

          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="no-orders">
              <h2>No orders yet</h2>
              <p>Start shopping to see your orders here</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.orderNumber}</h3>
                      <p className="order-date">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
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
                      <span>Items Price:</span>
                      <span>₹{order.itemsPrice.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>₹{order.shippingPrice.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Tax:</span>
                      <span>₹{order.taxPrice.toLocaleString()}</span>
                    </div>
                    <div className="summary-total">
                      <span>Total:</span>
                      <span>₹{order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-details">
                      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      <p><strong>Payment Status:</strong> 
                        <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="btn btn-sm btn-danger"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Orders;
