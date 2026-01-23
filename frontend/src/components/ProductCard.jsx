import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './ProductCard.css';

/**
 * Product Card Component
 * Modern, clean, and professional product card display
 */
const ProductCard = ({ product, hideAddToCart = false }) => {
  const { addToCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { success, error, info } = useToast();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      info('Please login to add items to cart');
      return;
    }

    const result = await addToCart(product._id, 1);
    if (result.success) {
      success('Product added to cart! 🛒');
    } else {
      error(result.message);
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || '0'}`;
  };

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

        {/* View Details Button - Full Width Premium */}
        <Link to={`/product/${product._id}`} className="view-details-btn">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
