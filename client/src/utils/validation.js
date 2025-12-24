export const validateJobRole = (value) => {
  if (!value || value.trim().length < 3) {
    return 'Job role must be at least 3 characters';
  }
  if (value.length > 100) {
    return 'Job role must be less than 100 characters';
  }
  return null;
};

export const validateSkills = (value) => {
  if (!value || value.trim().length < 3) {
    return 'Please enter at least one skill';
  }
  if (value.length > 500) {
    return 'Skills list is too long';
  }
  return null;
};

export const validateExperience = (value) => {
  if (value && (isNaN(value) || value < 0 || value > 50)) {
    return 'Experience must be between 0 and 50 years';
  }
  return null;
};

export const validateFiles = (files) => {
  if (!files || files.length === 0) {
    return 'Please upload at least one resume';
  }
  if (files.length > 500) {
    return 'Maximum 500 files allowed';
  }
  return null;
};