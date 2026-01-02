import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import API from '../../services/api';
import '../admin/AdminAddProduct.css';

/**
 * Admin Edit Product Page
 */
const AdminEditProduct = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Wire & Cables', 'Fan', 'Pipes', 'Motors', 'Heater', 'Lights', 'Switches', 'Tank', 'Water Heater', 'Other'];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await API.get(`/products/${id}`);
      const product = data.product;
      
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        power: product.specifications?.power || '',
        voltage: product.specifications?.voltage || '',
        warranty: product.specifications?.warranty || '',
        color: product.specifications?.color || '',
        dimensions: product.specifications?.dimensions || ''
      });
      
      setPreview(product.image);
    } catch (error) {
      alert('Product not found');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

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
    setSubmitting(true);

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

      const specifications = {};
      if (formData.power) specifications.power = formData.power;
      if (formData.voltage) specifications.voltage = formData.voltage;
      if (formData.warranty) specifications.warranty = formData.warranty;
      if (formData.color) specifications.color = formData.color;
      if (formData.dimensions) specifications.dimensions = formData.dimensions;
      
      data.append('specifications', JSON.stringify(specifications));

      await API.put(`/products/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Product updated successfully!');
      navigate('/admin/products');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner"></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-add-product">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back to Products
        </button>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
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
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Specifications (Optional)</h2>

              <div className="form-group">
                <label>Power</label>
                <input
                  type="text"
                  name="power"
                  value={formData.power}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Voltage</label>
                <input
                  type="text"
                  name="voltage"
                  value={formData.voltage}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Warranty</label>
                <input
                  type="text"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Dimensions</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Product Image</h2>

              <div className="form-group">
                <label>Upload New Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small className="text-muted">Leave empty to keep current image</small>
              </div>

              {preview && (
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating Product...' : 'Update Product'}
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

export default AdminEditProduct;
