import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminProducts.css';

/**
 * Admin Products Dashboard
 * Modern, high-efficiency product management
 */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=100');
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await API.put(`/products/${id}`, { status: newStatus });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product status:', error);
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
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedProducts.size === 0) return;

    try {
      for (const id of selectedProducts) {
        await API.put(`/products/${id}`, { status });
      }
      fetchProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to update product status:', error);
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
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

  const categories = [...new Set(products.map(p => p.category))];

  // Analytics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-products-container">
          <div className="skeleton-header"></div>
          <div className="skeleton-metrics">
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
          </div>
          <div className="skeleton-list">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-products-container">
        {/* Header */}
        <div className="products-page-header">
          <div>
            <h1>Products Dashboard</h1>
            <p className="header-subtitle">Manage your entire product inventory efficiently</p>
          </div>
          <Link to="/admin/products/add" className="btn-add-product">
            <span>+ Add New Product</span>
          </Link>
        </div>

        {/* Analytics Metrics */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon total">📦</div>
            <div className="analytics-content">
              <p className="analytics-label">Total Products</p>
              <h3 className="analytics-value">{totalProducts}</h3>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon active">✅</div>
            <div className="analytics-content">
              <p className="analytics-label">Active</p>
              <h3 className="analytics-value">{activeProducts}</h3>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon outofstock">🚫</div>
            <div className="analytics-content">
              <p className="analytics-label">Out of Stock</p>
              <h3 className="analytics-value">{outOfStock}</h3>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon lowstock">⚠️</div>
            <div className="analytics-content">
              <p className="analytics-label">Low Stock</p>
              <h3 className="analytics-value">{lowStock}</h3>
            </div>
          </div>
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

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>📭 No products found</p>
          </div>
        ) : (
          <div className="products-list">
            {/* Column Header */}
            <div className="products-header-row">
              <div className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={toggleSelectAll}
                  className="row-checkbox"
                />
              </div>
              <div className="col-image">Image</div>
              <div className="col-details">Product Details</div>
              <div className="col-price">Price</div>
              <div className="col-stock">Stock</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>

            {/* Product Rows */}
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className={`product-row ${selectedProducts.has(product._id) ? 'selected' : ''}`}
              >
                {/* Checkbox */}
                <div className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="row-checkbox"
                  />
                </div>

                {/* Image */}
                <div className="col-image">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-thumbnail"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/50x50?text=Product';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="col-details">
                  <div className="product-details-content">
                    <h4 className="product-title">{product.name}</h4>
                    <div className="product-badges">
                      <span className="badge-brand" title={`Brand: ${product.brand}`}>
                        🏷️ {product.brand}
                      </span>
                      <span className="badge-category" title={`Category: ${product.category}`}>
                        📁 {product.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-price">
                  <div className="price-chip">
                    ₹{product.price.toLocaleString()}
                  </div>
                </div>

                {/* Stock */}
                <div className="col-stock">
                  <div className={`stock-chip ${product.stock === 0 ? 'outofstock' : product.stock < 10 ? 'lowstock' : 'instock'}`}>
                    {product.stock}
                  </div>
                </div>

                {/* Status */}
                <div className="col-status">
                  <span className={`status-pill status-${product.status}`}>
                    {product.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-actions">
                  <div className="actions-group">
                    <Link
                      to={`/admin/products/edit/${product._id}`}
                      className="action-btn edit"
                      title="Edit product"
                    >
                      ✏️
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(product._id, product.status)}
                      className="action-btn toggle"
                      title="Toggle product status"
                    >
                      🔄
                    </button>

                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      className="action-btn delete"
                      title="Delete product"
                    >
                      🗑️
                    </button>
                  </div>
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
