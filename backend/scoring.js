// scoring.js
const axios = require('axios');

const SYN_MAP = {
  js: ['javascript'],
  node: ['nodejs','node.js'],
  react: ['reactjs','react.js'],
  aws: ['amazon web services'],
  ml: ['machine learning'],
  ai: ['artificial intelligence']
};

const DEGREE_ORDER = { Diploma:1, Bachelors:2, Masters:3, PhD:4, '':0 };

function norm(text) {
  return text ? text.toLowerCase().replace(/[^a-z0-9+.# ]+/g, ' ') : '';
}

function expandSkill(skill) {
  const s = (skill || '').trim().toLowerCase();
  const variants = new Set([s]);
  for (const k of Object.keys(SYN_MAP)) {
    const vs = SYN_MAP[k];
    if (s === k || vs.includes(s)) {
      variants.add(k);
      vs.forEach(v => variants.add(v));
    }
  }
  return Array.from(variants);
}

function tokenize(text) {
  return norm(text).split(/\s+/).filter(Boolean);
}

function skillMatchScore(resume_text, required_skills) {
  const txt = norm(resume_text);
  const toks = tokenize(txt);
  let hits = 0;
  const missing_skills = [];
  for (const s of required_skills) {
    const variants = expandSkill(s);
    const found = variants.some(v => txt.includes(v) || toks.includes(v));
    if (found) hits++;
    else missing_skills.push(s);
  }
  const score = required_skills.length ? +(100.0 * (hits / required_skills.length)).toFixed(2) : 0;
  return { score, missing_skills };
}

function educationMatchScore(resume_degree, min_degree) {
  if (!min_degree) return 100.0;
  const want = DEGREE_ORDER[min_degree] || 0;
  const have = DEGREE_ORDER[resume_degree] || 0;
  if (have <= 0) return 0.0;
  return have >= want ? 100.0 : 50.0;
}

function experienceScore(exp_years, min_required) {
  if (!exp_years || exp_years <= 0) return 0.0;
  if (!min_required) return Math.min(100.0, exp_years * 15);
  if (exp_years >= min_required) return Math.min(100.0, 80 + (exp_years - min_required) * 5);
  const pct = exp_years / Math.max(1, min_required);
  return Math.max(20.0, 100.0 * pct);
}

function atsFormatScore(text, images_count, tables_count, contact, sections) {
  let score = 100.0;
  score -= Math.min(30.0, images_count * 5.0);
  score -= Math.min(20.0, tables_count * 5.0);
  const good_sections = ['summary','skills','experience','education'].reduce((acc, k) => acc + (sections[k] ? 1 : 0), 0);
  score += good_sections * 2.5;
  if (!contact || !contact.email || !contact.phone) score -= 15;
  if (!text || text.trim().length < 400) score -= 25;
  return +Math.max(0, Math.min(100, score)).toFixed(2);
}

function jobRelevanceScore(skill_score, ats_score) {
  return +((skill_score * 0.7 + ats_score * 0.3).toFixed(2));
}

// ============================================================================
// SECTION 4: AI SEMANTIC JOB ROLE MATCHING
// ============================================================================

function extractProfessionalSummary(text) {
  if (!text) return '';
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const summaryHeaders = [
    'summary', 'professional summary', 'profile', 'about me', 
    'objective', 'career objective', 'professional profile',
    'executive summary', 'overview'
  ];
  
  let summaryStartIndex = -1;
  let summaryEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    for (const header of summaryHeaders) {
      if (line === header || line === header + ':') {
        summaryStartIndex = i + 1;
        break;
      }
    }
    
    if (summaryStartIndex > 0) break;
  }
  
  if (summaryStartIndex > 0) {
    const sectionHeaders = [
      'experience', 'work experience', 'employment', 'education',
      'skills', 'projects', 'certifications', 'achievements'
    ];
    
    for (let i = summaryStartIndex; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      for (const header of sectionHeaders) {
        if (line === header || line === header + ':') {
          summaryEndIndex = i;
          break;
        }
      }
      
      if (summaryEndIndex > 0) break;
    }
    
    const endIndex = summaryEndIndex > 0 ? summaryEndIndex : Math.min(summaryStartIndex + 10, lines.length);
    const summaryLines = lines.slice(summaryStartIndex, endIndex);
    return summaryLines.join(' ').trim();
  }
  
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const phoneRegex = /[\+\(]?[\d\s\(\).-]{10,}/;
  
  const contentLines = lines.filter(line => {
    return !emailRegex.test(line) && 
           !phoneRegex.test(line) && 
           line.length > 20 &&
           !line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/);
  });
  
  return contentLines.slice(0, 5).join(' ').substring(0, 500);
}

async function generateEmbedding(text, apiKey = null) {
  if (!text) return null;
  
  if (apiKey) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      console.warn('HuggingFace API failed, using local fallback:', error.message);
    }
  }
  
  return generateLocalEmbedding(text);
}

