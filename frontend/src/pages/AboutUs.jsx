// pages/AboutUs.jsx
import React from 'react';

export default function AboutUs() {
  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="about-badge">NEXT-GEN ACCIDENT ANALYSIS</div>
        <h1>About <span style={{background: 'var(--gradient-secondary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>AccidentIQ</span></h1>
        <p>Revolutionizing emergency response with AI-powered accident severity detection</p>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <div className="about-icon"></div>
          <h3>Our Mission</h3>
          <p>To reduce emergency response time and save lives by providing instant, accurate accident severity classification using cutting-edge deep learning.</p>
        </div>

        <div className="about-card">
          <div className="about-icon"></div>
          <h3>The Technology</h3>
          <p>Powered by MobileNet architecture, our model achieves 72% accuracy in classifying accidents into Minor, Serious, or Fatal categories.</p>
        </div>

        <div className="about-card">
          <div className="about-icon"></div>
          <h3>Explainable AI</h3>
          <p>Grad-CAM visualization shows exactly which image regions influenced the prediction, ensuring transparency and trust in our system.</p>
        </div>
      </div>

      <div className="tech-stack">
        <h2>Technology Stack</h2>
        <div className="tech-badges">
          <span className="tech-badge">React 18</span>
          <span className="tech-badge">FastAPI</span>
          <span className="tech-badge">MobileNet</span>
          <span className="tech-badge">TensorFlow</span>
          <span className="tech-badge">Grad-CAM</span>
          <span className="tech-badge">WebRTC</span>
        </div>
        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Built for speed, accuracy, and real-world deployment. Our system processes images in under 300ms,
          enabling emergency responders to make informed decisions faster than ever before.
        </p>
      </div>
    </div>
  );
}