import React, { useState } from 'react';
import './UPIPayment.css';

/**
 * UPI Payment Component
 * Displays UPI payment options with logos (Google Pay, Paytm, PhonePe)
 */
const UPIPayment = ({ upiId, onUpiIdChange, selectedUpiProvider, onProviderChange }) => {
  const [showQRCode, setShowQRCode] = useState(false);

  const upiProviders = [
    {
      id: 'gpay',
      name: 'Google Pay',
      logo: '📱',
      color: '#5F6368',
      description: 'Fast & secure payment'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      logo: '💳',
      color: '#00A4EF',
      description: 'Cashback & offers'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      logo: '🔵',
      color: '#5F27CD',
      description: 'Instant money transfer'
    }
  ];

  // Generate UPI string for deeplink
  const generateUPIString = (provider) => {
    const upiString = `upi://pay?pa=${upiId}&pn=Electrical%20Shop&am=0&tn=Payment%20for%20order`;
    return upiString;
  };

  // Generate QR code link (using external service)
  const generateQRCodeUrl = (upiString) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  };

  return (
    <div className="upi-payment-container">
      <h3>Select UPI Payment Method</h3>
      
      <div className="upi-providers-grid">
        {upiProviders.map(provider => (
          <div key={provider.id} className="upi-provider-card">
            <input
              type="radio"
              id={`upi-${provider.id}`}
              name="upiProvider"
              value={provider.id}
              checked={selectedUpiProvider === provider.id}
              onChange={() => onProviderChange(provider.id)}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor={`upi-${provider.id}`}
              className={`upi-provider-label ${selectedUpiProvider === provider.id ? 'selected' : ''}`}
              style={{
                borderColor: selectedUpiProvider === provider.id ? provider.color : '#ddd',
                backgroundColor: selectedUpiProvider === provider.id ? `${provider.color}15` : 'white'
              }}
            >
              <div className="upi-logo" style={{ fontSize: '32px' }}>
                {provider.logo}
              </div>
              <div className="upi-provider-name">{provider.name}</div>
              <div className="upi-provider-desc">{provider.description}</div>
              {selectedUpiProvider === provider.id && (
                <div className="upi-checkmark">✓</div>
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="upi-input-section">
        <h4>Enter Your UPI ID</h4>
        <div className="upi-input-group">
          <input
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => onUpiIdChange(e.target.value)}
            className="upi-input"
            pattern="^[a-zA-Z0-9._-]+@[a-zA-Z]+$"
          />
          <div className="upi-info">
            <p>💡 <strong>Popular UPI IDs:</strong></p>
            <ul>
              <li>yourname@okhdfcbank</li>
              <li>yourname@okaxis</li>
              <li>yourname@okicici</li>
              <li>yourname@upi (generic)</li>
            </ul>
          </div>
        </div>
      </div>

      {upiId && selectedUpiProvider && (
        <div className="upi-payment-actions">
          <button 
            type="button"
            className="btn-qr-code"
            onClick={() => setShowQRCode(!showQRCode)}
          >
            {showQRCode ? '🔍 Hide QR Code' : '📲 Show QR Code'}
          </button>

          {showQRCode && (
            <div className="qr-code-display">
              <p>Scan this QR code with your UPI app:</p>
              <img 
                src={generateQRCodeUrl(generateUPIString(selectedUpiProvider))} 
                alt="UPI QR Code"
                className="qr-code-image"
              />
            </div>
          )}
        </div>
      )}

      <div className="upi-security-info">
        <p>🔒 <strong>Security:</strong> Your UPI details are secure and encrypted. We don't store card details.</p>
      </div>
    </div>
  );
};

export default UPIPayment;