function generateLocalEmbedding(text) {
  if (!text) return null;
  
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const wordFreq = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([word]) => word);
  
  const vector = topWords.map(word => wordFreq[word] / words.length);
  
  return vector;
}

function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function calculateTextSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function classifyMatchLevel(similarity) {
  if (similarity >= 0.80) return 'Excellent Match';
  if (similarity >= 0.65) return 'Good Match';
  if (similarity >= 0.45) return 'Partial Match';
  return 'Weak Match';
}

function generateMatchExplanation(similarity, matchLevel) {
  const percentage = (similarity * 100).toFixed(1);
  
  let explanation = '';
  
  if (similarity >= 0.80) {
    explanation = `Excellent alignment (${percentage}%) detected. Strong semantic match indicates highly relevant experience and skills. Recommended for immediate interview.`;
  } else if (similarity >= 0.65) {
    explanation = `Good compatibility (${percentage}%) found. Professional background aligns well with job requirements. Consider for interview shortlist.`;
  } else if (similarity >= 0.45) {
    explanation = `Moderate alignment (${percentage}%) present. Some relevant experience found, but may require additional skill development. Review for potential fit.`;
  } else {
    explanation = `Limited match (${percentage}%) with the position. Minimal overlap with required competencies. May not be ideal fit for this role.`;
  }
  
  return explanation;
}

