import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Home.css';

/**
 * Home Page Component
 * Landing page with featured products and categories
 */
const Home = () => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-rotate categories every 3 seconds
    const categoryInterval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
    }, 3000);

    // Auto-rotate products every 4 seconds
    const productInterval = setInterval(() => {
      if (products.length > 0) {
        setCurrentProductIndex((prev) => (prev + 1) % products.length);
      }
    }, 4000);

    // Fetch products
    fetchProducts();

    return () => {
      clearInterval(categoryInterval);
      clearInterval(productInterval);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Wire & Cables', icon: '�', color: '#3b82f6' },
    { name: 'Pipes', icon: '�', color: '#06b6d4' },
    { name: 'Heater', icon: '�', color: '#8b5cf6' },
    { name: 'Motors', icon: '⚙️', color: '#ec4899' },
    { name: 'Fan', icon: '💨', color: '#10b981' },
    { name: 'Lights', icon: '�', color: '#f59e0b' },
    { name: 'Switches', icon: '�', color: '#ef4444' },
    { name: 'Tank', icon: '🚡', color: '#6366f1' }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-label">WELCOME TO MANI ELECTRICAL</span>
            <h1>BEST ELECTRICAL APPLIANCES EVER!</h1>
            <p>Find everything you need for your electrical projects. High-quality products at unbeatable prices with fast delivery.</p>
            <Link to="/products" className="btn-buy-product">Buy Products</Link>
          </div>

          <div className="hero-image-container">
            <div className="category-image-wrapper">
              <div className="category-image-display">
                <span className="category-icon-large" style={{ color: categories[currentCategoryIndex].color, fontSize: '120px' }}>
                  {categories[currentCategoryIndex].icon}
                </span>
                <h3>{categories[currentCategoryIndex].name}</h3>
              </div>
            </div>

            <div className="category-controls">
              <button 
                className="category-btn prev"
                onClick={() => setCurrentCategoryIndex((prev) => (prev - 1 + categories.length) % categories.length)}
              >
                ‹
              </button>
              <div className="category-dots-horizontal">
                {categories.map((category, index) => (
                  <button
                    key={category.name}
                    className={`dot-horizontal ${index === currentCategoryIndex ? 'active' : ''}`}
                    onClick={() => setCurrentCategoryIndex(index)}
                    style={{ 
                      backgroundColor: index === currentCategoryIndex ? category.color : '#ddd'
                    }}
                    title={category.name}
                  />
                ))}
              </div>
              <button 
                className="category-btn next"
                onClick={() => setCurrentCategoryIndex((prev) => (prev + 1) % categories.length)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Carousel Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          
          {loading ? (
            <div className="spinner"></div>
          ) : products.length > 0 ? (
            <div className="product-carousel-wrapper">
              <div className="featured-product-card">
                <Link to={`/product/${products[currentProductIndex]._id}`} className="product-link">
                  <div className="product-image-container">
                    <img 
                      src={products[currentProductIndex].image} 
                      alt={products[currentProductIndex].name} 
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h3>{products[currentProductIndex].name}</h3>
                    <p className="product-description">{products[currentProductIndex].category}</p>
                    <p className="product-price">₹{products[currentProductIndex].price}</p>
                  </div>
                </Link>
              </div>

              <div className="product-controls">
                <button 
                  className="product-btn prev"
                  onClick={() => setCurrentProductIndex((prev) => (prev - 1 + products.length) % products.length)}
                >
                  ‹
                </button>
                <div className="product-dots">
                  {products.slice(0, 8).map((product, index) => (
                    <button
                      key={product._id}
                      className={`dot-product ${index === currentProductIndex ? 'active' : ''}`}
                      onClick={() => setCurrentProductIndex(index)}
                    />
                  ))}
                </div>
                <button 
                  className="product-btn next"
                  onClick={() => setCurrentProductIndex((prev) => (prev + 1) % products.length)}
                >
                  ›
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center">No products available</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🚚</span>
              <h3>Free Shipping</h3>
              <p>On orders above ₹10,000</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💳</span>
              <h3>Secure Payment</h3>
              <p>100% secure transactions</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔄</span>
              <h3>Easy Returns</h3>
              <p>7 days return policy</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎧</span>
              <h3>24/7 Support</h3>
              <p>Dedicated customer support</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
