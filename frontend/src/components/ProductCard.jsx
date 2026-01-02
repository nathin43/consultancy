import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './ProductCard.css';

/**
 * Product Card Component
 * Displays individual product in grid
 */
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }

    const result = await addToCart(product._id, 1);
    if (result.success) {
      alert('Product added to cart!');
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="product-card">
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
        
        {product.stock === 0 && (
          <div className="out-of-stock-overlay">
            <div className="out-of-stock-badge">Out of Stock</div>
          </div>
        )}

        {product.stock > 0 && product.stock < 5 && (
          <div className="low-stock-badge">Low Stock</div>
        )}
      </Link>

      <div className="product-details">
        <div className="product-header">
          <Link to={`/product/${product._id}`} className="product-name-link">
            <h3 className="product-name">{product.name}</h3>
          </Link>
          <span className="product-brand-badge">{product.brand}</span>
        </div>

        {product.ratings && (
          <div className="product-rating">
            <span className="stars">⭐ {product.ratings.average?.toFixed(1) || '0'}</span>
            <span className="rating-count">({product.ratings.count || 0})</span>
          </div>
        )}

        <div className="product-pricing">
          <div className="price-section">
            {product.priceType === 'range' ? (
              <div className="price-range">
                <span className="price-label">Price</span>
                <span className="price-value">₹{product.priceMin?.toLocaleString()} - ₹{product.priceMax?.toLocaleString()}</span>
              </div>
            ) : (
              <div className="price-single">
                <span className="price-label">Price</span>
                <span className="price-value">₹{product.price?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="stock-indicator">
            <span className="stock-label">Stock</span>
            <span className={`stock-count ${product.stock > 10 ? 'plenty' : product.stock > 0 ? 'limited' : 'out'}`}>
              {product.stock > 0 ? product.stock : 0}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`btn btn-add-cart ${product.stock === 0 ? 'disabled' : ''}`}
        >
          {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
        </button>

        <Link to={`/product/${product._id}`} className="view-details-link">
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
