// parser_utils.js
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Regular expressions for contact extraction
const CONTACT_EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const CONTACT_PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

// Degree patterns with priority
const DEGREE_PATTERNS = [
  { rx: /\b(ph\.?d|doctorate)\b/i, label: 'PhD' },
  { rx: /\b(m\.?tech|m\.?sc|masters?|post\s*graduate|pg)\b/i, label: 'Masters' },
  { rx: /\b(b\.?tech|b\.?e\.|b\.?sc|bachelors?)\b/i, label: 'Bachelors' },
  { rx: /\b(diploma)\b/i, label: 'Diploma' }
];

// Experience extraction patterns
const DATE_RANGE_RE = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\s*(?:-|to|–|—)\s*(?:present|current|\d{4})/ig;
const YEARS_EXPLICIT_RE = /(\d+)(?:\+)?\s+years?/ig;

/**
 * Extract text and image count from PDF
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    
    // Count images by looking for image markers in raw PDF
    const raw = buffer.toString('latin1');
    const imgMatches = raw.match(/\/Subtype\s*\/Image/ig);
    const images_count = imgMatches ? imgMatches.length : 0;
    const tables_count = 0;
    
    return { text, images_count, tables_count };
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    return { text: '', images_count: 0, tables_count: 0 };
  }
}

/**
 * Extract text from DOCX
 */
async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const images_count = 0;
    const tables_count = 0;
    
    return { text, images_count, tables_count };
  } catch (error) {
    console.error('DOCX extraction error:', error.message);
    return { text: '', images_count: 0, tables_count: 0 };
  }
}

/**
 * Extract contact information (name, email, phone)
 */
function parseContact(text) {
  const emailMatch = text.match(CONTACT_EMAIL_RE);
  const phoneMatch = text.match(CONTACT_PHONE_RE);
  
  let name = null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Find name from first few lines (avoiding contact info lines)
  for (const line of lines) {
    // Skip lines with digits, emails, phones
    if (/\d/.test(line)) continue;
    if (CONTACT_EMAIL_RE.test(line)) continue;
    if (CONTACT_PHONE_RE.test(line)) continue;
    
    // Name should be 2-5 words
    const words = line.split(' ');
    if (words.length >= 2 && words.length <= 5) {
      name = line;
      break;
    }
  }
  
  return {
    name: name || 'Unknown',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : ''
  };
}

/**
 * Detect resume sections
 */
function detectSections(text) {
  const lowered = text.toLowerCase();
  const headings = [
    'education',
    'experience',
    'work experience',
    'professional experience',
    'skills',
    'technical skills',
    'projects',
    'certifications',
    'summary',
    'objective',
    'profile'
  ];
  
  const sections = {};
  for (const h of headings) {
    if (lowered.includes(h)) {
      sections[h] = true;
    }
  }
  
  return sections;
}

/**
 * Detect highest degree level
 */
function highestDegree(text) {
  for (const p of DEGREE_PATTERNS) {
    if (p.rx.test(text)) {
      return p.label;
    }
  }
  return '';
}

/**
 * Extract years of experience
 */
function extractExperienceYears(text) {
  let years = 0;
  
  // Method 1: Explicit years mentioned (e.g., "5 years", "3+ years")
  const explicit = [];
  let m;
  YEARS_EXPLICIT_RE.lastIndex = 0; // Reset regex
  while ((m = YEARS_EXPLICIT_RE.exec(text)) !== null) {
    explicit.push(parseFloat(m[1]));
  }
  if (explicit.length) {
    years = Math.max(...explicit);
  }
  
  // Method 2: Count date ranges
  const ranges = text.match(DATE_RANGE_RE);
  if (ranges && ranges.length > 0) {
    years = Math.max(years, ranges.length);
  }
  
  return years;
}

/**
 * Extract summary (first 3 sentences)
 */
function extractSummary(text) {
  if (!text) return '';
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  return sentences.slice(0, 3).join(' ').trim();
}

/**
 * Main resume extraction function
 * Returns data in format expected by scoring.js
 */
async function extractResume(buffer, filename) {
  try {
    const lower = filename.toLowerCase();
    let meta;
    
    // Extract based on file type
    if (lower.endsWith('.pdf')) {
      meta = await extractTextFromPDF(buffer);
    } else if (lower.endsWith('.docx')) {
      meta = await extractTextFromDocx(buffer);
    } else {
      throw new Error('Unsupported file type: ' + filename);
    }
    
    const text = meta.text || '';
    
    // Validate text extraction
    if (!text || text.trim().length < 50) {
      console.warn(`Warning: Very short text extracted from ${filename}`);
    }
    
    // Extract all metadata
    const contact = parseContact(text);
    const sections = detectSections(text);
    const degree = highestDegree(text);
    const experience_years = extractExperienceYears(text);
    const summary = extractSummary(text);
    
    // Return in format expected by scoring.js
    return {
      text,
      images_count: meta.images_count || 0,
      tables_count: meta.tables_count || 0,
      contact,
      sections,
      degree,
      experience_years,
      summary
    };
    
  } catch (error) {
    console.error(`Error extracting resume from ${filename}:`, error.message);
    
    // Return default structure on error
    return {
      text: '',
      images_count: 0,
      tables_count: 0,
      contact: { name: 'Unknown', email: '', phone: '' },
      sections: {},
      degree: '',
      experience_years: 0,
      summary: '',
      error: error.message
    };
  }
}

module.exports = { 
  extractResume,
  extractTextFromPDF,
  extractTextFromDocx,
  parseContact,
  detectSections,
  highestDegree,
  extractExperienceYears,
  extractSummary
};