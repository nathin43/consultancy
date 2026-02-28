import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import Loading from '../../components/Loading';
import API from '../../services/api';
import './AdminProducts.css';

/**
 * Admin Products Dashboard
 * Modern, professional product management interface
 */
const AdminProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [categories, setCategories] = useState([]);

  // Apply URL filter on component mount and URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=100');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/products/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await API.patch(`/products/${id}/status`, { status: newStatus });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product status:', error);
      alert('Failed to update status');
    }
  };

  const toggleSelectProduct = (id) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.size} products? This cannot be undone.`)) return;

    try {
      for (const id of selectedProducts) {
        await API.delete(`/products/${id}`);
      }
      fetchProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to delete products:', error);
      alert('Failed to delete selected products');
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedProducts.size === 0) return;

    try {
      for (const id of selectedProducts) {
        await API.patch(`/products/${id}/status`, { status });
      }
      fetchProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to update product status:', error);
      alert('Failed to update product status');
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      // Apply status filter from URL or dropdown
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = product.status === 'active';
      } else if (statusFilter === 'inactive') {
        matchesStatus = product.status === 'inactive';
      } else if (statusFilter === 'out-of-stock') {
        matchesStatus = product.stock === 0;
      } else if (statusFilter === 'low-stock') {
        matchesStatus = product.stock > 0 && product.stock < 10;
      } else if (statusFilter === 'all') {
        matchesStatus = true;
      }
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-low':
          return a.stock - b.stock;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Analytics calculations
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const inactiveProducts = products.filter(p => p.status === 'inactive').length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;

  // Get page heading based on filter
  const getPageHeading = () => {
    switch(statusFilter) {
      case 'active': return 'Active Products';
      case 'inactive': return 'Inactive Products';
      case 'out-of-stock': return 'Out of Stock Products';
      case 'low-stock': return 'Low Stock Products';
      default: return 'Products Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch(statusFilter) {
      case 'active': return 'Viewing all active products in your inventory';
      case 'inactive': return 'Viewing all inactive products';
      case 'out-of-stock': return 'Products that need restocking';
      case 'low-stock': return 'Products with low inventory levels';
      default: return 'Manage your entire product inventory efficiently';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading title="Loading Products..." subtitle="Fetching product inventory..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-products-container">
        {/* Header */}
        <div className="products-page-header">
          <div>
            <h1>
              {getPageHeading()}
              {statusFilter !== 'all' && (
                <span className="filter-badge">
                  Filtered
                </span>
              )}
            </h1>
            <p className="header-subtitle">{getPageSubtitle()}</p>
          </div>
          <Link to="/admin/products/add" className="btn-add-product">
            <span>+ Add New Product</span>
          </Link>
        </div>

        {/* Analytics Metrics */}
        <div className="analytics-grid">
          <Link 
            to="/admin/products?filter=all" 
            className={`analytics-card clickable ${statusFilter === 'all' ? 'active-filter' : ''}`}
            title="Click to view all products"
          >
            <div className="analytics-icon total">📦</div>
            <div className="analytics-content">
              <p className="analytics-label">Total Products</p>
              <h3 className="analytics-value">{totalProducts}</h3>
            </div>
          </Link>

          <Link 
            to="/admin/products?filter=active" 
            className={`analytics-card clickable ${statusFilter === 'active' ? 'active-filter' : ''}`}
            title="Click to view active products"
          >
            <div className="analytics-icon active">✅</div>
            <div className="analytics-content">
              <p className="analytics-label">Active</p>
              <h3 className="analytics-value">{activeProducts}</h3>
            </div>
          </Link>

          <Link 
            to="/admin/products?filter=inactive" 
            className={`analytics-card clickable ${statusFilter === 'inactive' ? 'active-filter' : ''}`}
            title="Click to view inactive products"
          >
            <div className="analytics-icon inactive">⊘</div>
            <div className="analytics-content">
              <p className="analytics-label">Inactive</p>
              <h3 className="analytics-value">{inactiveProducts}</h3>
            </div>
          </Link>

          <Link 
            to="/admin/products?filter=out-of-stock" 
            className={`analytics-card clickable ${statusFilter === 'out-of-stock' ? 'active-filter' : ''}`}
            title="Click to view out of stock products"
          >
            <div className="analytics-icon outofstock">🚫</div>
            <div className="analytics-content">
              <p className="analytics-label">Out of Stock</p>
              <h3 className="analytics-value">{outOfStock}</h3>
            </div>
          </Link>

          <Link 
            to="/admin/products?filter=low-stock" 
            className={`analytics-card clickable ${statusFilter === 'low-stock' ? 'active-filter' : ''}`}
            title="Click to view low stock products"
          >
            <div className="analytics-icon lowstock">⚠️</div>
            <div className="analytics-content">
              <p className="analytics-label">Low Stock</p>
              <h3 className="analytics-value">{lowStock}</h3>
            </div>
          </Link>
        </div>

        {/* Sticky Toolbar */}
        <div className="toolbar-sticky">
          <div className="toolbar-left">
            <input
              type="text"
              placeholder="🔍 Search products or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="toolbar-search"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                const newFilter = e.target.value;
                setStatusFilter(newFilter);
                navigate(`/admin/products?filter=${newFilter}`);
              }}
              className="toolbar-filter"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="low-stock">Low Stock</option>
            </select>

            {statusFilter !== 'all' && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  navigate('/admin/products?filter=all');
                }}
                className="clear-filter-btn"
                title="Clear status filter"
              >
                ✕ Clear Filter
              </button>
            )}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="toolbar-filter"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="toolbar-sort"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-low">Low Stock First</option>
            </select>
          </div>

          <div className="toolbar-right">
            <span className="product-count">
              {filteredProducts.length} / {products.length} products
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-info">
              <input
                type="checkbox"
                checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                onChange={toggleSelectAll}
                className="bulk-checkbox"
              />
              <span className="bulk-count">{selectedProducts.size} selected</span>
            </div>

            <div className="bulk-buttons">
              <button
                onClick={() => handleBulkStatusChange('active')}
                className="bulk-btn activate"
                title="Activate selected products"
              >
                ✅ Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange('inactive')}
                className="bulk-btn deactivate"
                title="Deactivate selected products"
              >
                ⊘ Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="bulk-btn delete"
                title="Delete selected products"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>📭 No products found</p>
          </div>
        ) : (
          <div className="products-grid-container">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className={`product-card ${selectedProducts.has(product._id) ? 'selected' : ''}`}
              >
                {/* Card Checkbox */}
                <div className="card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="product-checkbox"
                  />
                </div>

                {/* Product Image */}
                <div className="card-image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Product+Image';
                    }}
                  />
                  <div className="card-status-overlay">
                    <button 
                      className={`status-pill ${product.status === 'active' ? 'status-active' : 'status-inactive'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleStatus(product._id, product.status);
                      }}
                      title="Click to toggle status"
                    >
                      <span className="status-indicator"></span>
                      <span className="status-text">{product.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                  {product.stock === 0 && <div className="out-of-stock-banner">Out of Stock</div>}
                  {product.stock > 0 && product.stock < 10 && <div className="low-stock-banner">Low Stock</div>}
                </div>

                {/* Product Details */}
                <div className="card-content">
                  <div className="card-header-section">
                    <h3 className="card-product-name" title={product.name}>{product.name}</h3>
                    <div className="card-meta-badges">
                      <span className="card-badge brand">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        {product.brand}
                      </span>
                      <span className="card-badge category">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <path d="M22 6l-10 7L2 6"></path>
                        </svg>
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="card-stats-grid">
                    <div className="stat-box stat-price">
                      <div className="stat-icon">₹</div>
                      <div className="stat-content">
                        <span className="stat-label">Price</span>
                        <span className="stat-value">₹{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="stat-box stat-stock">
                      <div className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <path d="M3.27 6.96L12 12.01l8.73-5.05"></path>
                          <path d="M12 22.08V12"></path>
                        </svg>
                      </div>
                      <div className="stat-content">
                        <span className="stat-label">Stock</span>
                        <span className={`stat-value ${product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : 'good'}`}>
                          {product.stock} units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions-modern">
                  <Link
                    to={`/admin/products/edit/${product._id}`}
                    className="action-btn-modern edit-btn-modern"
                    title="Edit product details"
                  >
                    <span className="btn-ripple"></span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span className="btn-text">Edit</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(product._id, product.name)}
                    className="action-btn-modern delete-btn-modern"
                    title="Delete this product"
                  >
                    <span className="btn-ripple"></span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span className="btn-text">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
