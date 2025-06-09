import React, { useState, useEffect } from 'react';

interface OptionsState {
  token: string;
  username: string;
  email: string;
  connected: boolean;
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: 'difficulty' | 'topic' | 'flat';
  loading: boolean;
  message: string;
  messageType: 'success' | 'error' | '';
}

export default function Options() {
  const [state, setState] = useState<OptionsState>({
    token: '',
    username: '',
    email: '',
    connected: false,
    owner: '',
    repo: 'leetcode-solutions',
    branch: 'main',
    private: false,
    folderStructure: 'topic',
    loading: false,
    message: '',
    messageType: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['github_token', 'github_user', 'auth', 'config', 'owner', 'repo', 'branch']);
      
      if (result.github_token && result.github_user) {
        setState(prev => ({
          ...prev,
          token: result.github_token,
          username: result.github_user.username || '',
          email: result.github_user.email || '',
          connected: result.github_user.connected || false
        }));
      } else if (result.auth) {
        setState(prev => ({
          ...prev,
          token: result.auth.token || '',
          username: result.auth.username || '',
          email: result.auth.email || '',
          connected: result.auth.connected || false
        }));
      }

      if (result.config) {
        setState(prev => ({
          ...prev,
          owner: result.config.owner || '',
          repo: result.config.repo || 'leetcode-solutions',
          branch: result.config.branch || 'main',
          private: result.config.private || false,
          folderStructure: result.config.folderStructure || 'topic'
        }));
      } else {
        setState(prev => ({
          ...prev,
          owner: result.owner || '',
          repo: result.repo || 'leetcode-solutions',
          branch: result.branch || 'main'
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const verifyToken = async () => {
    if (!state.token) {
      showStatus('Please enter a GitHub token', false);
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const data = await response.json();

      if (data.login) {
        const auth = {
          token: state.token,
          username: data.login,
          email: data.email || '',
          connected: true
        };

        setState(prev => ({
          ...prev,
          username: data.login,
          email: data.email || '',
          connected: true,
          owner: prev.owner || data.login
        }));

        await chrome.storage.sync.set({ auth, github_token: state.token, github_user: auth });
        showStatus('GitHub connected successfully!', true);
      } else {
        showStatus('Invalid GitHub token', false);
      }
    } catch (error) {
      showStatus('Error verifying token', false);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const saveSettings = async () => {
    try {
      const config = {
        owner: state.owner,
        repo: state.repo,
        branch: state.branch,
        private: state.private,
        folderStructure: state.folderStructure,
        includeDescription: true,
        includeTestCases: false
      };

      await chrome.storage.sync.set({ 
        config,
        owner: state.owner,
        repo: state.repo,
        branch: state.branch
      });

      showStatus('Settings saved successfully!', true);
    } catch (error) {
      showStatus('Error saving settings', false);
    }
  };

  const showStatus = (message: string, success: boolean) => {
    setState(prev => ({
      ...prev,
      message,
      messageType: success ? 'success' : 'error'
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        message: '',
        messageType: ''
      }));
    }, 3000);
  };

  const handleInputChange = (field: keyof OptionsState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Leet2Git Settings</h1>

      {/* GitHub Authentication */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ color: '#555', marginBottom: '15px' }}>GitHub Authentication</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            GitHub Personal Access Token:
          </label>
          <input
            type="password"
            value={state.token}
            onChange={(e) => handleInputChange('token', e.target.value)}
            placeholder="Enter your GitHub token"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={verifyToken}
          disabled={state.loading || !state.token}
          style={{
            padding: '10px 20px',
            backgroundColor: state.connected ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state.loading || !state.token ? 'not-allowed' : 'pointer',
            opacity: state.loading || !state.token ? 0.6 : 1
          }}
        >
          {state.loading ? 'Verifying...' : state.connected ? 'Connected' : 'Verify Token'}
        </button>

        {state.connected && (
          <div style={{ marginTop: '10px', color: '#28a745' }}>
            ✓ Connected as {state.username}
          </div>
        )}
      </div>

      {/* Repository Configuration */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ color: '#555', marginBottom: '15px' }}>Repository Configuration</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Repository Owner:
          </label>
          <input
            type="text"
            value={state.owner}
            onChange={(e) => handleInputChange('owner', e.target.value)}
            placeholder="GitHub username or organization"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Repository Name:
          </label>
          <input
            type="text"
            value={state.repo}
            onChange={(e) => handleInputChange('repo', e.target.value)}
            placeholder="Repository name"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Branch:
          </label>
          <input
            type="text"
            value={state.branch}
            onChange={(e) => handleInputChange('branch', e.target.value)}
            placeholder="main"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.private}
              onChange={(e) => handleInputChange('private', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Private Repository
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Folder Structure:
          </label>
          <select
            value={state.folderStructure}
            onChange={(e) => handleInputChange('folderStructure', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="topic">By Topic (Array, Hash Table, etc.)</option>
            <option value="difficulty">By Difficulty (Easy, Medium, Hard)</option>
            <option value="flat">Flat (All in root)</option>
          </select>
        </div>

        <button
          onClick={saveSettings}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Settings
        </button>
      </div>

      {/* Status Message */}
      {state.message && (
        <div
          style={{
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: state.messageType === 'success' ? '#d4edda' : '#f8d7da',
            color: state.messageType === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${state.messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}