import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import JobRequirements from './components/JobRequirements';
import UploadSection from './components/UploadSection';
import ProcessingCard from './components/ProcessingCard';
import ResultsCard from './components/ResultsCard';
import FeaturesGrid from './components/FeaturesGrid';
import { analyzeResumes, downloadReport } from './services/api';
import './styles/Global.css';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [formData, setFormData] = useState({
    jobRole: '',
    requiredSkills: '',
    minDegree: '',
    minExp: ''
  });
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]); // ✅ MUST be array
  const [alert, setAlert] = useState({ message: '', type: '' });

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => {
        setAlert({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      showAlert('Please upload resume files first.', 'error');
      return;
    }

    if (!formData.jobRole || !formData.requiredSkills) {
      showAlert('Enter Job Role and Required Skills before analyzing.', 'error');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 500);

    const formDataToSend = new FormData();
    formDataToSend.append('job_role', formData.jobRole);
    formDataToSend.append('required_skills', formData.requiredSkills);
    formDataToSend.append('min_degree', formData.minDegree);
    if (formData.minExp) {
      formDataToSend.append('min_experience_years', formData.minExp);
    }
    files.forEach(file => formDataToSend.append('files', file));

    try {
      const data = await analyzeResumes(formDataToSend); // ✅ ARRAY

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        const safeResults = Array.isArray(data) ? data : [];
        setResults(safeResults);
        setProcessing(false);

        showAlert(
          `Analysis complete! ${safeResults.length} candidates ranked.`,
          'success'
        );

        // Scroll to results
        setTimeout(() => {
          document.querySelector('.results-card')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setProcessing(false);
      setProgress(0);
      showAlert(
        'Failed to analyze. Please check if the backend server is running.',
        'error'
      );
      console.error('Error:', error);
    }
  };

  const handleDownload = async () => {
    if (!Array.isArray(results) || results.length === 0) {
      showAlert('No results to download. Please analyze resumes first.', 'error');
      return;
    }

    const payload = {
      job_role: formData.jobRole,
      required_skills: formData.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      min_degree: formData.minDegree,
      min_experience_years: formData.minExp || null,
      weights: results[0]?.weights || {
        skills: 60,
        experience: 20,
        education: 10,
        ats: 10
      },
      results: results
    };

    try {
      const blob = await downloadReport(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ATS_Resume_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showAlert('PDF report downloaded successfully!', 'success');
    } catch (error) {
      showAlert('Failed to download report. Please try again.', 'error');
      console.error('Download error:', error);
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="main-content">
        <div className="background-animation">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="container">
          <Header />

          <JobRequirements formData={formData} setFormData={setFormData} />

          <UploadSection
            files={files}
            setFiles={setFiles}
            onProcess={handleProcess}
            processing={processing}
            showAlert={showAlert}
          />

          {alert.message && (
            <div className={`alert alert-${alert.type}`}>
              {alert.message}
            </div>
          )}

          {processing && <ProcessingCard progress={progress} />}

          <ResultsCard results={results} onDownload={handleDownload} />

          <FeaturesGrid />
        </div>
      </div>
    </>
  );
}

export default App;
