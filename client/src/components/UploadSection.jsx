import React, { useRef, useState } from 'react';
import '../styles/UploadSection.css';

const UploadSection = ({ files, setFiles, onProcess, processing, showAlert }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFileList(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFileList(selectedFiles);
  };

  const processFileList = (fileList) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const validFiles = fileList.filter(file => validTypes.includes(file.type));

    if (validFiles.length !== fileList.length) {
      showAlert('Some files were rejected. Only PDF and DOCX files are accepted.', 'error');
    }
    if (validFiles.length > 500) {
      showAlert('Maximum 500 files allowed. Only first 500 files will be processed.', 'error');
      validFiles.splice(500);
    }
    if (validFiles.length > 0) {
      setFiles(validFiles);
      showAlert(`${validFiles.length} files ready for processing.`, 'success');
    }
  };

  return (
    <div className="glass-card upload-card">
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon-animated">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        <h3>Drop Your Resumes Here</h3>
        <p>or click to browse your files</p>
        <div className="upload-specs">
          <span className="spec-badge">PDF</span>
          <span className="spec-badge">DOCX</span>
          <span className="spec-badge">Max 500 files</span>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="file-input-hidden"
        multiple
        accept=".pdf,.docx"
        onChange={handleFileSelect}
      />

      {files.length > 0 && (
        <div className="file-info">
          <div className="file-counter">
            <div className="counter-circle">
              <span>{files.length}</span>
            </div>
            <span>Files Ready</span>
          </div>
          <button 
            className="btn-primary" 
            onClick={onProcess}
            disabled={processing}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>Start ATS Analysis</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadSection;