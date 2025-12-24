import React from 'react';
import '../styles/FeaturesGrid.css';

const FeaturesGrid = () => {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      title: 'AI-Powered Parsing',
      description: 'Advanced algorithms extract candidate information with high accuracy from any resume format'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      ),
      title: 'ATS Compatibility Check',
      description: 'Identifies formatting issues and ensures resumes meet industry ATS standards'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
        </svg>
      ),
      title: 'Intelligent Ranking',
      description: 'Multi-factor scoring system ranks candidates based on skills, education, and experience'
    }
  ];

  return (
    <div className="features-grid">
      {features.map((feature, index) => (
        <div key={index} className="feature-card">
          <div className="feature-icon">
            {feature.icon}
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FeaturesGrid;