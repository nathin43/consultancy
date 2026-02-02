import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './ProductCard.css';

/**
 * Premium E-Commerce Product Card Component
 * Modern, clean, and professional design with advanced features
 * - Rating stars display
 * - Stock status indicators
 * - Hover animations
 * - Responsive design
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
    return `₹${price?.toLocaleString('en-IN') || '0'}`;
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  const cartItem = cart?.items?.find((item) => item.product?._id === product._id);
  const isInCart = Boolean(cartItem);
  const isOutOfStock = !product?.stock || product.stock <= 0;
  const averageRating = product.ratings?.average || 0;
  const ratingCount = product.ratings?.count || 0;

  return (
    <div className="product-card-premium">
      {/* Stock Badge - Top Left */}
      {isOutOfStock ? (
        <div className="stock-badge out-of-stock">
          <span className="badge-dot"></span>
          Out of Stock
        </div>
      ) : product.stock < 10 ? (
        <div className="stock-badge low-stock">
          <span className="badge-dot"></span>
          Only {product.stock} left
        </div>
      ) : (
        <div className="stock-badge in-stock">
          <span className="badge-dot"></span>
          In Stock
        </div>
      )}

      {/* Product Image Section */}
      <Link to={`/product/${product._id}`} className="product-image-link">
        <div className="product-image-container">
          <img 
            src={product.image} 
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=Product+Image';
            }}
          />
        </div>
      </Link>

      {/* Product Details Section */}
      <div className="product-info">
        {/* Category Badge */}
        {product.category && (
          <div className="category-label">
            {product.category.toUpperCase()}
          </div>
        )}

        {/* Product Name */}
        <Link to={`/product/${product._id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        {/* Brand */}
        {product.brand && (
          <p className="product-brand">by {product.brand}</p>
        )}

        {/* Rating Section */}
        {ratingCount > 0 && (
          <div className="rating-container">
            <div className="stars-display">
              {renderStars(averageRating)}
            </div>
            <span className="rating-text">
              {averageRating.toFixed(1)} <span className="rating-reviews">({ratingCount} reviews)</span>
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="price-section">
          {product.priceType === 'range' ? (
            <div className="price-range">
              <span className="price-from">Starting from</span>
              <span className="price-main">{formatPrice(product.priceMin)}</span>
            </div>
          ) : (
            <div className="price-single">
              <span className="price-main">{formatPrice(product.price)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-actions-premium">
          {!hideAddToCart && (
            <button
              type="button"
              className={`btn-add-to-cart ${isInCart ? 'in-cart' : ''} ${isOutOfStock ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
            >
              {isAdding ? (
                <>
                  <span className="btn-loading"></span>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>
                    {isOutOfStock ? 'Out of Stock' : isInCart ? 'Added to Cart' : 'Add to Cart'}
                  </span>
                </>
              )}
            </button>
          )}

          <Link 
            to={`/product/${product._id}`} 
            className="btn-view-details"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
