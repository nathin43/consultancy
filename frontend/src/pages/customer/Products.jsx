import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import API from '../../services/api';
import './Products.css';

/**
 * Products Page Component
 * Modern product listing with advanced filters and search
 */
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/products/categories');
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('limit', '100');

      const { data } = await API.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest'
    });
  };

  const hasActiveFilters = 
    filters.category !== 'all' || 
    filters.search !== '' || 
    filters.minPrice !== '' || 
    filters.maxPrice !== '' ||
    filters.sort !== 'newest';


  return (
    <>
      <Navbar />

      <div className="products-page">
        <div className="container">
          <h1 className="page-title">Our Products</h1>

          {/* Search Bar Container */}
          <div className="search-filter-container">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search products by name, brand..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="search-input"
                  aria-label="Search products"
                />
              </div>
              <button type="submit" className="search-button" aria-label="Submit search">
                <span>Search</span>
              </button>
            </form>

            {/* Filters Toggle Button (Mobile) */}
            <button 
              className="filters-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"></path>
              </svg>
              Filters
              <span className={`toggle-icon ${showFilters ? 'open' : ''}`}>⌄</span>
            </button>

            {/* Filters Section */}
            <div className={`filters-section ${showFilters ? 'show' : ''}`}>
              {/* Category Filter */}
              <div className="filter-group">
                <label htmlFor="category-select">Category</label>
                <div className="filter-input-wrapper">
                  <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 4h18v4H3zM5 12h14v4H5zM7 20h10v2H7z"></path>
                  </svg>
                  <select
                    id="category-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Min Price Filter */}
              <div className="filter-group">
                <label htmlFor="min-price">Min Price</label>
                <div className="filter-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    id="min-price"
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="filter-input"
                    aria-label="Minimum price"
                  />
                </div>
              </div>

              {/* Max Price Filter */}
              <div className="filter-group">
                <label htmlFor="max-price">Max Price</label>
                <div className="filter-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    id="max-price"
                    type="number"
                    placeholder="100000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="filter-input"
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              {/* Sort By Filter */}
              <div className="filter-group">
                <label htmlFor="sort-select">Sort By</label>
                <div className="filter-input-wrapper">
                  <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h4v12H3zm6-2h4v14h-4zm6 4h4v10h-4z"></path>
                  </svg>
                  <select
                    id="sort-select"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="filter-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Product Name</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button 
                  className="clear-filters-btn"
                  onClick={clearFilters}
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <svg className="no-products-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters to find what you're looking for</p>
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="products-header">
                <p className="products-count">{products.length} products found</p>
              </div>
              <div className="grid grid-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Products;
