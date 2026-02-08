import { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CartContext } from '../../context/CartContext';
import { useToast } from '../../hooks/useToast';
import './Cart.css';

/**
 * Free Gift Products Data (All products ≤ ₹500)
 */
const FREE_GIFT_PRODUCTS = [
  {
    id: 'gift-led-bulb',
    name: '9W LED Bulb',
    image: '/api/placeholder/120/120',
    description: 'Energy-efficient LED bulb',
    originalPrice: 299
  },
  {
    id: 'gift-extension-box',
    name: '4-Socket Extension Box',
    image: '/api/placeholder/120/120',
    description: 'Surge protected extension',
    originalPrice: 399
  },
  {
    id: 'gift-mobile-charger',
    name: 'USB Mobile Charger',
    image: '/api/placeholder/120/120',
    description: 'Fast charging adapter',
    originalPrice: 249
  },
  {
    id: 'gift-mini-torch',
    name: 'LED Mini Torch',
    image: '/api/placeholder/120/120',
    description: 'Rechargeable torch light',
    originalPrice: 199
  }
];

// Automatically selected gift (first from list)
const AUTO_GIFT = FREE_GIFT_PRODUCTS[0];

/**
 * Shipping calculation functions
 */
const calculateAmountBasedShipping = (subtotal) => {
  if (subtotal < 500) return 50;
  if (subtotal < 1000) return 30;
  return 0; // Free shipping
};

const calculateWeightBasedShipping = (items) => {
  const totalWeight = items.reduce((total, item) => {
    const weight = item.product?.weight || 0;
    return total + (weight * item.quantity);
  }, 0);

  if (totalWeight === 0) return 0; // No weight data
  if (totalWeight <= 1) return 40;
  if (totalWeight <= 3) return 70;
  return 120;
};

const getLocationCharge = (locationType) => {
  const charges = {
    'same-city': 10,
    'same-state': 30,
    'other-state': 50
  };
  return charges[locationType] || 30; // Default to same-state
};

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
  const [deliveryLocation, setDeliveryLocation] = useState('same-state'); // Default location type
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftInCart, setGiftInCart] = useState(null);

  // Calculate selected subtotal for effects
  const selectedSubtotal = cart?.items?.reduce((total, item) => {
    if (selectedItems.has(item.product._id)) {
      const itemPrice = item.price || item.product.price || 0;
      return total + (itemPrice * item.quantity);
    }
    return total;
  }, 0) || 0;

  // Free gift auto-add/remove logic with useEffect
  useEffect(() => {
    const FREE_GIFT_THRESHOLD = 10000;
    const hasUnlockedFreeGift = selectedSubtotal >= FREE_GIFT_THRESHOLD;
    const selectedCount = selectedItems.size;

    // Auto-add gift if threshold reached and no gift exists
    if (hasUnlockedFreeGift && !giftInCart && selectedCount > 0) {
      setGiftInCart(AUTO_GIFT);
      setSelectedGift(AUTO_GIFT);
      info(`🎉 Free Gift Added: ${AUTO_GIFT.name}!`);
    }

    // Auto-remove gift if cart drops below threshold
    if (!hasUnlockedFreeGift && giftInCart) {
      setGiftInCart(null);
      setSelectedGift(null);
      info('Free gift removed (order below ₹10,000)');
    }
  }, [selectedSubtotal, selectedItems.size, giftInCart, info]);

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
            
            // Shipping calculations
            const selectedCartItems = cart.items.filter(item => selectedItems.has(item.product._id));
            const amountBasedShipping = calculateAmountBasedShipping(selectedSubtotal);
            const weightBasedShipping = calculateWeightBasedShipping(selectedCartItems);
            const baseShippingCharge = Math.max(amountBasedShipping, weightBasedShipping);
            const locationCharge = selectedCount > 0 ? getLocationCharge(deliveryLocation) : 0;
            const totalShippingCharge = baseShippingCharge + locationCharge;
            const isFreeShipping = selectedSubtotal >= 1000;
            const finalTotal = selectedSubtotal + (isFreeShipping ? 0 : totalShippingCharge);
            
            // Free Gift & Shipping Threshold (₹10,000)
            const FREE_GIFT_THRESHOLD = 10000;
            const amountToFreeGift = Math.max(0, FREE_GIFT_THRESHOLD - selectedSubtotal);
            const hasUnlockedFreeGift = selectedSubtotal >= FREE_GIFT_THRESHOLD;
            const giftProgressPercentage = Math.min((selectedSubtotal / FREE_GIFT_THRESHOLD) * 100, 100);
            
            // Free shipping progress (₹10,000 threshold for promotional display)
            const FREE_SHIPPING_THRESHOLD = 10000;
            const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - selectedSubtotal;
            const hasUnlockedFreeShipping = selectedSubtotal >= FREE_SHIPPING_THRESHOLD;
            const progressPercentage = Math.min((selectedSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

            return (
              <>
                {/* Free Gift Applied Badge */}
                {hasUnlockedFreeGift && giftInCart && (
                  <div className="free-gift-applied-banner">
                    <div className="gift-applied-icon">🎉</div>
                    <div className="gift-applied-text">
                      <strong>FREE GIFT APPLIED!</strong>
                      <p>{giftInCart.name} - Worth ₹{giftInCart.originalPrice} added to your cart</p>
                    </div>
                  </div>
                )}

                {/* Gift Progress (when not unlocked) */}
                {!hasUnlockedFreeGift && selectedCount > 0 && (
                  <div className="gift-progress-banner">
                    <div className="gift-progress-content">
                      <div className="gift-icon">🎁</div>
                      <div className="gift-progress-text">
                        <strong>Add ₹{amountToFreeGift.toLocaleString('en-IN')} more to unlock a FREE GIFT!</strong>
                        <p>Get a complimentary product worth up to ₹500 on orders above ₹10,000</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Free Shipping Progress Indicator */}
                <div className="free-shipping-progress">
                  {hasUnlockedFreeShipping ? (
                    <div className="shipping-unlocked">
                      <div className="unlocked-icon">🎉</div>
                      <div className="unlocked-text">
                        <strong>You unlocked FREE SHIPPING!</strong>
                        <p>Your order qualifies for free delivery</p>
                      </div>
                    </div>
                  ) : (
                    <div className="shipping-progress">
                      <div className="progress-header">
                        <div className="truck-icon">🚚</div>
                        <div className="progress-text">
                          <strong>Add ₹{amountToFreeShipping.toLocaleString('en-IN')} more to get FREE SHIPPING</strong>
                          <p>Orders above ₹10,000 qualify for free delivery</p>
                        </div>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${progressPercentage}%` }}
                        >
                          <div className="progress-shimmer"></div>
                        </div>
                      </div>
                      <div className="progress-labels">
                        <span>₹{selectedSubtotal.toLocaleString('en-IN')}</span>
                        <span>₹10,000</span>
                      </div>
                    </div>
                  )}
                </div>

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

                    {/* Delivery Location Selector */}
                    {selectedCount > 0 && (
                      <div className="delivery-location-section">
                        <label htmlFor="location-select">Delivery Location:</label>
                        <select 
                          id="location-select"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          className="location-select"
                        >
                          <option value="same-city">Same City (+₹10)</option>
                          <option value="same-state">Same State (+₹30)</option>
                          <option value="other-state">Other State (+₹50)</option>
                        </select>
                      </div>
                    )}

                    {/* Shipping Breakdown */}
                    {selectedCount > 0 && !isFreeShipping && (
                      <>
                        <div className="summary-row shipping-row">
                          <span>
                            Shipping Charge
                            <small className="shipping-info">
                              {amountBasedShipping > weightBasedShipping 
                                ? `(Order < ₹${selectedSubtotal < 500 ? '500' : '1,000'})`
                                : `(Weight-based)`}
                            </small>
                          </span>
                          <span>₹{baseShippingCharge.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Location Charge</span>
                          <span>₹{locationCharge.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {/* Free Shipping Badge */}
                    {selectedCount > 0 && isFreeShipping && (
                      <div className="free-shipping-badge">
                        <span className="badge-icon">🎉</span>
                        <span>FREE SHIPPING UNLOCKED!</span>
                        <span className="badge-icon">🚚</span>
                      </div>
                    )}

                    {/* Encourage Free Shipping */}
                    {selectedCount > 0 && !isFreeShipping && selectedSubtotal < 1000 && (
                      <div className="shipping-encouragement">
                        <span className="encourage-icon">💡</span>
                        Add <strong>₹{(1000 - selectedSubtotal).toFixed(0)}</strong> more to unlock <strong>FREE SHIPPING</strong> 🚚
                      </div>
                    )}

                    {/* Free Gift Display */}
                    {giftInCart && (
                      <div className="free-gift-display">
                        <div className="gift-badge">🎁 FREE PROMOTIONAL GIFT</div>
                        <div className="gift-details">
                          <div className="gift-info">
                            <strong>{giftInCart.name}</strong>
                            <div className="gift-pricing">
                              <span className="original-price">₹{giftInCart.originalPrice}</span>
                              <span className="arrow">→</span>
                              <span className="final-price">FREE</span>
                            </div>
                          </div>
                          <span className="gift-value">₹0</span>
                        </div>
                      </div>
                    )}

                    <div className="summary-total">
                      <span>Total Amount</span>
                      <span>
                        ₹{(finalTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                    <strong>₹{(finalTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
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
