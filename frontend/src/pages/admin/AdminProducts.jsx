import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminProducts.css';

/**
 * Admin Products Page
 * Manage all products
 */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      alert('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-products">
        <div className="products-header">
          <div className="header-title">
            <h2>Products Management</h2>
            <p className="subtitle">Manage your product inventory</p>
          </div>
          <Link to="/admin/products/add" className="btn btn-primary btn-lg">
            <span>+ Add New Product</span>
          </Link>
        </div>

        <div className="products-filters-container">
          <div className="products-filters">
            <input
              type="text"
              placeholder="🔍 Search products by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="category-filter"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="products-count">
            📦 {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No products found</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image-container">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200?text=Product';
                    }}
                  />
                  <div className="product-overlay">
                    <div className="overlay-actions">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="btn btn-sm btn-primary"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        className="btn btn-sm btn-danger"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-header-info">
                    <h3 className="product-name">{product.name}</h3>
                    <span className={`status-badge badge-${product.status === 'active' ? 'success' : 'danger'}`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="product-meta">
                    <div className="meta-item">
                      <span className="meta-label">Brand:</span>
                      <span className="meta-value">{product.brand}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Category:</span>
                      <span className="meta-value">{product.category}</span>
                    </div>
                  </div>

                  <div className="product-footer">
                    <div className="price-stock">
                      <div className="price">
                        <span className="price-label">Price</span>
                        <span className="price-value">₹{product.price.toLocaleString()}</span>
                      </div>
                      <div className={`stock ${product.stock < 5 ? 'low-stock' : ''}`}>
                        <span className="stock-label">Stock</span>
                        <span className="stock-value">{product.stock}</span>
                      </div>
                    </div>
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
