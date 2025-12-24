import React from 'react';
import '../styles/ResultsCard.css';

const ResultsCard = ({ results, onDownload }) => {
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  if (!results || results.length === 0) return null;

  return (
    <div className="glass-card results-card">
      <div className="results-header">
        <div className="results-title">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <div>
            <h2>Analysis Results</h2>
            <p>Top candidates ranked by ATS compatibility</p>
          </div>
        </div>
        <button className="btn-success" onClick={onDownload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Export Report</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Education</th>
              <th>Experience</th>
              <th>Skills Match</th>
              <th>Education Score</th>
              <th>Experience Score</th>
              <th>ATS Score</th>
              <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((candidate, index) => (
              <tr key={index} style={{ animationDelay: `${index * 0.05}s` }}>
                <td className="rank">#{candidate.rank}</td>
                <td><strong>{candidate.candidateName || 'N/A'}</strong></td>
                <td>{candidate.email || 'N/A'}</td>
                <td>{candidate.phone || 'N/A'}</td>
                <td>{candidate.degree || 'N/A'}</td>
                <td>{candidate.experience_years || '0'}</td>
                <td className={getScoreClass(candidate.skills_match)}>{candidate.skills_match}%</td>
                <td className={getScoreClass(candidate.education_match)}>{candidate.education_match}%</td>
                <td className={getScoreClass(candidate.experience_score)}>{candidate.experience_score}%</td>
                <td className={getScoreClass(candidate.ats_format_score)}>{candidate.ats_format_score}%</td>
                <td><strong className={getScoreClass(candidate.total_score)}>{candidate.total_score}%</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsCard;