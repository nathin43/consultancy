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
  const categories = ['Wire & Cables', 'Fan', 'Pipes', 'Motors', 'Heater', 'Lights', 'Switches', 'Tank', 'Water Heater', 'Other'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: categories[0],
    brand: '',
    stock: '',
    specifications: {}
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specificationConfig = {
    'Fan': {
      icon: '🌀',
      required: [
        { key: 'bladeSize', label: 'Blade Size (inches)', type: 'number', placeholder: 'e.g., 48' },
        { key: 'sweep', label: 'Sweep (mm)', type: 'number', placeholder: 'e.g., 1200' },
        { key: 'speedRpm', label: 'Speed (RPM)', type: 'number', placeholder: 'e.g., 350' },
        { key: 'powerConsumption', label: 'Power Consumption (W)', type: 'number', placeholder: 'e.g., 75' },
        { key: 'mountType', label: 'Mount Type', type: 'select', options: ['Ceiling', 'Wall', 'Table', 'Pedestal', 'Exhaust'] }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' }
      ]
    },
    'Motors': {
      icon: '⚙️',
      required: [
        { key: 'powerHp', label: 'Power (HP)', type: 'text', placeholder: 'e.g., 1 HP' },
        { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' },
        { key: 'phase', label: 'Phase', type: 'select', options: ['Single Phase', 'Three Phase'] },
        { key: 'rpm', label: 'RPM', type: 'number', placeholder: 'e.g., 1440' },
        { key: 'insulationClass', label: 'Insulation Class', type: 'select', options: ['Class A', 'Class B', 'Class F', 'Class H'] }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 1 Year' }
      ]
    },
    'Wire & Cables': {
      icon: '🔌',
      required: [
        { key: 'coreType', label: 'Core Type', type: 'select', options: ['Single Core', 'Multi Core', 'Flexible', 'Armoured'] },
        { key: 'wireGauge', label: 'Wire Gauge (sq mm)', type: 'text', placeholder: 'e.g., 1.5 sq mm' },
        { key: 'length', label: 'Length (meters)', type: 'number', placeholder: 'e.g., 100' },
        { key: 'conductorMaterial', label: 'Conductor Material', type: 'select', options: ['Copper', 'Aluminum', 'Copper Clad Aluminum'] },
        { key: 'insulationType', label: 'Insulation Type', type: 'select', options: ['PVC', 'XLPE', 'Rubber', 'FRLS'] }
      ],
      optional: [
        { key: 'voltageRating', label: 'Voltage Rating', type: 'text', placeholder: 'e.g., 1100V' },
        { key: 'isiCertified', label: 'ISI Certified', type: 'select', options: ['Yes', 'No'] }
      ]
    },
    'Heater': {
      icon: '🔥',
      required: [
        { key: 'powerWatt', label: 'Power (Watt)', type: 'number', placeholder: 'e.g., 2000' },
        { key: 'temperatureRange', label: 'Temperature Range', type: 'text', placeholder: 'e.g., 25-75°C' },
        { key: 'safetyFeatures', label: 'Safety Features', type: 'textarea', placeholder: 'e.g., Auto Cut-off, Thermostat, Pressure Relief Valve' }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' },
        { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 25' }
      ]
    },
    'Pipes': {
      icon: '🚰',
      required: [
        { key: 'diameter', label: 'Diameter (mm / inch)', type: 'text', placeholder: 'e.g., 25mm or 1 inch' },
        { key: 'length', label: 'Length (meters / feet)', type: 'text', placeholder: 'e.g., 3m or 10ft' },
        { key: 'material', label: 'Material', type: 'select', options: ['PVC', 'CPVC', 'UPVC', 'GI', 'PPR', 'HDPE'] },
        { key: 'pressureRating', label: 'Pressure Rating', type: 'select', options: ['Low Pressure', 'Medium Pressure', 'High Pressure', 'SDR 11', 'SDR 13.5'] }
      ],
      optional: [
        { key: 'usageType', label: 'Usage Type', type: 'select', options: ['Water Supply', 'Drainage', 'Sewage', 'Irrigation'] },
        { key: 'isiCertified', label: 'ISI Certified', type: 'select', options: ['Yes', 'No'] }
      ]
    },
    // Keep existing configs for other categories
    'Tank': {
      icon: '🛢️',
      required: [
        { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 100' },
        { key: 'material', label: 'Material', type: 'select', options: ['Plastic', 'Steel', 'Fiber'] },
        { key: 'layers', label: 'Number of Layers', type: 'select', options: ['3', '4', '5'] },
        { key: 'height', label: 'Height', type: 'text', placeholder: 'e.g., 1.2m' },
        { key: 'diameter', label: 'Diameter', type: 'text', placeholder: 'e.g., 900mm' }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 5 Years' },
        { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g., Black' }
      ]
    },
    'Switches': {
      icon: '💡',
      required: [
        { key: 'switchType', label: 'Switch Type', type: 'select', options: ['Modular', 'Non-Modular', 'Dimmer', 'Touch'] },
        { key: 'currentRating', label: 'Current Rating', type: 'select', options: ['6A', '10A', '16A', '20A'] },
        { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220-240V' },
        { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g., White' }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' },
        { key: 'plateIncluded', label: 'Plate Included', type: 'select', options: ['Yes', 'No'] }
      ]
    },
    'Lights': {
      icon: '💡',
      required: [
        { key: 'lightType', label: 'Light Type', type: 'select', options: ['LED', 'Tube Light', 'Bulb', 'Panel Light', 'Street Light'] },
        { key: 'wattage', label: 'Wattage (W)', type: 'number', placeholder: 'e.g., 12' },
        { key: 'colorTemperature', label: 'Color Temperature', type: 'select', options: ['Warm White (3000K)', 'Cool White (4000K)', 'Daylight (6500K)'] },
        { key: 'lumens', label: 'Lumens', type: 'number', placeholder: 'e.g., 800' }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 1 Year' },
        { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' }
      ]
    },
    'Water Heater': {
      icon: '🚿',
      required: [
        { key: 'capacityLiters', label: 'Capacity (Liters)', type: 'number', placeholder: 'e.g., 25' },
        { key: 'powerWatt', label: 'Power (Watt)', type: 'number', placeholder: 'e.g., 2000' },
        { key: 'voltage', label: 'Voltage', type: 'text', placeholder: 'e.g., 220V' },
        { key: 'heatingElementType', label: 'Heating Element Type', type: 'text', placeholder: 'e.g., Copper' },
        { key: 'innerTankMaterial', label: 'Inner Tank Material', type: 'text', placeholder: 'e.g., Stainless Steel' }
      ],
      optional: [
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 2 Years' }
      ]
    },
    'Other': {
      icon: '📦',
      required: [],
      optional: [
        { key: 'specifications', label: 'Specifications', type: 'textarea', placeholder: 'Enter product specifications...' }
      ]
    }
  };

  const getCategoryKey = (category) => {
    // Direct mapping for categories that match config keys
    const categoryMap = {
      'Fan': 'Fan',
      'Motor': 'Motors',
      'Motors': 'Motors',
      'Wire & Cables': 'Wire & Cables',
      'Heater': 'Heater',
      'Water Heater': 'Water Heater',
      'Pipe': 'Pipes',
      'Pipes': 'Pipes',
      'Tank': 'Tank',
      'Switch': 'Switches',
      'Switches': 'Switches',
      'Light': 'Lights',
      'Lights': 'Lights',
      'Other': 'Other'
    };

    return categoryMap[category] || category;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        specifications: {} // Reset specifications when category changes
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
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
      const specifications = Object.entries(formData.specifications).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

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

  const activeCategoryKey = getCategoryKey(formData.category);
  const activeSpecConfig = specificationConfig[activeCategoryKey] || { required: [], optional: [] };

  const renderSpecField = (field, isRequired) => {
    const value = formData.specifications[field.key] || '';
    const commonProps = {
      name: field.key,
      value,
      onChange: (e) => handleSpecChange(field.key, e.target.value),
      required: isRequired,
      placeholder: field.placeholder
    };

    if (field.type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select {field.label}</option>
          {field.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={4}
        />
      );
    }

    return (
      <input
        type={field.type || 'text'}
        {...commonProps}
      />
    );
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
              <h2>{activeCategoryKey} Specifications</h2>

              <div key={activeCategoryKey} className="specifications-panel">
                {activeSpecConfig.required.length === 0 && activeSpecConfig.optional.length === 0 ? (
                  <p className="text-muted">No specifications for this category.</p>
                ) : (
                  <>
                    <div className="spec-group">
                      <div className="spec-group-header">Required</div>
                      <div className="form-row">
                        {activeSpecConfig.required.map(field => (
                          <div className="form-group" key={field.key}>
                            <label>{field.label} *</label>
                            {renderSpecField(field, true)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeSpecConfig.optional.length > 0 && (
                      <div className="spec-group optional">
                        <div className="spec-group-header">Optional</div>
                        <div className="form-row">
                          {activeSpecConfig.optional.map(field => (
                            <div className="form-group" key={field.key}>
                              <label>{field.label}</label>
                              {renderSpecField(field, false)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
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
