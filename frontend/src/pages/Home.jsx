// pages/Home.jsx
import React, { useState } from 'react';
import UploadCard from '../components/UploadCard';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth(); // Import useAuth to grab the currently logged in user

  const loadingMessages = [
    'INITIALIZING NEURAL NETWORK...', 'EXTRACTING FEATURES...',
    'PROCESSING EFFICIENTNET...', 'COMPUTING SEVERITY...',
    'GENERATING GRAD-CAM...'
  ];

  const handleAnalyze = async (file) => {
    setLoading(true);
    setResultData(null);
    setErrorMsg('');
    
    let msgIdx = 0;
    setLoadingMessage(loadingMessages[0]);
    const timer = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIdx]);
    }, 800);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (user) {
        formData.append('email', user.email); // Append email so backend tracks history
      }
      
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setResultData(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Prediction failed. Please ensure the backend server is running.');
      setResultData(null);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero">
        <div className="hero-eyebrow"> MobileNet · Deep Learning · Real-time Analysis</div>
        <h1>PREDICT<br/><em>SEVERITY</em></h1>
        <p className="hero-sub">Upload or capture any accident scene image. Our AI instantly classifies severity as Minor, Serious, or Fatal.</p>
      </div>

      <div className="main-content">
        <UploadCard onAnalyze={handleAnalyze} isLoading={loading} />
        <ResultCard data={resultData} isLoading={loading} loadingMessage={loadingMessage} error={errorMsg} />
      </div>
    </>
  );
}