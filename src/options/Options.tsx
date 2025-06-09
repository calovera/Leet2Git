import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

interface OptionsData {
  isConnected: boolean;
  username: string | null;
  repos: GitHubRepo[];
  selectedRepo: string;
  branch: string;
  pathTemplate: string;
}

const Options: React.FC = () => {
  const [data, setData] = useState<OptionsData>({
    isConnected: false,
    username: null,
    repos: [],
    selectedRepo: '',
    branch: 'main',
    pathTemplate: '{tag}/{slug}/{lang}/solution.{ext}'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [previewPath, setPreviewPath] = useState('');

  useEffect(() => {
    loadOptionsData();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [data.pathTemplate]);

  const loadOptionsData = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'getOptionsData' 
      });
      
      if (response) {
        setData(prev => ({ ...prev, ...response }));
      }
    } catch (error) {
      console.error('Failed to load options data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'auth' 
      });
      
      if (response && response.success) {
        await loadOptionsData();
      }
    } catch (error) {
      console.error('Failed to connect to GitHub:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRepoChange = async (repoFullName: string) => {
    setData(prev => ({ ...prev, selectedRepo: repoFullName }));
    
    await chrome.runtime.sendMessage({
      type: 'saveOptions',
      options: { ...data, selectedRepo: repoFullName }
    });
  };

  const handleBranchChange = async (branch: string) => {
    setData(prev => ({ ...prev, branch }));
    
    await chrome.runtime.sendMessage({
      type: 'saveOptions',
      options: { ...data, branch }
    });
  };

  const handlePathTemplateChange = async (pathTemplate: string) => {
    setData(prev => ({ ...prev, pathTemplate }));
    
    await chrome.runtime.sendMessage({
      type: 'saveOptions',
      options: { ...data, pathTemplate }
    });
  };

  const updatePreview = () => {
    const template = data.pathTemplate;
    const preview = template
      .replace('{tag}', 'medium')
      .replace('{slug}', 'two-sum')
      .replace('{lang}', 'python')
      .replace('{ext}', 'py');
    setPreviewPath(preview);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Loading options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Leet2Git Options</h1>
          </div>
          <p className="text-slate-600">Configure your GitHub integration and sync preferences</p>
        </div>

        <div className="space-y-6">
          {/* GitHub Connection */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Connection
            </h2>
            
            {data.isConnected ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Connected as {data.username}</p>
                    <p className="text-xs text-green-600">GitHub integration is active</p>
                  </div>
                </div>
                <button className="text-sm text-green-700 hover:text-green-800 font-medium">
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600 mb-4">
                  Connect your GitHub account to sync LeetCode solutions
                </p>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Connect GitHub
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Repository Selection */}
          {data.isConnected && (
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Repository Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Repository
                  </label>
                  <select
                    value={data.selectedRepo}
                    onChange={(e) => handleRepoChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a repository</option>
                    {data.repos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.name} {repo.private && '(Private)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={data.branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Path Template */}
          {data.isConnected && (
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">File Organization</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Path Template
                  </label>
                  <input
                    type="text"
                    value={data.pathTemplate}
                    onChange={(e) => handlePathTemplateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Available variables: {'{tag}'}, {'{slug}'}, {'{lang}'}, {'{ext}'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preview
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700">
                    {previewPath}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}

export default Options;