import React from 'react';
import '../styles/JobRequirements.css';

const JobRequirements = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="glass-card config-card">
      <div className="card-header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <h2>Job Requirements</h2>
          <p>Define your ideal candidate profile</p>
        </div>
      </div>

      <div className="config-grid">
        <div className="input-group full-width">
          <label htmlFor="jobRole">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Job Role
          </label>
          <input 
            id="jobRole" 
            name="jobRole"
            type="text" 
            placeholder="e.g., Senior Full-Stack Developer"
            value={formData.jobRole}
            onChange={handleChange}
          />
        </div>

        <div className="input-group full-width">
          <label htmlFor="requiredSkills">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Required Skills
          </label>
          <input 
            id="requiredSkills" 
            name="requiredSkills"
            type="text" 
            placeholder="e.g., React, Node.js, TypeScript, AWS, Docker"
            value={formData.requiredSkills}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="minDegree">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
            Minimum Degree
          </label>
          <select 
            id="minDegree" 
            name="minDegree"
            value={formData.minDegree}
            onChange={handleChange}
          >
            <option value="">Not Required</option>
            <option>Bachelors</option>
            <option>Masters</option>
            <option>PhD</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="minExp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Years of Experience
          </label>
          <input 
            id="minExp" 
            name="minExp"
            type="number" 
            min="0" 
            step="1" 
            placeholder="e.g., 3"
            value={formData.minExp}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default JobRequirements;