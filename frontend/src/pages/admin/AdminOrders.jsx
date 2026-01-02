import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminOrders.css';

/**
 * Admin Orders Page
 * Manage all customer orders
 */
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      alert('Order status updated');
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update order status');
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

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === statusFilter);

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-orders">
        <div className="orders-stats">
          <div className="stat-box">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Sales</span>
            <span className="stat-value">
              ₹{orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="orders-filter">
          <label>Filter by Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.orderNumber}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
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

              <div className="order-customer">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {order.user?.name}</p>
                <p><strong>Email:</strong> {order.user?.email}</p>
                <p><strong>Phone:</strong> {order.user?.phone}</p>
                <p>
                  <strong>Shipping Address:</strong><br />
                  {order.shippingAddress.name}<br />
                  {order.shippingAddress.street}, {order.shippingAddress.city}<br />
                  {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                </p>
              </div>

              <div className="order-items">
                <h4>Order Items</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60x60?text=Product';
                      }}
                    />
                    <div className="item-details">
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
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

              <div className="order-actions">
                <div className="order-info">
                  <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  <p><strong>Payment Status:</strong> 
                    <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </p>
                </div>

                {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                  <div className="status-controls">
                    <label>Update Status:</label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
