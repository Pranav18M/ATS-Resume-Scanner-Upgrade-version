import React from 'react';

const LoadingSpinner = () => {
  const spinnerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    minHeight: '200px'
  };

  const spinnerCircleStyle = {
    border: '4px solid rgba(99, 102, 241, 0.1)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div style={spinnerStyle}>
      <div style={spinnerCircleStyle}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;