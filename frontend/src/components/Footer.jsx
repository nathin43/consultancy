import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Footer Component
 * Site footer with links and information
 */
const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>⚡ Mani Electrical</h3>
            <p>Your trusted online store for all electrical appliances and electronics.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Categories</h4>
            <ul>
              <li><Link to="/products?category=Wire & Cables">Wire & Cables</Link></li>
              <li><Link to="/products?category=Pipes">Pipes</Link></li>
              <li><Link to="/products?category=Heater">Heater</Link></li>
              <li><Link to="/products?category=Motors">Motors</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 manielectricalshop@gmail.com</p>
            <p>📞 +91-9095399271</p>
            <p>📍 Kunnathur Road, Perundurai 638052</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Mani Electrical. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
