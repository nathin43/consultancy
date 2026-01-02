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
      <Link to={`/product/${product._id}`} className="product-image">
        <img src={product.image} alt={product.name} />
        {product.stock === 0 && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
      </Link>

      <div className="product-info">
        <Link to={`/product/${product._id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        
        <p className="product-brand">{product.brand}</p>
        
        <div className="product-rating">
          ⭐ {product.ratings.average.toFixed(1)} 
          <span className="rating-count">({product.ratings.count})</span>
        </div>

        <div className="product-footer">
          <div className="product-price">
            {product.priceType === 'range' ? (
              <>₹{product.priceMin?.toLocaleString()} - ₹{product.priceMax?.toLocaleString()}</>
            ) : (
              <>₹{product.price?.toLocaleString()}</>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn btn-sm btn-primary"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
