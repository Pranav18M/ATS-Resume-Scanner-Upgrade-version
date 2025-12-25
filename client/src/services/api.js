import axios from 'axios';

// ✅ Base API URL (Local + Render)
const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:8000';

/**
 * Analyze uploaded resumes
 */
export const analyzeResumes = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error(
      'Error analyzing resumes:',
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Download ATS report
 */
export const downloadReport = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/report`,
      payload,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      'Error downloading report:',
      error.response?.data || error.message
    );
    throw error;
  }
};
