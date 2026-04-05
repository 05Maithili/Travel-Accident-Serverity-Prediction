import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Activity, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/history/${user.email}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.email) {
      fetchHistory();
    }
  }, [user]);

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Profile Card */}
        <div className="card-panel profile-card" style={{ height: 'fit-content' }}>
          <h2 className="auth-title" style={{ fontSize: '24px' }}>Profile</h2>
          <div className="profile-avatar">{user?.avatar || '👤'}</div>
          <div className="profile-info">
            <p><strong>Name:</strong> {user?.name}</p>
            <p style={{ marginTop: '10px', wordBreak: 'break-all' }}><strong>Email:</strong> {user?.email}</p>
          </div>
          <button className="analyze-btn" style={{ width: '100%', margin: '0', fontSize: '14px', padding: '10px', letterSpacing: '1px' }} onClick={() => alert('Profile update coming soon!')}>
            EDIT PROFILE
          </button>
        </div>

        {/* History Tab */}
        <div className="card-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <History size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '1px' }}>Analysis History</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No history found. Try analyzing an image on the Home page first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((record, idx) => {
                const isMinor = record.severity.toLowerCase() === 'minor';
                const isSerious = record.severity.toLowerCase() === 'serious';
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'var(--transition)'
                  }}>
                    {record.image_url ? (
                      <img src={record.image_url} alt="Accident" style={{ width: '100px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity color="var(--text-muted)" />
                      </div>
                    )}
                    
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ 
                          fontFamily: 'var(--font-display)', 
                          fontSize: '18px', 
                          letterSpacing: '1px',
                          color: isMinor ? 'var(--accent-green)' : (isSerious ? 'var(--accent-yellow)' : 'var(--accent-red)')
                        }}>
                          {record.severity.toUpperCase()}
                        </h3>
                        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)', fontSize: '14px' }}>
                          {record.confidence}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
