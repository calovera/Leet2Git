import React, { useState, useEffect } from 'react';
import { GitHubAuth, RepoCfg } from '../types/models';
import { getAuth, setAuth, getConfig, setConfig } from '../utils/storage';
import { verifyToken } from '../utils/github';

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
  includeDescription: boolean;
  includeTestCases: boolean;
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
    folderStructure: 'difficulty',
    includeDescription: true,
    includeTestCases: true,
    loading: false,
    message: '',
    messageType: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const auth = await getAuth();
      const config = await getConfig();

      setState(prev => ({
        ...prev,
        token: auth?.token || '',
        username: auth?.username || '',
        email: auth?.email || '',
        connected: auth?.connected || false,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        private: config.private,
        folderStructure: config.folderStructure,
        includeDescription: config.includeDescription,
        includeTestCases: config.includeTestCases
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    setState(prev => ({ ...prev, message, messageType: type }));
    setTimeout(() => {
      setState(prev => ({ ...prev, message: '', messageType: '' }));
    }, 5000);
  };

  const handleTokenSave = async () => {
    if (!state.token.trim()) {
      showMessage('Please enter a GitHub token', 'error');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const verification = await verifyToken(state.token);
      
      if (verification.valid && verification.username) {
        const auth: GitHubAuth = {
          token: state.token,
          username: verification.username,
          email: '', // GitHub API doesn't always return email
          connected: true
        };

        await setAuth(auth);
        
        setState(prev => ({
          ...prev,
          username: verification.username || '',
          connected: true,
          owner: prev.owner || verification.username || ''
        }));

        showMessage('GitHub token saved successfully!', 'success');
      } else {
        showMessage(verification.error || 'Invalid GitHub token', 'error');
      }
    } catch (error) {
      showMessage('Failed to verify GitHub token', 'error');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleConfigSave = async () => {
    if (!state.owner.trim()) {
      showMessage('Repository owner is required', 'error');
      return;
    }

    if (!state.repo.trim()) {
      showMessage('Repository name is required', 'error');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const config: RepoCfg = {
        owner: state.owner,
        repo: state.repo,
        branch: state.branch,
        private: state.private,
        folderStructure: state.folderStructure,
        includeDescription: state.includeDescription,
        includeTestCases: state.includeTestCases
      };

      await setConfig(config);
      showMessage('Repository configuration saved!', 'success');
    } catch (error) {
      showMessage('Failed to save configuration', 'error');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDisconnect = async () => {
    try {
      await setAuth({
        token: '',
        username: '',
        email: '',
        connected: false
      });

      setState(prev => ({
        ...prev,
        token: '',
        username: '',
        email: '',
        connected: false
      }));

      showMessage('Disconnected from GitHub', 'success');
    } catch (error) {
      showMessage('Failed to disconnect', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Leet2Git Options</h1>
        </div>

        {state.message && (
          <div className={`mb-6 p-4 rounded-lg ${
            state.messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {state.message}
          </div>
        )}

        {/* GitHub Authentication */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            GitHub Authentication
          </h2>

          {state.connected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">Connected as @{state.username}</p>
                  <p className="text-green-600 text-sm">GitHub integration is active</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={state.token}
                  onChange={(e) => setState(prev => ({ ...prev, token: e.target.value }))}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Generate a token at{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    github.com/settings/tokens
                  </a>{' '}
                  with 'repo' scope
                </p>
              </div>
              <button
                onClick={handleTokenSave}
                disabled={state.loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                {state.loading ? 'Verifying...' : 'Connect GitHub'}
              </button>
            </div>
          )}
        </div>

        {/* Repository Configuration */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Repository Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository Owner
              </label>
              <input
                type="text"
                value={state.owner}
                onChange={(e) => setState(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="your-username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                value={state.repo}
                onChange={(e) => setState(prev => ({ ...prev, repo: e.target.value }))}
                placeholder="leetcode-solutions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={state.branch}
                onChange={(e) => setState(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="main"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Structure
              </label>
              <select
                value={state.folderStructure}
                onChange={(e) => setState(prev => ({ ...prev, folderStructure: e.target.value as 'difficulty' | 'topic' | 'flat' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="difficulty">By Difficulty (easy/, medium/, hard/)</option>
                <option value="topic">By Topic</option>
                <option value="flat">Flat (all in root)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.private}
                onChange={(e) => setState(prev => ({ ...prev, private: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Create private repository</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.includeDescription}
                onChange={(e) => setState(prev => ({ ...prev, includeDescription: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include problem description in files</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.includeTestCases}
                onChange={(e) => setState(prev => ({ ...prev, includeTestCases: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include test cases in files</span>
            </label>
          </div>

          <button
            onClick={handleConfigSave}
            disabled={state.loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
          >
            {state.loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How to use:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a GitHub Personal Access Token with 'repo' scope</li>
            <li>Enter the token above and click "Connect GitHub"</li>
            <li>Configure your repository settings</li>
            <li>Solve problems on LeetCode - they'll be automatically synced!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}