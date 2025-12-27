import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Only show sign out button on dashboard
  const showSignOut = location.pathname === '/dashboard';

  return (
    <header className="glass-header">
      <div className="logo-section">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div className="logo-text">
          <center>
            <h1>ATS Resume Scanner</h1>
            <p>AI-Powered Intelligent Recruitment System</p>
          </center>
        </div>
      </div>
      
      {showSignOut && (
        <div className="header-actions">
          {user && (
            <div className="user-info">
              <span className="user-email">{user.email}</span>
            </div>
          )}
          <button 
            className="sign-out-button"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;