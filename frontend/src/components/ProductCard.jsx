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
const ProductCard = ({ product }) => {
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
      {/* Image Section */}
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

        {/* Stock Badges */}
        {product.stock === 0 && (
          <div className="stock-badge out-of-stock">Out of Stock</div>
        )}

        {product.stock > 0 && product.stock < 5 && (
          <div className="stock-badge low-stock">Low Stock</div>
        )}

        {product.stock >= 5 && (
          <div className="stock-badge in-stock">In Stock</div>
        )}
      </Link>

      {/* Details Section */}
      <div className="product-details">
        {/* Brand Badge */}
        <div className="brand-badge">{product.brand}</div>

        {/* Product Name */}
        <Link to={`/product/${product._id}`} className="product-name-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>

        {/* Rating */}
        {product.ratings && (
          <div className="rating-section">
            <div className="stars-display">
              {product.ratings.count > 0 ? (
                <>
                  <span className="star-icon">★</span>
                  <span className="rating-value">{product.ratings.average?.toFixed(1) || '0'}</span>
                  <span className="rating-count">({product.ratings.count})</span>
                </>
              ) : (
                <>
                  <span className="star-icon empty">★</span>
                  <span className="rating-value empty">No Reviews</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="price-section">
          {product.priceType === 'range' ? (
            <div className="price-display">
              <span className="price-label">Starting from</span>
              <span className="price-value">
                {formatPrice(product.priceMin)} - {formatPrice(product.priceMax)}
              </span>
            </div>
          ) : (
            <span className="price-value">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        <div className="stock-info">
          <span className={`stock-badge-inline ${product.stock > 10 ? 'plenty' : product.stock > 0 ? 'limited' : 'out'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`btn-primary ${product.stock === 0 ? 'disabled' : ''}`}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          <Link to={`/product/${product._id}`} className="btn-secondary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
