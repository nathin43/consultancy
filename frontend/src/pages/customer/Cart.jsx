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

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
  };

  const handleRemove = async (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(productId);
      // Remove from selected if it was selected
      const newSelected = new Set(selectedItems);
      newSelected.delete(productId);
      setSelectedItems(newSelected);
      info('Item removed from cart 🗑️');
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
          <h1>Shopping Cart</h1>

          <div className="cart-grid">
            <div className="cart-items">
              {/* Select All */}
              <div className="select-all-header">
                <label className="select-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cart.items.length && cart.items.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>Select All</span>
                </label>
              </div>

              {cart.items.map((item) => {
                const product = item.product || {};
                const itemPrice = item.price || product.price || 0;
                const itemQuantity = item.quantity || 1;
                const productId = product._id;
                const isSelected = selectedItems.has(productId);
                
                return (
                  <div key={item._id || product._id} className={`cart-item ${isSelected ? 'selected' : ''}`}>
                    <label className="select-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(productId)}
                      />
                      <span></span>
                    </label>

                    <img 
                      src={product.image} 
                      alt={product.name || 'Product'}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                      }}
                    />
                    
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
                          onClick={() => handleQuantityChange(product._id, itemQuantity - 1)}
                        >
                          -
                        </button>
                        <span>{itemQuantity}</span>
                        <button
                          onClick={() => handleQuantityChange(product._id, itemQuantity + 1)}
                          disabled={itemQuantity >= (product.stock || 0)}
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
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <p className="summary-note">
                {selectedItems.size > 0 ? `${selectedItems.size} item(s) selected` : 'No items selected'}
              </p>
              
              {/* Calculate selected items subtotal */}
              {(() => {
                const selectedSubtotal = cart.items.reduce((total, item) => {
                  if (selectedItems.has(item.product._id)) {
                    const itemPrice = item.price || item.product.price || 0;
                    return total + (itemPrice * item.quantity);
                  }
                  return total;
                }, 0);

                return (
                  <>
                    <div className="summary-row">
                      <span>Subtotal ({selectedItems.size} items)</span>
                      <span>₹{(selectedSubtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="summary-total">
                      <span>Total</span>
                      <span>
                        ₹{(selectedSubtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button 
                      onClick={handleCheckout} 
                      className="btn btn-primary btn-block"
                      disabled={selectedItems.size === 0}
                    >
                      Proceed to Checkout ({selectedItems.size} items)
                    </button>
                  </>
                );
              })()}

              <Link to="/products" className="continue-shopping">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Cart;
