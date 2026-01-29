import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './ProductCard.css';

/**
 * Product Card Component
 * Modern, clean, and professional product card display
 */
const ProductCard = ({ product, hideAddToCart = false }) => {
  const navigate = useNavigate();
  const { addToCart, cart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { success, error, info } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setIsAdding(true);
    try {
      const result = await addToCart(product._id, 1, product);
      if (result.success) {
        success(isInCart ? 'Cart updated! 🛒' : 'Product added to cart! 🛒');
      } else {
        error(result.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || '0'}`;
  };

  const cartItem = cart?.items?.find((item) => item.product?._id === product._id);
  const isInCart = Boolean(cartItem);
  const isOutOfStock = !product?.stock || product.stock <= 0;

  return (
    <div className="product-card">
      {/* Category Badge - Overlaid */}
      <div className="category-badge">
        {product.category || 'ELECTRICAL'}
      </div>

      {/* Image Section - Premium with gradient background */}
      <Link to={`/product/${product._id}`} className="product-image-wrapper">
        <div className="product-image">
          <img 
            src={product.image} 
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=Product';
            }}
          />
        </div>
      </Link>

      {/* Details Section */}
      <div className="product-details">
        {/* Product Name - Bold and prominent */}
        <Link to={`/product/${product._id}`} className="product-name-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>

        {/* Brand/Subtitle */}
        <div className="product-subtitle">{product.brand}</div>

        {/* Rating */}
        {product.ratings && product.ratings.count > 0 && (
          <div className="rating-section">
            <span className="star-icon">★</span>
            <span className="rating-value">{product.ratings.average?.toFixed(1) || '0'}</span>
            <span className="rating-count">({product.ratings.count})</span>
          </div>
        )}

        {/* Price and Stock Section - Inline Layout */}
        <div className="price-stock-section">
          <div className="price-container">
            {product.priceType === 'range' ? (
              <>
                <span className="price-label">from</span>
                <span className="price-value">
                  {formatPrice(product.priceMin)}
                </span>
              </>
            ) : (
              <span className="price-value">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock Badge - Premium pill style */}
          {product.stock > 0 ? (
            <div className="stock-badge-premium in-stock">
              In Stock
            </div>
          ) : (
            <div className="stock-badge-premium out-of-stock">
              Out of Stock
            </div>
          )}
        </div>

        <div className="product-actions">
          {!hideAddToCart && (
            <button
              type="button"
              className={`add-to-cart-btn ${isInCart ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
            >
              {isAdding ? (
                <span className="btn-spinner" aria-label="Adding to cart"></span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A1 1 0 0 0 9.1 18h9.9v-2H9.42a.25.25 0 0 1-.23-.37L10 14h7.45a1 1 0 0 0 .9-.55l3.24-6.52A1 1 0 0 0 20.7 5H7.42L7 4zm3 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              )}
              <span>
                {isOutOfStock ? 'Out of Stock' : isInCart ? 'Added' : 'Add to Cart'}
              </span>
            </button>
          )}

          {/* View Details Button - Full Width Premium */}
          <Link to={`/product/${product._id}`} className="view-details-btn">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
