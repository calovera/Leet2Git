import React, { useState, useEffect } from 'react';

interface PopupState {
  stats: {
    counts: { easy: number; medium: number; hard: number };
    recentSolves: Array<{
      title: string;
      language: string;
      difficulty: string;
      timestamp: number;
    }>;
  };
  pending: Array<{
    title: string;
    language: string;
    difficulty: string;
  }>;
  auth: {
    connected: boolean;
    username: string;
  } | null;
  loading: boolean;
  message: string;
}

export default function Popup() {
  const [state, setState] = useState<PopupState>({
    stats: { counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
    pending: [],
    auth: null,
    loading: true,
    message: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getHomeData' });
      if (response.success) {
        setState(prev => ({
          ...prev,
          stats: response.data.stats,
          pending: response.data.pending,
          auth: response.data.auth,
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, message: 'Error loading data' }));
    }
  };

  const pushToGitHub = async () => {
    setState(prev => ({ ...prev, loading: true, message: 'Pushing to GitHub...' }));
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'push' });
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          message: response.message || 'Pushed successfully!',
          pending: []
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          message: response.error || 'Push failed'
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, message: 'Error pushing to GitHub' }));
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (state.loading) {
    return (
      <div style={{ width: '350px', padding: '20px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: '350px', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>Leet2Git</h1>

      {/* Stats Section */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#555' }}>Statistics</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {state.stats.counts.easy}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Easy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
              {state.stats.counts.medium}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Medium</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
              {state.stats.counts.hard}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Hard</div>
          </div>
        </div>
      </div>

      {/* Pending Solutions */}
      {state.pending.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '10px', color: '#555' }}>
            Pending Solutions ({state.pending.length})
          </h2>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {state.pending.slice(0, 5).map((item, index) => (
              <div key={index} style={{ 
                fontSize: '12px', 
                marginBottom: '5px',
                padding: '5px',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                <div style={{ color: '#666' }}>{item.language} • {item.difficulty}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Status */}
      <div style={{ marginBottom: '20px' }}>
        {state.auth?.connected ? (
          <div style={{ color: '#28a745', fontSize: '14px' }}>
            ✓ Connected as {state.auth.username}
          </div>
        ) : (
          <div style={{ color: '#dc3545', fontSize: '14px' }}>
            ✗ Not connected to GitHub
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={pushToGitHub}
          disabled={state.loading || state.pending.length === 0 || !state.auth?.connected}
          style={{
            padding: '10px',
            backgroundColor: state.pending.length > 0 && state.auth?.connected ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state.pending.length > 0 && state.auth?.connected ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          {state.loading ? 'Pushing...' : `Push ${state.pending.length} Solutions`}
        </button>

        <button
          onClick={openOptions}
          style={{
            padding: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Settings
        </button>
      </div>

      {/* Status Message */}
      {state.message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: state.message.includes('Error') || state.message.includes('failed') ? '#f8d7da' : '#d4edda',
          color: state.message.includes('Error') || state.message.includes('failed') ? '#721c24' : '#155724',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {state.message}
        </div>
      )}
    </div>
  );
}