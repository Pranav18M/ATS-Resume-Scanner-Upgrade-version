// report.js
const PDFDocument = require('pdfkit');
const getStream = require('get-stream');

// ============================================================================
// SECTION 7: FINAL WEIGHTED ATS SCORE & EXPLAINABILITY
// ============================================================================

/**
 * Calculate Final Weighted ATS Score (0-100)
 * Combines all individual scores with proper weights
 */
function calculateFinalATSScore(candidateData, weights = null) {
  try {
    // Default weights if not provided
    const defaultWeights = {
      jobRoleMatch: 25,      // 25%
      skillMatch: 40,        // 40%
      experienceMatch: 20,   // 20%
      educationMatch: 10,    // 10%
      resumeQuality: 5       // 5%
    };
    
    const w = weights || defaultWeights;
    
    // Validate weights sum to 100
    const weightSum = Object.values(w).reduce((sum, val) => sum + val, 0);
    if (Math.abs(weightSum - 100) > 0.01) {
      throw new Error(`Weights must sum to 100. Current sum: ${weightSum}`);
    }
    
    // Extract scores from candidate data (normalize to 0-100 scale)
    let jobRoleScore = 0;
    let skillScore = 0;
    let experienceScore = 0;
    let educationScore = 0;
    let qualityScore = 0;
    
    // Job Role Match Score (AI Semantic Matching)
    if (candidateData.ai_job_role_similarity !== null && candidateData.ai_job_role_similarity !== undefined) {
      jobRoleScore = candidateData.ai_job_role_similarity * 100; // Convert 0-1 to 0-100
    } else if (candidateData.job_relevance !== null && candidateData.job_relevance !== undefined) {
      jobRoleScore = candidateData.job_relevance; // Already 0-100
    }
    
    // Skill Match Score
    if (candidateData.advanced_skills && candidateData.advanced_skills.skillScore !== undefined) {
      skillScore = (candidateData.advanced_skills.skillScore / 40) * 100; // Normalize from 40 to 100
    } else if (candidateData.skills_match !== null && candidateData.skills_match !== undefined) {
      skillScore = candidateData.skills_match; // Already 0-100
    }
    
    // Experience Score
    if (candidateData.advanced_experience && candidateData.advanced_experience.experienceScore !== undefined) {
      experienceScore = (candidateData.advanced_experience.experienceScore / 15) * 100; // Normalize from 15 to 100
    } else if (candidateData.experience_score !== null && candidateData.experience_score !== undefined) {
      experienceScore = candidateData.experience_score; // Already 0-100
    }
    
    // Education Score
    if (candidateData.advanced_education && candidateData.advanced_education.educationScore !== undefined) {
      educationScore = (candidateData.advanced_education.educationScore / 10) * 100; // Normalize from 10 to 100
    } else if (candidateData.education_match !== null && candidateData.education_match !== undefined) {
      educationScore = candidateData.education_match; // Already 0-100
    }
    
    // Resume Quality Score
    if (candidateData.advanced_quality && candidateData.advanced_quality.resumeQualityScore !== undefined) {
      qualityScore = (candidateData.advanced_quality.resumeQualityScore / 5) * 100; // Normalize from 5 to 100
    } else if (candidateData.ats_format_score !== null && candidateData.ats_format_score !== undefined) {
      qualityScore = candidateData.ats_format_score; // Already 0-100
    }
    
    // Calculate weighted final score
    const finalScore = (
      (jobRoleScore * w.jobRoleMatch / 100) +
      (skillScore * w.skillMatch / 100) +
      (experienceScore * w.experienceMatch / 100) +
      (educationScore * w.educationMatch / 100) +
      (qualityScore * w.resumeQuality / 100)
    );
    
    return {
      finalScore: Math.round(Math.max(0, Math.min(100, finalScore))),
      breakdown: {
        jobRoleScore: Math.round(jobRoleScore),
        skillScore: Math.round(skillScore),
        experienceScore: Math.round(experienceScore),
        educationScore: Math.round(educationScore),
        qualityScore: Math.round(qualityScore)
      },
      weights: w,
      success: true
    };
    
  } catch (error) {
    return {
      finalScore: 0,
      breakdown: {},
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate hiring recommendation based on final score
 */
function generateRecommendation(finalScore) {
  if (finalScore >= 85) {
    return {
      level: 'Strong Fit',
      action: 'Highly Recommended',
      priority: 'High',
      message: 'Excellent candidate - Schedule interview immediately'
    };
  } else if (finalScore >= 70) {
    return {
      level: 'Good Fit',
      action: 'Recommended',
      priority: 'Medium-High',
      message: 'Strong candidate - Add to interview shortlist'
    };
  } else if (finalScore >= 55) {
    return {
      level: 'Moderate Fit',
      action: 'Consider',
      priority: 'Medium',
      message: 'Potential candidate - Review carefully before proceeding'
    };
  } else if (finalScore >= 40) {
    return {
      level: 'Weak Fit',
      action: 'Review with Caution',
      priority: 'Low',
      message: 'Below expectations - Consider only if talent pool is limited'
    };
  } else {
    return {
      level: 'Poor Fit',
      action: 'Not Recommended',
      priority: 'Very Low',
      message: 'Does not meet minimum requirements - Not suitable for role'
    };
  }
}

/**
 * Identify candidate strengths from data
 */
function identifyStrengths(candidateData) {
  const strengths = [];
  
  // Check skills
  if (candidateData.advanced_skills && candidateData.advanced_skills.matchedCoreSkills) {
    strengths.push(...candidateData.advanced_skills.matchedCoreSkills);
  }
  
  // Check experience
  if (candidateData.advanced_experience && candidateData.advanced_experience.meetRequirement) {
    strengths.push(`${candidateData.experience_years}+ years experience`);
  }
  
  // Check education
  if (candidateData.advanced_education && candidateData.advanced_education.degreeMatch) {
    strengths.push(candidateData.degree);
  }
  
  // Check AI match
  if (candidateData.ai_match_level && 
      (candidateData.ai_match_level === 'Excellent Match' || candidateData.ai_match_level === 'Good Match')) {
    strengths.push('Strong role alignment');
  }
  
  // Check resume quality
  if (candidateData.advanced_quality && candidateData.advanced_quality.qualityPercentage >= 70) {
    strengths.push('Professional resume');
  }
  
  return strengths.length > 0 ? strengths : ['Basic qualifications present'];
}

/**
 * Identify candidate gaps/weaknesses
 */
function identifyGaps(candidateData) {
  const gaps = [];
  
  // Check missing core skills
  if (candidateData.advanced_skills && candidateData.advanced_skills.missingCoreSkills) {
    gaps.push(...candidateData.advanced_skills.missingCoreSkills);
  } else if (candidateData.missing_skills && candidateData.missing_skills.length > 0) {
    gaps.push(...candidateData.missing_skills.slice(0, 3)); // Top 3 missing
  }
  
  // Check experience
  if (candidateData.advanced_experience && !candidateData.advanced_experience.meetRequirement) {
    gaps.push('Insufficient experience');
  }
  
  // Check education
  if (candidateData.advanced_education && !candidateData.advanced_education.degreeMatch) {
    gaps.push('Education below requirement');
  }
  
  // Check resume quality issues
  if (candidateData.advanced_quality && candidateData.advanced_quality.issues && 
      candidateData.advanced_quality.issues.length > 0) {
    gaps.push('Resume formatting issues');
  }
  
  return gaps.length > 0 ? gaps : ['None identified'];
}

/**
 * Generate comprehensive explanation for HR users
 */
function generateExplanation(candidateData, finalScore, recommendation) {
  let explanation = '';
  
  // Overall assessment
  explanation += `This candidate achieved an overall ATS score of ${finalScore}/100, indicating a ${recommendation.level.toLowerCase()}. `;
  
  // Job role alignment
  if (candidateData.ai_match_level) {
    explanation += `AI semantic analysis shows ${candidateData.ai_match_level.toLowerCase()}. `;
  }
  
  // Skills assessment
  if (candidateData.advanced_skills) {
    const coreMatch = candidateData.advanced_skills.coreMatchPercentage;
    if (coreMatch >= 80) {
      explanation += `Strong skills alignment with ${coreMatch}% of core requirements met. `;
    } else if (coreMatch >= 60) {
      explanation += `Moderate skills match with ${coreMatch}% of core requirements met. `;
    } else {
      explanation += `Limited skills match with only ${coreMatch}% of core requirements met. `;
    }
  }
  
  // Experience assessment
  if (candidateData.advanced_experience) {
    if (candidateData.advanced_experience.meetRequirement) {
      explanation += `Experience requirements satisfied. `;
    } else {
      explanation += `Experience below requirements. `;
    }
  }
  
  // Education assessment
  if (candidateData.advanced_education) {
    if (candidateData.advanced_education.degreeMatch) {
      explanation += `Educational qualifications meet standards. `;
    } else {
      explanation += `Educational background needs review. `;
    }
  }
  
  // Final recommendation
  explanation += recommendation.message;
  
  return explanation;
}

/**
 * Main function: Generate complete explainable ATS assessment
 */
function generateExplainableATSScore(candidateData, customWeights = null) {
  try {
    // Calculate final score
    const scoreResult = calculateFinalATSScore(candidateData, customWeights);
    
    if (!scoreResult.success) {
      throw new Error(scoreResult.error);
    }
    
    const finalScore = scoreResult.finalScore;
    
    // Generate recommendation
    const recommendation = generateRecommendation(finalScore);
    
    // Identify strengths and gaps
    const strengths = identifyStrengths(candidateData);
    const gaps = identifyGaps(candidateData);
    
    // Generate explanation
    const explanation = generateExplanation(candidateData, finalScore, recommendation);
    
    return {
      finalScore,
      recommendation: recommendation.level,
      action: recommendation.action,
      priority: recommendation.priority,
      strengths,
      gaps,
      explanation,
      breakdown: scoreResult.breakdown,
      weights: scoreResult.weights,
      candidateName: candidateData.candidateName || 'Unknown',
      success: true
    };
    
  } catch (error) {
    return {
      finalScore: 0,
      recommendation: 'Error',
      action: 'N/A',
      priority: 'N/A',
      strengths: [],
      gaps: [],
      explanation: error.message,
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// ENHANCED PDF REPORT GENERATION
// ============================================================================

async function buildReportBuffer(payload) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = doc.pipe(require('stream').PassThrough());

  // Header
  doc.fontSize(18).text('ATS Resume Scanner Report', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(0.5);

  const jobRole = payload.job_role || 'Not specified';
  const skills = (payload.required_skills || payload.core_skills || []).join(', ') || 'Not specified';
  const minDegree = payload.min_degree || '—';
  const minExp = payload.min_experience_years || '—';
  
  doc.fontSize(11).text(`Job Role: ${jobRole}`);
  doc.text(`Required Skills: ${skills}`);
  doc.text(`Min Degree: ${minDegree}    Min Experience: ${minExp} years`);
  doc.moveDown(0.5);

  // Weights section
  const weights = payload.weights || payload.ats_weights || { 
    jobRoleMatch: 25, skillMatch: 40, experienceMatch: 20, educationMatch: 10, resumeQuality: 5 
  };
  
  doc.text(`Scoring Weights — Job Role: ${weights.jobRoleMatch || 25}% | Skills: ${weights.skillMatch || 40}% | Experience: ${weights.experienceMatch || 20}% | Education: ${weights.educationMatch || 10}% | Quality: ${weights.resumeQuality || 5}%`);
  doc.moveDown(1);

  // Statistics summary
  const results = payload.results || [];
  if (results.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Candidates Analyzed: ${results.length}`);
    
    const avgScore = results.reduce((sum, r) => sum + (r.total_score || 0), 0) / results.length;
    doc.text(`Average Score: ${avgScore.toFixed(2)}`);
    
    const strongFit = results.filter(r => (r.total_score || 0) >= 85).length;
    const goodFit = results.filter(r => (r.total_score || 0) >= 70 && (r.total_score || 0) < 85).length;
    doc.text(`Strong Fit (85+): ${strongFit} | Good Fit (70-84): ${goodFit}`);
    doc.moveDown(1);
  }

  // Table configuration
  const startX = 40;
  let y = doc.y + 10;
  const rowHeight = 25;
  const colWidths = [30, 110, 120, 100, 70, 40, 50];

  const headers = ['Rank', 'Candidate', 'Email', 'Phone', 'Degree', 'Exp', 'Score'];

  // Draw table headers
  let x = startX;
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowHeight).stroke();
    doc.text(h, x + 3, y + 7, { width: colWidths[i] - 6, align: 'left' });
    x += colWidths[i];
  });

  y += rowHeight;
  doc.font('Helvetica');

  // Draw table rows
  for (const r of results.slice(0, 200)) {
    if (y > 720) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const rowValues = [
      r.rank || '-',
      (r.candidateName || '-').substring(0, 20),
      (r.email || '-').substring(0, 25),
      (r.phone || '-').substring(0, 15),
      r.degree || '-',
      r.experience_years || '-',
      r.total_score ? r.total_score.toFixed(1) : '-',
    ];
    rowValues.forEach((val, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(String(val), x + 3, y + 7, { width: colWidths[i] - 6, align: 'left' });
      x += colWidths[i];
    });
    y += rowHeight;
  }

  // Add detailed analysis for top 3 candidates
  if (results.length > 0) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Top Candidates - Detailed Analysis', { align: 'center' });
    doc.moveDown(1);

    const topCandidates = results.slice(0, 3);
    
    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i];
      
      // Generate explainable score
      const analysis = generateExplainableATSScore(candidate, weights);
      
      doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${candidate.candidateName || 'Unknown'}`, { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Email: ${candidate.email || 'N/A'} | Phone: ${candidate.phone || 'N/A'}`);
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text(`Final ATS Score: ${analysis.finalScore}/100`, { continued: false });
      doc.font('Helvetica').text(`Recommendation: ${analysis.recommendation} (${analysis.action})`);
      doc.text(`Priority: ${analysis.priority}`);
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Strengths:', { continued: false });
      doc.font('Helvetica').text(`• ${analysis.strengths.join('\n• ')}`);
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Gaps:', { continued: false });
      doc.font('Helvetica').text(`• ${analysis.gaps.join('\n• ')}`);
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Assessment:', { continued: false });
      doc.font('Helvetica').text(analysis.explanation, { align: 'justify' });
      doc.moveDown(0.5);
      
      // Score breakdown
      if (analysis.breakdown) {
        doc.fontSize(9).font('Helvetica').text(
          `Breakdown: Job Role ${analysis.breakdown.jobRoleScore}/100 | Skills ${analysis.breakdown.skillScore}/100 | Experience ${analysis.breakdown.experienceScore}/100 | Education ${analysis.breakdown.educationScore}/100 | Quality ${analysis.breakdown.qualityScore}/100`,
          { align: 'left' }
        );
      }
      
      doc.moveDown(1);
      
      if (i < topCandidates.length - 1) {
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);
      }
    }
  }

  doc.end();
  const buffer = await getStream.buffer(stream);
  return buffer;
}

module.exports = { 
  buildReportBuffer,
  calculateFinalATSScore,
  generateExplainableATSScore,
  generateRecommendation,
  identifyStrengths,
  identifyGaps
};