import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CartContext } from '../../context/CartContext';
import { useToast } from '../../hooks/useToast';
import './Cart.css';

/**
 * Shopping Cart Page Component
 * Supports selective product checkout with checkboxes
 */
const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);
  const { info } = useToast();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const setItemUpdating = (productId, isUpdating) => {
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      if (isUpdating) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setItemUpdating(productId, true);
    try {
      await updateCartItem(productId, newQuantity);
    } finally {
      setItemUpdating(productId, false);
    }
  };

  const handleRemove = async (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      setItemUpdating(productId, true);
      try {
        await removeFromCart(productId);
        // Remove from selected if it was selected
        const newSelected = new Set(selectedItems);
        newSelected.delete(productId);
        setSelectedItems(newSelected);
        info('Item removed from cart 🗑️');
      } finally {
        setItemUpdating(productId, false);
      }
    }
  };

  const handleSelectItem = (productId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set());
    } else {
      const allItems = new Set(cart.items.map(item => item.product._id));
      setSelectedItems(allItems);
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      info('Please select at least one item to proceed');
      return;
    }
    // Pass selected item IDs through session/state
    navigate('/checkout', { state: { selectedItems: Array.from(selectedItems) } });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="spinner"></div>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="cart-page">
          <div className="container">
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h2>Your Cart is Empty</h2>
              <p>Start adding products to your cart</p>
              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="cart-page">
        <div className="container">
          <div className="cart-page-header">
            <div>
              <h1>Shopping Cart</h1>
              <p className="cart-subtitle">Review your items and proceed to checkout when ready.</p>
            </div>
          </div>

          {(() => {
            const selectedSubtotal = cart.items.reduce((total, item) => {
              if (selectedItems.has(item.product._id)) {
                const itemPrice = item.price || item.product.price || 0;
                return total + (itemPrice * item.quantity);
              }
              return total;
            }, 0);
            const selectedCount = selectedItems.size;

            return (
              <>
                <div className="cart-grid">
                  <div className="cart-items">
                    <div className="cart-items-header">
                      <div className="cart-items-title">
                        <h2>Cart Items</h2>
                        <p>{cart.items.length} item(s) in your cart</p>
                      </div>
                      <label className="select-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === cart.items.length && cart.items.length > 0}
                          onChange={handleSelectAll}
                        />
                        <span className="checkbox-box"></span>
                        <span className="checkbox-label">Select All</span>
                      </label>
                    </div>

                    {cart.items.map((item) => {
                      const product = item.product || {};
                      const itemPrice = item.price || product.price || 0;
                      const itemQuantity = item.quantity || 1;
                      const productId = product._id;
                      const isSelected = selectedItems.has(productId);
                      const isUpdating = updatingItems.has(productId);

                      return (
                        <div key={item._id || product._id} className={`cart-item-card ${isSelected ? 'selected' : ''} ${isUpdating ? 'updating' : ''}`}>
                          <label className="select-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectItem(productId)}
                            />
                            <span className="checkbox-box"></span>
                          </label>

                          <div className="item-media">
                            <img
                              src={product.image}
                              alt={product.name || 'Product'}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/140x140?text=Product';
                              }}
                            />
                          </div>

                          <div className="cart-item-info">
                            <Link to={`/product/${product._id}`}>
                              <h3>{product.name || 'Unknown Product'}</h3>
                            </Link>
                            <p className="item-brand">{product.brand || 'N/A'}</p>
                            <p className="item-price">₹{(itemPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                          </div>

                          <div className="cart-item-actions">
                            <div className="quantity-controls">
                              <button
                                className="qty-btn"
                                onClick={() => handleQuantityChange(product._id, itemQuantity - 1)}
                                disabled={isUpdating || itemQuantity <= 1}
                              >
                                −
                              </button>
                              <span className="qty-value">{itemQuantity}</span>
                              <button
                                className="qty-btn"
                                onClick={() => handleQuantityChange(product._id, itemQuantity + 1)}
                                disabled={isUpdating || itemQuantity >= (product.stock || 0)}
                              >
                                +
                              </button>
                            </div>

                            <div className="item-total">
                              ₹{(itemPrice * itemQuantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>

                            <button
                              onClick={() => handleRemove(product._id)}
                              className="remove-btn"
                              aria-label="Remove item"
                              title="Remove item"
                              disabled={isUpdating}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 13h12a2 2 0 0 0 2-2V9H4v11a2 2 0 0 0 2 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <p className="summary-note">
                      {selectedCount > 0 ? `${selectedCount} item(s) selected` : 'No items selected'}
                    </p>

                    <div className="summary-row">
                      <span>Selected Items</span>
                      <span>{selectedCount}</span>
                    </div>

                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>₹{(selectedSubtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="summary-total">
                      <span>Total Amount</span>
                      <span>
                        ₹{(selectedSubtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary btn-block"
                      disabled={selectedCount === 0}
                    >
                      Proceed to Checkout
                    </button>

                    <Link to="/products" className="continue-shopping">
                      Continue Shopping
                    </Link>
                  </div>
                </div>

                <div className="mobile-checkout-bar">
                  <div className="mobile-summary">
                    <span>Total</span>
                    <strong>₹{(selectedSubtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary btn-block"
                    disabled={selectedCount === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Cart;
