import React from 'react';
import '../styles/Header.css';

const Header = () => {
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
    </header>
  );
};

export default Header;