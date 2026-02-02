import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Products.css';

/**
 * Products Page Component
 * Professional e-commerce product grid with search and filters
 */
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await API.get('/products?limit=100');
      
      // Always ensure we have an array
      const fetchedProducts = Array.isArray(data.products) ? data.products : [];
      
      setProducts(fetchedProducts);
      
      if (fetchedProducts.length === 0) {
        setError('No products available at the moment');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load products';
      setError(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Navbar />

      <div className="products-page">
        <div className="container">
          <h1 className="page-title">Our Products</h1>

          {/* Products Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="error-container">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Unable to Load Products</h3>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => fetchProducts()}
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <h3>No products available</h3>
              <p>Please check back later</p>
            </div>
          ) : (
            <div className="products-grid-section">
              <div className="products-header">
                <p className="products-count">
                  {products.length} {products.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
              <div className="grid grid-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Products;
