import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "https:ats-resume-scanner-upgrade-version.onrender.com";

export const analyzeResumes = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing resumes:', error);
    throw error;
  }
};

export const downloadReport = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/api/report`, payload, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};
