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

  const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

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
    // ✅ Convert image to base64
    const base64 = await toBase64(file);

    // ✅ Call Hugging Face API
    const res = await fetch(
      "https://maithilipawar-accident-severity-api.hf.space/run/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [base64]
        })
      }
    );

    if (!res.ok) throw new Error("API error");

    const result = await res.json();

    // ⚠️ IMPORTANT: Extract actual data
    const data = result.data[0];

    // ✅ Format for your UI
    const formatted = {
      severity: data.severity,
      confidence: data.confidence,
      probabilities: {
        Minor: data.probabilities?.Minor || 0,
        Serious: data.probabilities?.Serious || 0,
        Fatal: data.probabilities?.Fatal || 0
      },
      description: "AI-based accident severity prediction",
      gradcam: "",
      demo_mode: false
    };

    setResultData(formatted);

  } catch (err) {
    console.error(err);
    setErrorMsg("Prediction failed. Check Hugging Face API.");
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
