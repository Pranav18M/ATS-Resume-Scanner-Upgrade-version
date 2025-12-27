import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authUtils from '../utils/auth';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHidden(true);
      
      // Check authentication after splash screen
      setTimeout(() => {
        const isAuthenticated = authUtils.isAuthenticated();
        const token = authUtils.getToken();
        
        if (isAuthenticated && token && !authUtils.isTokenExpired(token)) {
          // User is logged in, go to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // User is not logged in, go to login
          authUtils.clearAuth();
          navigate('/login', { replace: true });
        }
        
        if (onComplete) onComplete();
      }, 500);
    }, 3000); // 3 seconds splash screen

    return () => clearTimeout(timer);
  }, [navigate, onComplete]);

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