import './LoadingOverlay.css';

const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-card">
        <div className="loading-overlay-spinner">
          <div className="loading-overlay-spinner-circle"></div>
          <div className="loading-overlay-spinner-inner"></div>
        </div>
        <h3 className="loading-overlay-title">{message}</h3>
        <div className="loading-overlay-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
