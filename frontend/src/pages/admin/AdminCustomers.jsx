import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminCustomers.css';

/**
 * Admin Customers Page
 * View and manage customers
 */
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCustomer]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/admin/customers');
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const { data } = await API.get(`/admin/customers/${customerId}`);
      setSelectedCustomer(data.customer);
      setCustomerOrders(data.orders);
    } catch (error) {
      alert('Failed to fetch customer details');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/admin/customers/${id}`);
      alert('Customer deleted successfully');
      fetchCustomers();
      if (selectedCustomer?._id === id) {
        setSelectedCustomer(null);
        setCustomerOrders([]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-customers">
        <div className="customers-stats">
          <div className="stat-box">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{customers.length}</span>
          </div>
        </div>

        <div className="customers-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    {customer.address?.city}, {customer.address?.state}
                  </td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => fetchCustomerDetails(customer._id)}
                        className="btn btn-sm btn-primary"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id, customer.name)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Customer Details</h2>
                <button onClick={() => setSelectedCustomer(null)} className="close-btn">
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="customer-info-section">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{selectedCustomer.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedCustomer.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{selectedCustomer.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">
                        {selectedCustomer.address?.street}, {selectedCustomer.address?.city},
                        {selectedCustomer.address?.state} - {selectedCustomer.address?.zipCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="customer-orders-section">
                  <h3>Order History ({customerOrders.length} orders)</h3>
                  
                  {customerOrders.length === 0 ? (
                    <p className="no-orders">No orders yet</p>
                  ) : (
                    <div className="orders-list">
                      {customerOrders.map((order) => (
                        <div key={order._id} className="order-item">
                          <div className="order-info">
                            <span className="order-number">#{order.orderNumber}</span>
                            <span className="order-date">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="order-details">
                            <span className="order-amount">
                              ₹{order.totalPrice.toLocaleString()}
                            </span>
                            <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
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

export default AdminCustomers;
