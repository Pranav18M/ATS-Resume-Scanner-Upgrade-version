import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHidden(true);
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isHidden ? 'hidden' : ''}`}>
      <div className="door-container">
        <div className="door door-left">
          <div className="door-content">
            <h1 className="splash-title">ATS</h1>
          </div>
        </div>
        <div className="door door-right">
          <div className="door-content">
            <h1 className="splash-title">Resume Scanner</h1>
          </div>
        </div>
      </div>
      <div className="splash-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
    </div>
  );
};

export default SplashScreen;