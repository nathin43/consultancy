import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import './AdminAddProduct.css';

/**
 * Admin Add Product Page
 */
const AdminAddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'TV',
    brand: '',
    stock: '',
    power: '',
    voltage: '',
    warranty: '',
    color: '',
    dimensions: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Wire & Cables', 'Fan', 'Pipes', 'Motors', 'Heater', 'Lights', 'Switches', 'Tank', 'Water Heater', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('brand', formData.brand);
      data.append('stock', formData.stock);
      
      if (image) {
        data.append('image', image);
      }

      // Specifications
      const specifications = {};
      if (formData.power) specifications.power = formData.power;
      if (formData.voltage) specifications.voltage = formData.voltage;
      if (formData.warranty) specifications.warranty = formData.warranty;
      if (formData.color) specifications.color = formData.color;
      if (formData.dimensions) specifications.dimensions = formData.dimensions;
      
      data.append('specifications', JSON.stringify(specifications));

      await API.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Product added successfully!');
      navigate('/admin/products');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-add-product">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back to Products
        </button>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>

              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="form-section">
              <h2>Specifications (Optional)</h2>

              <div className="form-group">
                <label>Power</label>
                <input
                  type="text"
                  name="power"
                  value={formData.power}
                  onChange={handleChange}
                  placeholder="e.g., 1200W"
                />
              </div>

              <div className="form-group">
                <label>Voltage</label>
                <input
                  type="text"
                  name="voltage"
                  value={formData.voltage}
                  onChange={handleChange}
                  placeholder="e.g., 220-240V"
                />
              </div>

              <div className="form-group">
                <label>Warranty</label>
                <input
                  type="text"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                  placeholder="e.g., 1 Year"
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Black"
                />
              </div>

              <div className="form-group">
                <label>Dimensions</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 55 inches"
                />
              </div>
            </div>

            {/* Product Image */}
            <div className="form-section">
              <h2>Product Image *</h2>

              <div className="form-group">
                <label>Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                <small className="text-muted">Recommended: 800x800px, max 5MB</small>
              </div>

              {preview && (
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
