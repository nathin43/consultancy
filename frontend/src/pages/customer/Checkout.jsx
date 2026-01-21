import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import UPIPayment from '../../components/UPIPayment';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import API from '../../services/api';
import './Checkout.css';

/**
 * Checkout Page Component
 * Order placement with selected items only
 * No GST or shipping charges
 */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  
  // Get selected items from navigation state
  const selectedItemIds = location.state?.selectedItems || [];
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    paymentMethod: 'Cash on Delivery',
    // Credit Card fields
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    // Debit Card fields
    debitCardholderName: '',
    debitCardNumber: '',
    debitExpiryDate: '',
    debitCvv: '',
    // UPI fields
    upiId: '',
    upiProvider: 'gpay',
    // Net Banking fields
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate selected items exist
  useEffect(() => {
    if (!cart || cart.items.length === 0 || selectedItemIds.length === 0) {
      navigate('/cart');
    }
  }, []);

  // Filter selected items from cart
  const selectedItems = cart.items.filter(item => 
    selectedItemIds.includes(item.product._id)
  );

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="container">
            <div className="empty-cart">
              <h2>No items selected for checkout</h2>
              <p>Please select items from your cart</p>
              <button onClick={() => navigate('/cart')} className="btn btn-primary">
                Back to Cart
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Calculate subtotal of selected items only (NO GST, NO SHIPPING)
  const subtotal = selectedItems.reduce((total, item) => {
    const itemPrice = item.price || item.product.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0);

  const total = subtotal; // No GST, no shipping - only selected items total

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate payment details based on selected method
      if (formData.paymentMethod === 'Credit Card') {
        if (!formData.cardholderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
          setError('Please fill all credit card details');
          setLoading(false);
          return;
        }
        if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
          setError('Card number must be 16 digits');
          setLoading(false);
          return;
        }
        if (!formData.cvv.match(/^\d{3,4}$/)) {
          setError('CVV must be 3-4 digits');
          setLoading(false);
          return;
        }
      } else if (formData.paymentMethod === 'Debit Card') {
        if (!formData.debitCardholderName || !formData.debitCardNumber || !formData.debitExpiryDate || !formData.debitCvv) {
          setError('Please fill all debit card details');
          setLoading(false);
          return;
        }
        if (formData.debitCardNumber.replace(/\s/g, '').length !== 16) {
          setError('Card number must be 16 digits');
          setLoading(false);
          return;
        }
        if (!formData.debitCvv.match(/^\d{3,4}$/)) {
          setError('CVV must be 3-4 digits');
          setLoading(false);
          return;
        }
      } else if (formData.paymentMethod === 'UPI') {
        if (!formData.upiId) {
          setError('Please enter UPI ID');
          setLoading(false);
          return;
        }
        if (!formData.upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/)) {
          setError('Please enter valid UPI ID (e.g., username@upi)');
          setLoading(false);
          return;
        }
      } else if (formData.paymentMethod === 'Net Banking') {
        if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
          setError('Please fill all net banking details');
          setLoading(false);
          return;
        }
      }

      const orderData = {
        // Use ONLY selected items for order
        items: selectedItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India'
        },
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          creditCard: formData.paymentMethod === 'Credit Card' ? {
            cardholderName: formData.cardholderName,
            cardNumber: formData.cardNumber.slice(-4), // Only store last 4 digits for security
            expiryDate: formData.expiryDate
          } : null,
          debitCard: formData.paymentMethod === 'Debit Card' ? {
            cardholderName: formData.debitCardholderName,
            cardNumber: formData.debitCardNumber.slice(-4),
            expiryDate: formData.debitExpiryDate
          } : null,
          upi: formData.paymentMethod === 'UPI' ? {
            upiId: formData.upiId,
            provider: formData.upiProvider
          } : null,
          netBanking: formData.paymentMethod === 'Net Banking' ? {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber.slice(-4),
            ifscCode: formData.ifscCode
          } : null
        }
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        // DO NOT clear cart - items persist for easy re-ordering
        // Order has been created with copies of cart items
        // Cart and Order are independent - user can place new orders without losing cart
        success('Order placed successfully! 🎉');
        setTimeout(() => navigate('/orders'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      showError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="checkout-page">
        <div className="container">
          <h1>Checkout</h1>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="checkout-grid">
            <div className="checkout-form-section">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h2>Shipping Address</h2>
                  
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                    />
                  </div>

                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Zip Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{6}"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Payment Method</h2>
                  
                  <div className="payment-methods">
                    {['Cash on Delivery', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'].map(method => (
                      <label key={method} className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={formData.paymentMethod === method}
                          onChange={handleChange}
                        />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>

                  {/* Credit Card Details */}
                  {formData.paymentMethod === 'Credit Card' && (
                    <div className="payment-details">
                      <h3>Credit Card Details</h3>
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          name="cardholderName"
                          placeholder="John Doe"
                          value={formData.cardholderName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Card Number *</label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          maxLength="19"
                          required
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date (MM/YY) *</label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="12/25"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            maxLength="5"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={handleChange}
                            maxLength="4"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debit Card Details */}
                  {formData.paymentMethod === 'Debit Card' && (
                    <div className="payment-details">
                      <h3>Debit Card Details</h3>
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          name="debitCardholderName"
                          placeholder="John Doe"
                          value={formData.debitCardholderName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Card Number *</label>
                        <input
                          type="text"
                          name="debitCardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.debitCardNumber}
                          onChange={handleChange}
                          maxLength="19"
                          required
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date (MM/YY) *</label>
                          <input
                            type="text"
                            name="debitExpiryDate"
                            placeholder="12/25"
                            value={formData.debitExpiryDate}
                            onChange={handleChange}
                            maxLength="5"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="text"
                            name="debitCvv"
                            placeholder="123"
                            value={formData.debitCvv}
                            onChange={handleChange}
                            maxLength="4"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Payment Methods */}
                  {formData.paymentMethod === 'UPI' && (
                    <div className="payment-details">
                      <UPIPayment 
                        upiId={formData.upiId}
                        onUpiIdChange={(value) => setFormData({ ...formData, upiId: value })}
                        selectedUpiProvider={formData.upiProvider}
                        onProviderChange={(provider) => setFormData({ ...formData, upiProvider: provider })}
                      />
                    </div>
                  )}

                  {/* Net Banking Details */}
                  {formData.paymentMethod === 'Net Banking' && (
                    <div className="payment-details">
                      <h3>Net Banking Details</h3>
                      <div className="form-group">
                        <label>Bank Name *</label>
                        <select
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Bank</option>
                          <option value="HDFC">HDFC Bank</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="SBI">State Bank of India</option>
                          <option value="AXIS">Axis Bank</option>
                          <option value="KOTAK">Kotak Mahindra Bank</option>
                          <option value="PUNJAB">Punjab National Bank</option>
                          <option value="CANARA">Canara Bank</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Account Number *</label>
                        <input
                          type="text"
                          name="accountNumber"
                          placeholder="12345678901234"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>IFSC Code *</label>
                        <input
                          type="text"
                          name="ifscCode"
                          placeholder="HDFC0000001"
                          value={formData.ifscCode}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>

            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <p className="selected-info">
                {selectedItems.length} item(s) selected for checkout
              </p>

              <div className="summary-items">
                {selectedItems.map(item => (
                  <div key={item._id} className="summary-item">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=Product';
                      }}
                    />
                    <div className="item-details">
                      <p className="item-name">{item.product.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal ({selectedItems.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="summary-total">
                  <span>Total (No GST/Shipping)</span>
                  <span>₹{total.toLocaleString()}</span>
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

export default Checkout;
