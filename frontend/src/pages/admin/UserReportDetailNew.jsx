import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import useToast from '../../hooks/useToast';
import './UserReportDetailNew.css';

const UserReportDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  // Tab-specific data
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    fetchUserData();
    fetchTabData();
  }, [userId, activeTab]);
  
  const fetchUserData = async () => {
    try {
      const { data } = await api.get(`/api/users/${userId}`);
      setUserData(data.user || data);
    } catch (err) {
      showError('Failed to fetch user data');
      console.error(err);
    }
  };
  
  const fetchTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'orders':
          await fetchOrders();
          break;
        case 'payments':
          await fetchPayments();
          break;
        case 'invoices':
          await fetchInvoices();
          break;
        case 'reviews':
          await fetchReviews();
          break;
      }
    } catch (err) {
      showError(`Failed to fetch ${activeTab} data`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/api/orders/user/${userId}`);
      setOrders(data.orders || data || []);
    } catch (error) {
      console.error(error);
      setOrders([]);
    }
  };
  
  const fetchPayments = async () => {
    try {
      const { data } = await api.get(`/api/payments/user/${userId}`);
      setPayments(data.payments || data || []);
    } catch (error) {
      console.error(error);
      setPayments([]);
    }
  };
  
  const fetchInvoices = async () => {
    try {
      const { data } = await api.get(`/api/invoices/user/${userId}`);
      setInvoices(data.invoices || data || []);
    } catch (error) {
      console.error(error);
      setInvoices([]);
    }
  };
  
  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/api/reviews/user/${userId}`);
      setReviews(data.reviews || data || []);
    } catch (error) {
      console.error(error);
      setReviews([]);
    }
  };
  
  const handleApproveReview = async (reviewId) => {
    try {
      await api.put(`/api/reviews/${reviewId}/approve`);
      success('Review approved successfully');
      fetchReviews();
    } catch (err) {
      showError('Failed to approve review');
    }
  };
  
  const handleRejectReview = async (reviewId) => {
    try {
      await api.put(`/api/reviews/${reviewId}/reject`);
      success('Review rejected successfully');
      fetchReviews();
    } catch (err) {
      showError('Failed to reject review');
    }
  };
  
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      success('Review deleted successfully');
      fetchReviews();
    } catch (err) {
      showError('Failed to delete review');
    }
  };
  
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const { data } = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Invoice downloaded successfully');
    } catch (err) {
      showError('Failed to download invoice');
    }
  };
  
  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };
  
  const handleTrackOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}/track`);
  };
  
  const applyFilters = () => {
    fetchTabData();
  };
  
  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
  };
  
  const exportCurrentTab = () => {
    let csvContent = '';
    let filename = '';
    
    switch (activeTab) {
      case 'orders':
        csvContent = 'Order ID,Date,Products,Status,Amount,Payment Status\n';
        orders.forEach(order => {
          csvContent += `${order._id},${new Date(order.createdAt).toLocaleDateString()},${order.items?.length || 0} items,${order.status},₹${order.totalAmount},${order.paymentStatus}\n`;
        });
        filename = `orders-${userId}-${Date.now()}.csv`;
        break;
      case 'payments':
        csvContent = 'Payment ID,Order ID,Date,Method,Amount,Status\n';
        payments.forEach(payment => {
          csvContent += `${payment._id},${payment.orderId},${new Date(payment.createdAt).toLocaleDateString()},${payment.method},₹${payment.amount},${payment.status}\n`;
        });
        filename = `payments-${userId}-${Date.now()}.csv`;
        break;
      case 'invoices':
        csvContent = 'Invoice Number,Order ID,Date,Tax/GST,Amount\n';
        invoices.forEach(invoice => {
          csvContent += `${invoice.invoiceNumber},${invoice.orderId},${new Date(invoice.date).toLocaleDateString()},₹${invoice.tax},₹${invoice.amount}\n`;
        });
        filename = `invoices-${userId}-${Date.now()}.csv`;
        break;
      case 'reviews':
        csvContent = 'Product,Rating,Comment,Date,Status\n';
        reviews.forEach(review => {
          const comment = review.comment?.replace(/"/g, '""') || '';
          csvContent += `"${review.productName}",${review.rating},"${comment}",${new Date(review.createdAt).toLocaleDateString()},${review.status}\n`;
        });
        filename = `reviews-${userId}-${Date.now()}.csv`;
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success('Report exported successfully');
  };
  
  const renderOrders = () => (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Products</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Payment Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">No orders found</td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order._id}>
                <td>#{order._id.slice(-8)}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items?.length || 0} items</td>
                <td>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td className="amount">₹{order.totalAmount?.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${order.paymentStatus?.toLowerCase()}`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action btn-view"
                      onClick={() => handleViewOrder(order._id)}
                    >
                      View
                    </button>
                    <button 
                      className="btn-action btn-track"
                      onClick={() => handleTrackOrder(order._id)}
                    >
                      Track
                    </button>
                    <button 
                      className="btn-action btn-invoice"
                      onClick={() => handleDownloadInvoice(order.invoiceId)}
                    >
                      Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
  
  const renderPayments = () => (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Date</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Refund Details</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">No payments found</td>
            </tr>
          ) : (
            payments.map(payment => (
              <tr key={payment._id}>
                <td>#{payment._id.slice(-8)}</td>
                <td>#{payment.orderId?.slice(-8)}</td>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td className="capitalize">{payment.method}</td>
                <td className="amount">₹{payment.amount?.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${payment.status?.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>
                  {payment.refundAmount ? (
                    <span className="refund-info">₹{payment.refundAmount} refunded</span>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
  
  const renderInvoices = () => (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Order ID</th>
            <th>Date</th>
            <th>Tax/GST</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">No invoices found</td>
            </tr>
          ) : (
            invoices.map(invoice => (
              <tr key={invoice._id}>
                <td className="invoice-number">{invoice.invoiceNumber}</td>
                <td>#{invoice.orderId?.slice(-8)}</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>₹{invoice.tax?.toLocaleString()}</td>
                <td className="amount">₹{invoice.amount?.toLocaleString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action btn-view"
                      onClick={() => window.open(`/invoices/${invoice._id}`, '_blank')}
                    >
                      View
                    </button>
                    <button 
                      className="btn-action btn-download"
                      onClick={() => handleDownloadInvoice(invoice._id)}
                    >
                      Download PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
  
  const renderReviews = () => (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">No reviews found</td>
            </tr>
          ) : (
            reviews.map(review => (
              <tr key={review._id}>
                <td className="product-name">{review.productName || review.product?.name}</td>
                <td>
                  <div className="rating-display">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    <span className="rating-number">{review.rating}/5</span>
                  </div>
                </td>
                <td className="review-comment">{review.comment || 'No comment'}</td>
                <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${review.status?.toLowerCase()}`}>
                    {review.status || 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {review.status !== 'approved' && (
                      <button 
                        className="btn-action btn-approve"
                        onClick={() => handleApproveReview(review._id)}
                      >
                        Approve
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button 
                        className="btn-action btn-reject"
                        onClick={() => handleRejectReview(review._id)}
                      >
                        Reject
                      </button>
                    )}
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
  
  return (
    <AdminLayout>
      <div className="user-report-detail">
        {/* Header */}
        <div className="report-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/admin/reports')}>
              ← Back to Reports
            </button>
            <h1>User Report</h1>
            {userData && (
              <div className="user-info-header">
                <div className="user-avatar-large">
                  {userData.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h2>{userData.name}</h2>
                  <p>{userData.email}</p>
                  <span className={`status-badge ${userData.status?.toLowerCase()}`}>
                    {userData.status || 'Active'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button className="btn-export" onClick={exportCurrentTab}>
              Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="report-tabs">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders {orders.length > 0 && `(${orders.length})`}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments {payments.length > 0 && `(${payments.length})`}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices {invoices.length > 0 && `(${invoices.length})`}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </button>
        </div>
        
        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>From Date</label>
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                {activeTab === 'reviews' && (
                  <>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn-apply" onClick={applyFilters}>Apply</button>
              <button className="btn-clear" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading {activeTab}...</p>
            </div>
          ) : (
            <>
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'payments' && renderPayments()}
              {activeTab === 'invoices' && renderInvoices()}
              {activeTab === 'reviews' && renderReviews()}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserReportDetail;