async function calculateJobRoleSimilarity(resumeText, jobRoleDescription, apiKey = null) {
  try {
    if (!resumeText || resumeText.length < 20) {
      throw new Error('Resume text is too short or empty');
    }
    
    if (!jobRoleDescription || jobRoleDescription.length < 20) {
      throw new Error('Job role description is too short or empty');
    }
    
    const resumeSummary = extractProfessionalSummary(resumeText);
    
    if (!resumeSummary || resumeSummary.length < 20) {
      throw new Error('Unable to extract meaningful professional summary from resume');
    }
    
    let similarity = 0;
    
    if (apiKey) {
      try {
        const resumeEmbedding = await generateEmbedding(resumeSummary, apiKey);
        const jobEmbedding = await generateEmbedding(jobRoleDescription, apiKey);
        
        if (resumeEmbedding && jobEmbedding) {
          similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
        }
      } catch (error) {
        console.warn('AI embedding failed, using fallback');
      }
    }
    
    if (similarity === 0) {
      const resumeEmbedding = generateLocalEmbedding(resumeSummary);
      const jobEmbedding = generateLocalEmbedding(jobRoleDescription);
      
      if (resumeEmbedding && jobEmbedding) {
        const maxLen = Math.max(resumeEmbedding.length, jobEmbedding.length);
        const paddedResume = [...resumeEmbedding, ...Array(maxLen - resumeEmbedding.length).fill(0)];
        const paddedJob = [...jobEmbedding, ...Array(maxLen - jobEmbedding.length).fill(0)];
        
        similarity = cosineSimilarity(paddedResume, paddedJob);
      }
      
      const textSimilarity = calculateTextSimilarity(resumeSummary, jobRoleDescription);
      similarity = (similarity * 0.7) + (textSimilarity * 0.3);
    }
    
    similarity = Math.max(0, Math.min(1, similarity));
    
    const matchLevel = classifyMatchLevel(similarity);
    const explanation = generateMatchExplanation(similarity, matchLevel);
    
    return {
      jobRoleSimilarity: parseFloat(similarity.toFixed(2)),
      matchLevel,
      explanation,
      confidence: similarity >= 0.65 ? 'High' : similarity >= 0.45 ? 'Medium' : 'Low',
      success: true
    };
    
  } catch (error) {
    return {
      jobRoleSimilarity: 0,
      matchLevel: 'Error',
      explanation: error.message,
      confidence: 'None',
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// SECTION 5: ADVANCED SKILL MATCHING WITH PROPER WEIGHTS
// ============================================================================

function findSkillInResume(resumeText, skill) {
  const txt = norm(resumeText);
  const toks = tokenize(txt);
  const variants = expandSkill(skill);
  
  const keywordMatch = variants.some(v => txt.includes(v) || toks.includes(v));
  
  if (keywordMatch) {
    return { found: true, matchType: 'keyword' };
  }
  
  const semanticMatches = checkSemanticMatch(skill, toks);
  
  if (semanticMatches.length > 0) {
    return { found: true, matchType: 'semantic', matchedTerms: semanticMatches };
  }
  
  return { found: false, matchType: null };
}

function checkSemanticMatch(skill, resumeTokens) {
  const semanticMap = {
    'react': ['frontend', 'ui', 'component', 'jsx'],
    'node': ['backend', 'server', 'express', 'api'],
    'docker': ['container', 'kubernetes', 'devops', 'deployment'],
    'aws': ['cloud', 'ec2', 's3', 'lambda', 'azure', 'gcp'],
    'mongodb': ['database', 'nosql', 'db', 'datastore'],
    'python': ['django', 'flask', 'pandas', 'numpy'],
    'java': ['spring', 'hibernate', 'maven', 'gradle'],
    'testing': ['jest', 'mocha', 'junit', 'selenium', 'qa'],
    'git': ['version control', 'github', 'gitlab', 'bitbucket'],
    'agile': ['scrum', 'sprint', 'jira', 'kanban']
  };
  
  const skillNorm = norm(skill);
  const relatedTerms = semanticMap[skillNorm] || [];
  
  const matches = [];
  for (const term of relatedTerms) {
    if (resumeTokens.includes(term)) {
      matches.push(term);
    }
  }
  
  return matches;
}

function advancedSkillMatching(resumeText, coreSkills = [], optionalSkills = [], maxScore = 40) {
  try {
    if (!resumeText || resumeText.length < 20) {
      throw new Error('Resume text is too short or empty');
    }
    
    const coreSkillsList = Array.isArray(coreSkills) ? coreSkills : [];
    const optionalSkillsList = Array.isArray(optionalSkills) ? optionalSkills : [];
    
    if (coreSkillsList.length === 0 && optionalSkillsList.length === 0) {
      throw new Error('No skills provided for matching');
    }
    
    const matchedCoreSkills = [];
    const missingCoreSkills = [];
    const coreSkillDetails = [];
    
    for (const skill of coreSkillsList) {
      const result = findSkillInResume(resumeText, skill);
      
      if (result.found) {
        matchedCoreSkills.push(skill);
        coreSkillDetails.push({
          skill,
          matched: true,
          matchType: result.matchType,
          matchedTerms: result.matchedTerms || null
        });
      } else {
        missingCoreSkills.push(skill);
        coreSkillDetails.push({
          skill,
          matched: false,
          matchType: null
        });
      }
    }
    
    const matchedOptionalSkills = [];
    const missingOptionalSkills = [];
    const optionalSkillDetails = [];
    
    for (const skill of optionalSkillsList) {
      const result = findSkillInResume(resumeText, skill);
      
      if (result.found) {
        matchedOptionalSkills.push(skill);
        optionalSkillDetails.push({
          skill,
          matched: true,
          matchType: result.matchType,
          matchedTerms: result.matchedTerms || null
        });
      } else {
        missingOptionalSkills.push(skill);
        optionalSkillDetails.push({
          skill,
          matched: false,
          matchType: null
        });
      }
    }
    
    const coreWeight = 0.70;
    const coreMaxScore = maxScore * coreWeight;
    let coreScore = 0;
    
    if (coreSkillsList.length > 0) {
      const coreMatchPercentage = matchedCoreSkills.length / coreSkillsList.length;
      coreScore = coreMaxScore * coreMatchPercentage;
      
      const missingPenalty = missingCoreSkills.length * 2;
      coreScore = Math.max(0, coreScore - missingPenalty);
    } else {
      coreScore = coreMaxScore;
    }
    
    const optionalWeight = 0.30;
    const optionalMaxScore = maxScore * optionalWeight;
    let optionalScore = 0;
    
    if (optionalSkillsList.length > 0) {
      const optionalMatchPercentage = matchedOptionalSkills.length / optionalSkillsList.length;
      optionalScore = optionalMaxScore * optionalMatchPercentage;
    } else {
      optionalScore = optionalMaxScore;
    }
    
    const totalSkillScore = coreScore + optionalScore;
    const normalizedScore = Math.round(Math.max(0, Math.min(maxScore, totalSkillScore)));
    
    const coreMatchPercentage = coreSkillsList.length > 0 
      ? Math.round((matchedCoreSkills.length / coreSkillsList.length) * 100)
      : 100;
    
    const optionalMatchPercentage = optionalSkillsList.length > 0
      ? Math.round((matchedOptionalSkills.length / optionalSkillsList.length) * 100)
      : 100;
    
    const overallMatchPercentage = Math.round(
      (matchedCoreSkills.length + matchedOptionalSkills.length) / 
      (coreSkillsList.length + optionalSkillsList.length) * 100
    );
    
    let recommendation = '';
    if (missingCoreSkills.length === 0) {
      recommendation = 'Strong candidate - All core skills present. Proceed to interview.';
    } else if (missingCoreSkills.length <= 1 && coreMatchPercentage >= 75) {
      recommendation = 'Good candidate - Most core skills present. Consider for interview.';
    } else if (missingCoreSkills.length <= 2 && coreMatchPercentage >= 60) {
      recommendation = 'Potential candidate - Some core skills missing. Review carefully.';
    } else {
      recommendation = 'Weak candidate - Multiple core skills missing. May not meet requirements.';
    }
    
    return {
      skillScore: normalizedScore,
      matchedCoreSkills,
      missingCoreSkills,
      matchedOptionalSkills,
      missingOptionalSkills,
      coreSkillsScore: parseFloat(coreScore.toFixed(2)),
      optionalSkillsScore: parseFloat(optionalScore.toFixed(2)),
      coreMatchPercentage,
      optionalMatchPercentage,
      overallMatchPercentage,
      coreSkillDetails,
      optionalSkillDetails,
      totalCoreSkills: coreSkillsList.length,
      totalOptionalSkills: optionalSkillsList.length,
      maxPossibleScore: maxScore,
      recommendation,
      success: true
    };
    
  } catch (error) {
    return {
      skillScore: 0,
      matchedCoreSkills: [],
      missingCoreSkills: [],
      matchedOptionalSkills: [],
      missingOptionalSkills: [],
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// SECTION 6: EXPERIENCE, EDUCATION & RESUME QUALITY SCORING
// ============================================================================

function advancedExperienceScore(candidateYears, requiredYears, maxScore = 15) {
  try {
    if (!candidateYears || candidateYears < 0) {
      return {
        experienceScore: 0,
        explanation: 'No work experience found in resume.',
        meetRequirement: false,
        success: true
      };
    }
    
    if (!requiredYears || requiredYears <= 0) {
      const score = Math.min(maxScore, candidateYears * 3);
      return {
        experienceScore: parseFloat(score.toFixed(2)),
        explanation: `Candidate has ${candidateYears} years of experience.`,
        meetRequirement: true,
        success: true
      };
    }
    
    let score = 0;
    let explanation = '';
    let meetRequirement = false;
    
    if (candidateYears >= requiredYears) {
      meetRequirement = true;
      const baseScore = maxScore * 0.8;
      const bonusYears = candidateYears - requiredYears;
      const bonus = Math.min(maxScore * 0.2, bonusYears * 0.5);
      score = baseScore + bonus;
      
      if (bonusYears === 0) {
        explanation = `Meets requirement exactly with ${candidateYears} years of experience.`;
      } else if (bonusYears <= 2) {
        explanation = `Good fit with ${candidateYears} years (${bonusYears} years above requirement).`;
      } else {
        explanation = `Excellent fit with ${candidateYears} years (${bonusYears} years above requirement). Senior level candidate.`;
      }
    } else {
      meetRequirement = false;
      const percentage = candidateYears / requiredYears;
      score = maxScore * percentage * 0.7;
      
      const gap = requiredYears - candidateYears;
      explanation = `Below requirement by ${gap} year(s). Has ${candidateYears} years, needs ${requiredYears} years.`;
    }
    
    return {
      experienceScore: Math.round(Math.max(0, Math.min(maxScore, score))),
      explanation,
      meetRequirement,
      candidateYears,
      requiredYears,
      success: true
    };
    
  } catch (error) {
    return {
      experienceScore: 0,
      explanation: error.message,
      meetRequirement: false,
      success: false,
      error: error.message
    };
  }
}

function advancedEducationScore(resumeDegree, resumeBranch, requiredDegree, preferredBranches = [], maxScore = 10) {
  try {
    const degreeOrder = { Diploma: 1, Bachelors: 2, Masters: 3, PhD: 4, '': 0 };
    
    const candidateDegreeLevel = degreeOrder[resumeDegree] || 0;
    const requiredDegreeLevel = degreeOrder[requiredDegree] || 0;
    
    if (candidateDegreeLevel === 0) {
      return {
        educationScore: 0,
        explanation: 'No educational qualification found in resume.',
        meetRequirement: false,
        degreeMatch: false,
        branchMatch: false,
        success: true
      };
    }
    
    if (requiredDegreeLevel === 0) {
      const score = candidateDegreeLevel * 2.5;
      return {
        educationScore: parseFloat(score.toFixed(2)),
        explanation: `Candidate has ${resumeDegree} degree.`,
        meetRequirement: true,
        degreeMatch: true,
        branchMatch: true,
        success: true
      };
    }
    
    let score = 0;
    let explanation = '';
    let degreeMatch = false;
    let branchMatch = false;
    let meetRequirement = false;
    
    if (candidateDegreeLevel >= requiredDegreeLevel) {
      degreeMatch = true;
      meetRequirement = true;
      score += maxScore * 0.7;
      
      if (candidateDegreeLevel > requiredDegreeLevel) {
        explanation = `Exceeds requirement with ${resumeDegree} (required: ${requiredDegree}).`;
      } else {
        explanation = `Meets requirement with ${resumeDegree}.`;
      }
    } else {
      degreeMatch = false;
      meetRequirement = false;
      score += maxScore * 0.3;
      explanation = `Below requirement. Has ${resumeDegree}, needs ${requiredDegree}.`;
    }
    
    if (preferredBranches && preferredBranches.length > 0 && resumeBranch) {
      const branchNorm = norm(resumeBranch);
      
      for (const preferred of preferredBranches) {
        const prefNorm = norm(preferred);
        if (branchNorm.includes(prefNorm) || prefNorm.includes(branchNorm)) {
          branchMatch = true;
          score += maxScore * 0.3;
          explanation += ` Relevant field: ${resumeBranch}.`;
          break;
        }
      }
      
      if (!branchMatch) {
        explanation += ` Different field: ${resumeBranch}.`;
      }
    } else {
      branchMatch = true;
      score += maxScore * 0.3;
    }
    
    return {
      educationScore: Math.round(Math.max(0, Math.min(maxScore, score))),
      explanation,
      meetRequirement,
      degreeMatch,
      branchMatch,
      candidateDegree: resumeDegree,
      candidateBranch: resumeBranch || 'Not specified',
      requiredDegree: requiredDegree || 'Not specified',
      success: true
    };
    
  } catch (error) {
    return {
      educationScore: 0,
      explanation: error.message,
      meetRequirement: false,
      success: false,
      error: error.message
    };
  }
}

function advancedResumeQualityScore(resumeText, sections = {}, contact = {}, imagesCount = 0, tablesCount = 0, maxScore = 5) {
  try {
    if (!resumeText || resumeText.length < 50) {
      return {
        resumeQualityScore: 0,
        explanation: 'Resume text is too short or empty.',
        checks: {},
        success: true
      };
    }
    
    let score = 0;
    const checks = {};
    const issues = [];
    
    const requiredSections = ['summary', 'skills', 'experience', 'education'];
    const presentSections = requiredSections.filter(sec => sections[sec]);
    const sectionScore = (presentSections.length / requiredSections.length) * (maxScore * 0.25);
    score += sectionScore;
    
    checks.sectionsPresent = presentSections;
    checks.sectionsMissing = requiredSections.filter(sec => !sections[sec]);
    
    if (checks.sectionsMissing.length > 0) {
      issues.push(`Missing sections: ${checks.sectionsMissing.join(', ')}`);
    }
    
    let contactScore = 0;
    if (contact && contact.email) contactScore += 0.5;
    if (contact && contact.phone) contactScore += 0.5;
    score += contactScore;
    
    checks.hasEmail = !!(contact && contact.email);
    checks.hasPhone = !!(contact && contact.phone);
    
    if (!checks.hasEmail || !checks.hasPhone) {
      issues.push('Incomplete contact information');
    }
    
    const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
    const keywordCategories = {
      action: ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'built', 'achieved'],
      technical: ['software', 'application', 'system', 'technology', 'platform', 'framework'],
      result: ['improved', 'increased', 'reduced', 'optimized', 'enhanced', 'delivered']
    };
    
    let keywordCount = 0;
    const textLower = resumeText.toLowerCase();
    
    for (const category in keywordCategories) {
      for (const keyword of keywordCategories[category]) {
        if (textLower.includes(keyword)) {
          keywordCount++;
        }
      }
    }
    
    const keywordDensity = keywordCount / Math.max(wordCount, 1);
    const keywordScore = Math.min(1.0, keywordDensity * 50) * (maxScore * 0.20);
    score += keywordScore;
    
    checks.keywordCount = keywordCount;
    checks.keywordDensity = parseFloat((keywordDensity * 100).toFixed(2)) + '%';
    
    if (keywordCount < 5) {
      issues.push('Low keyword density (use more action verbs and technical terms)');
    }
    
    let formatScore = maxScore * 0.20;
    
    if (imagesCount > 0) {
      formatScore -= Math.min(0.5, imagesCount * 0.1);
      issues.push(`Contains ${imagesCount} image(s) - may not be ATS-friendly`);
    }
    
    if (tablesCount > 2) {
      formatScore -= Math.min(0.3, (tablesCount - 2) * 0.1);
      issues.push(`Contains ${tablesCount} tables - may cause parsing issues`);
    }
    
    const specialChars = (resumeText.match(/[^\w\s.,;:()@-]/g) || []).length;
    const specialCharRatio = specialChars / resumeText.length;
    if (specialCharRatio > 0.05) {
      formatScore -= 0.2;
      issues.push('Too many special characters');
    }
    
    score += Math.max(0, formatScore);
    
    checks.imagesCount = imagesCount;
    checks.tablesCount = tablesCount;
    checks.atsCompliant = imagesCount === 0 && tablesCount <= 2;
    
    const lengthScore = wordCount >= 300 && wordCount <= 1500 ? maxScore * 0.15 : maxScore * 0.05;
    score += lengthScore;
    
    checks.wordCount = wordCount;
    checks.lengthAppropriate = wordCount >= 300 && wordCount <= 1500;
    
    if (wordCount < 300) {
      issues.push('Resume is too short (add more details)');
    } else if (wordCount > 1500) {
      issues.push('Resume is too long (be more concise)');
    }
    
    const percentage = Math.round((score / maxScore) * 100);
    let explanation = '';
    
    if (percentage >= 80) {
      explanation = `Excellent resume quality (${percentage}%). Well-structured and ATS-friendly.`;
    } else if (percentage >= 60) {
      explanation = `Good resume quality (${percentage}%). Minor improvements possible.`;
    } else if (percentage >= 40) {
      explanation = `Average resume quality (${percentage}%). Several improvements needed.`;
    } else {
      explanation = `Poor resume quality (${percentage}%). Major improvements required.`;
    }
    
    if (issues.length > 0) {
      explanation += ` Issues: ${issues.join('; ')}.`;
    }
    
    return {
      resumeQualityScore: Math.round(Math.max(0, Math.min(maxScore, score))),
      explanation,
      qualityPercentage: percentage,
      checks,
      issues,
      success: true
    };
    
  } catch (error) {
    return {
      resumeQualityScore: 0,
      explanation: error.message,
      checks: {},
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// UPDATED BATCH ANALYSIS WITH ALL ADVANCED FEATURES
// ============================================================================

async function analyzeResumeBatch(extractedList, options) {
  const defaults = { weights: { skills:60, experience:20, education:10, ats:10, job_relevance:10 } };
  const weights = options.weights || defaults.weights;
  const reqSkills = options.required_skills || [];
  const coreSkills = options.core_skills || [];
  const optionalSkills = options.optional_skills || [];
  const min_degree = options.min_degree || '';
  const preferred_branches = options.preferred_branches || [];
  const min_exp = options.min_experience_years || null;
  const jobRoleDescription = options.job_role_description || null;
  const apiKey = options.huggingface_api_key || null;
  const useAdvancedSkillMatching = options.use_advanced_skill_matching !== false;
  const useAdvancedScoring = options.use_advanced_scoring !== false;

  const results = [];

  for (let i = 0; i < extractedList.length; i++) {
    const r = extractedList[i];
    const txt = r.text || '';
    
    let sm, missing_skills, advancedSkillResult;
    
    if (useAdvancedSkillMatching && (coreSkills.length > 0 || optionalSkills.length > 0)) {
      advancedSkillResult = advancedSkillMatching(txt, coreSkills, optionalSkills, 40);
      sm = advancedSkillResult.skillScore;
      sm = (sm / 40) * 100;
      missing_skills = [...advancedSkillResult.missingCoreSkills, ...advancedSkillResult.missingOptionalSkills];
    } else {
      const legacyResult = skillMatchScore(txt, reqSkills);
      sm = legacyResult.score;
      missing_skills = legacyResult.missing_skills;
      advancedSkillResult = null;
    }
    
    let ex, em, ats, experienceResult, educationResult, qualityResult;
    
    if (useAdvancedScoring) {
      experienceResult = advancedExperienceScore(r.experience_years || 0, min_exp, 15);
      ex = (experienceResult.experienceScore / 15) * 100;
      
      educationResult = advancedEducationScore(r.degree || '', r.branch || '', min_degree, preferred_branches, 10);
      em = (educationResult.educationScore / 10) * 100;
      
      qualityResult = advancedResumeQualityScore(txt, r.sections || {}, r.contact || {}, r.images_count || 0, r.tables_count || 0, 5);
      ats = (qualityResult.resumeQualityScore / 5) * 100;
    } else {
      ex = experienceScore(r.experience_years || 0, min_exp);
      em = educationMatchScore(r.degree || '', min_degree);
      ats = atsFormatScore(txt, r.images_count || 0, r.tables_count || 0, r.contact || {}, r.sections || {});
      experienceResult = null;
      educationResult = null;
      qualityResult = null;
    }
    
    const jobRel = jobRelevanceScore(sm, ats);
    
    let aiMatch = null;
    if (jobRoleDescription) {
      aiMatch = await calculateJobRoleSimilarity(txt, jobRoleDescription, apiKey);
    }

    const total = ((sm * weights.skills) + (ex * weights.experience) + (em * weights.education) + (ats * weights.ats) + (jobRel * weights.job_relevance)) /
                  Object.values(weights).reduce((a,b)=>a+b,0);

    const result = {
      rank: i+1,
      filename: r.filename || `resume_${i+1}`,
      candidateName: (r.contact && r.contact.name) || 'Unknown',
      email: (r.contact && r.contact.email) || '',
      phone: (r.contact && r.contact.phone) || '',
      degree: r.degree || '',
      experience_years: +(r.experience_years || 0).toFixed(1),
      skills_match: +sm.toFixed(2),
      education_match: +em.toFixed(2),
      experience_score: +ex.toFixed(2),
      ats_format_score: +ats.toFixed(2),
      job_relevance: +jobRel.toFixed(2),
      ai_job_role_similarity: aiMatch ? aiMatch.jobRoleSimilarity : null,
      ai_match_level: aiMatch ? aiMatch.matchLevel : null,
      ai_match_explanation: aiMatch ? aiMatch.explanation : null,
      ai_confidence: aiMatch ? aiMatch.confidence : null,
      total_score: +total.toFixed(2),
      missing_skills,
      summary: r.summary || '',
      weights
    };
    
    if (advancedSkillResult) {
      result.advanced_skills = {
        skillScore: advancedSkillResult.skillScore,
        matchedCoreSkills: advancedSkillResult.matchedCoreSkills,
        missingCoreSkills: advancedSkillResult.missingCoreSkills,
        matchedOptionalSkills: advancedSkillResult.matchedOptionalSkills,
        missingOptionalSkills: advancedSkillResult.missingOptionalSkills,
        coreMatchPercentage: advancedSkillResult.coreMatchPercentage,
        optionalMatchPercentage: advancedSkillResult.optionalMatchPercentage,
        recommendation: advancedSkillResult.recommendation
      };
    }
    
    if (useAdvancedScoring) {
      result.advanced_experience = {
        experienceScore: experienceResult.experienceScore,
        explanation: experienceResult.explanation,
        meetRequirement: experienceResult.meetRequirement
      };
      
      result.advanced_education = {
        educationScore: educationResult.educationScore,
        explanation: educationResult.explanation,
        meetRequirement: educationResult.meetRequirement,
        degreeMatch: educationResult.degreeMatch,
        branchMatch: educationResult.branchMatch
      };
      
      result.advanced_quality = {
        resumeQualityScore: qualityResult.resumeQualityScore,
        explanation: qualityResult.explanation,
        qualityPercentage: qualityResult.qualityPercentage,
        checks: qualityResult.checks,
        issues: qualityResult.issues
      };
    }
    
    results.push(result);
  }

  results.sort((a,b) => b.total_score - a.total_score);
  results.forEach((r, idx) => r.rank = idx+1);
  
  return results;
}

module.exports = { 
  analyzeResumeBatch,
  calculateJobRoleSimilarity,
  advancedSkillMatching,
  advancedExperienceScore,
  advancedEducationScore,
  advancedResumeQualityScore,
  extractProfessionalSummary,
  generateEmbedding,
  cosineSimilarity,
  findSkillInResume,
  checkSemanticMatch
};