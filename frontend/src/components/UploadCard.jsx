// components/UploadCard.jsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, RotateCcw, X, Upload } from 'lucide-react';

export default function UploadCard({ onAnalyze, isLoading }) {
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      processFile(droppedFile);
    }
  };

  const captureWebcam = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPreview(imageSrc);
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const capturedFile = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
          });
      }
    }
  }, [webcamRef]);

  const clearSelection = (e) => {
    e?.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeClick = () => {
    if (file) onAnalyze(file);
  };

  return (
    <div className="card-panel">
      <div className="card-header" style={{ borderBottom: 'none' }}>
        <div className="card-header-icon"><Camera size={18} /></div>
        <div>
          <h2>Accident Image</h2>
          <p>Upload or capture an accident scene</p>
        </div>
      </div>

      <div className="upload-tabs">
        <button 
          className={`upload-tab ${mode === 'upload' ? 'active' : ''}`} 
          onClick={() => { setMode('upload'); clearSelection(); }}
        >
          <ImageIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}/>
          File Upload
        </button>
        <button 
          className={`upload-tab ${mode === 'webcam' ? 'active' : ''}`} 
          onClick={() => { setMode('webcam'); clearSelection(); }}
        >
          <Camera size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}/>
          Live Webcam
        </button>
      </div>

      <div 
        className={`dropzone ${preview ? 'has-img' : ''}`}
        onClick={() => !preview && mode === 'upload' && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          hidden 
          onChange={handleFileChange}
        />

        {!preview && mode === 'upload' && (
          <div>
            <div className="dz-icon">📸</div>
            <div className="dz-title">Drop accident image here</div>
            <div className="dz-sub">or click anywhere to browse</div>
            <div className="dz-formats">JPG · PNG · WEBP · Max 15 MB</div>
          </div>
        )}

        {!preview && mode === 'webcam' && (
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button 
              className="btn-auth" 
              style={{ position: 'absolute', bottom: '20px', width: 'auto', padding: '10px 24px', zIndex: 10 }}
              onClick={(e) => { e.stopPropagation(); captureWebcam(); }}
            >
              TAKE SNAPSHOT
            </button>
          </div>
        )}

        {preview && (
          <>
            <img src={preview} className="preview-img" alt="preview" />
            <div className="img-overlay">
              <span className="img-overlay-name">{file?.name || 'capture.jpg'}</span>
            </div>
            <div className="overlay-actions">
              {mode === 'upload' && (
                <button className="oa-btn" onClick={() => fileInputRef.current?.click()}>
                  <RotateCcw size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}/> Change
                </button>
              )}
              <button className="oa-btn" onClick={clearSelection}>
                <X size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}/> Remove
              </button>
            </div>
          </>
        )}
      </div>

      <button 
        className="analyze-btn" 
        onClick={handleAnalyzeClick} 
        disabled={!file || isLoading}
      >
        <Upload size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}/>
        ANALYZE SEVERITY
      </button>
    </div>
  );
}