import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CartContext } from '../../context/CartContext';
import './Cart.css';

/**
 * Shopping Cart Page Component
 */
const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
  };

  const handleRemove = async (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(productId);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
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
              {cart.items.map((item) => (
                <div key={item._id} className="cart-item">
                  <img src={item.product.image} alt={item.product.name} />
                  
                  <div className="cart-item-info">
                    <Link to={`/product/${item.product._id}`}>
                      <h3>{item.product.name}</h3>
                    </Link>
                    <p className="item-brand">{item.product.brand}</p>
                    <p className="item-price">₹{item.price.toLocaleString()}</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleRemove(item.product._id)}
                      className="remove-btn"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal ({cart.items.length} items)</span>
                <span>₹{cart.totalAmount.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>{cart.totalAmount > 10000 ? 'FREE' : '₹500'}</span>
              </div>

              <div className="summary-row">
                <span>Tax (18% GST)</span>
                <span>₹{(cart.totalAmount * 0.18).toLocaleString()}</span>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>
                  ₹{(
                    cart.totalAmount +
                    (cart.totalAmount > 10000 ? 0 : 500) +
                    cart.totalAmount * 0.18
                  ).toLocaleString()}
                </span>
              </div>

              <button onClick={handleCheckout} className="btn btn-primary btn-block">
                Proceed to Checkout
              </button>

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
