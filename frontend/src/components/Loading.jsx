import React, { useState, useEffect } from 'react';
import './Loading.css';

const Loading = ({ 
  showProgress = false, 
  progress = 0,
  showSkeletonCards = false 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random bubble properties
  const bubbles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 15, // 15-45px
    left: Math.random() * 85 + 5, // 5-90%
    delay: Math.random() * 4, // 0-4s
    duration: Math.random() * 3 + 4, // 4-7s
  }));

  return (
    <div className={`bubble-loading-container ${mounted ? 'mounted' : ''}`}>
      {/* Animated Gradient Background */}
      <div className="bubble-gradient-bg"></div>
      
      {/* Glass Card Container */}
      <div className="bubble-glass-card">
        {/* Bubbles Container */}
        <div className="bubbles-container">
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="bubble"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                animationDelay: `${bubble.delay}s`,
                animationDuration: `${bubble.duration}s`,
              }}
            >
              <div className="bubble-inner"></div>
            </div>
          ))}
        </div>
        
        {/* Loading Content */}
        <div className="bubble-loading-content">
          <h2 className="bubble-loading-text">Loading Dashboard</h2>
          <p className="bubble-loading-subtitle">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
