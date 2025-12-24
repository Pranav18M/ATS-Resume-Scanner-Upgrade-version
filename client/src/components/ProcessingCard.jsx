import React from 'react';
import '../styles/ProcessingCard.css';

const ProcessingCard = ({ progress }) => {
  return (
    <div className="glass-card processing-card">
      <div className="processing-content">
        <div className="processing-animation">
          <div className="scan-line"></div>
          <svg className="processing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3>Analyzing Resumes</h3>
        <p>AI is extracting data and ranking candidates</p>
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-label">Processing: {Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingCard;