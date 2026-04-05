// components/ResultCard.jsx
import React from 'react';
import { Activity, Search } from 'lucide-react';

export default function ResultCard({ data, isLoading, loadingMessage, error }) {
  
  if (isLoading) {
    return (
      <div className="card-panel result-card">
        <div className="loading-state">
          <div className="scan-animation">
            <div className="scan-box"></div>
            <div className="scan-line"></div>
          </div>
          <div className="loading-label">{loadingMessage || 'PROCESSING...'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-panel result-card">
        <div className="result-empty">
          <div style={{ color: 'var(--accent-red)', fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div className="empty-title">Analysis Failed</div>
          <div className="empty-desc" style={{ color: 'var(--accent-red)' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card-panel result-card">
        <div className="result-empty">
          <div className="empty-rings">
            <div className="ring"></div><div className="ring"></div><div className="ring"></div>
            <div className="ring-center"><Search size={24} color="var(--accent-cyan)" /></div>
          </div>
          <div className="empty-title">Awaiting Analysis</div>
          <div className="empty-desc">Upload or capture an accident image<br/>to get instant severity prediction</div>
        </div>
      </div>
    );
  }

  const sc = data.severity.toLowerCase();
  const probs = data.probabilities;

  return (
    <div className="card-panel result-card">
      <div className="result-content">
        <div className="card-header">
          <div className="card-header-icon"><Activity size={18} /></div>
          <div>
            <h2>Analysis Result</h2>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {data.demo_mode && (
          <div className="demo-notice">
            ⚡ DEMO MODE — Connect backend for real AI inference
          </div>
        )}

        <div className={`sev-hero ${sc}`}>
          <div className="sev-tag">PREDICTED SEVERITY</div>
          <div className={`sev-label ${sc}`}>{data.severity.toUpperCase()}</div>
          <div className="sev-conf">Confidence: <strong>{data.confidence}%</strong></div>
          <span className={`sev-badge badge-${sc}`}>{data.severity}</span>
        </div>

        <div className="hr"></div>

        <div className="prob-section">
          <div className="section-label">Probability Distribution</div>
          <div className="prob-row">
            <span className="prob-cls">Minor</span>
            <div className="prob-track"><div className="prob-fill fill-minor" style={{ width: `${probs.Minor}%` }}></div></div>
            <span className="prob-pct pct-minor">{probs.Minor}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-cls">Serious</span>
            <div className="prob-track"><div className="prob-fill fill-serious" style={{ width: `${probs.Serious}%` }}></div></div>
            <span className="prob-pct pct-serious">{probs.Serious}%</span>
          </div>
          <div className="prob-row">
            <span className="prob-cls">Fatal</span>
            <div className="prob-track"><div className="prob-fill fill-fatal" style={{ width: `${probs.Fatal}%` }}></div></div>
            <span className="prob-pct pct-fatal">{probs.Fatal}%</span>
          </div>
        </div>

        <div className="hr"></div>

        <div className="desc-section">
          <div className="section-label">Interpretation</div>
          <div className={`desc-text ${sc}`}>
            {data.description}
          </div>
        </div>

        {data.gradcam && (
          <div className="heatmap-section">
            <div className="section-label">Grad-CAM Attention Map</div>
            <div className="heatmap-wrap">
              <img src={`data:image/png;base64,${data.gradcam}`} className="heatmap-img" alt="Grad-CAM" />
              <div className="heatmap-footer">🔍 REGIONS THAT INFLUENCED THE PREDICTION</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}