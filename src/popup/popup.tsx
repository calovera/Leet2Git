import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

interface ConnectionStatus {
  github: {
    connected: boolean;
    username: string | null;
  };
  leetcode: {
    connected: boolean;
    username: string | null;
  };
}

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
  lastSync: Date | null;
}

interface Settings {
  autoSync: boolean;
  privateRepo: boolean;
  includeTests: boolean;
}

interface ActivityItem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

interface PopupState {
  connectionStatus: ConnectionStatus;
  syncStatus: SyncStatus;
  settings: Settings;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    connectionStatus: {
      github: { connected: false, username: null },
      leetcode: { connected: false, username: null }
    },
    syncStatus: {
      isRunning: false,
      progress: 0,
      currentTask: '',
      lastSync: null
    },
    settings: {
      autoSync: true,
      privateRepo: false,
      includeTests: true
    },
    recentActivity: [],
    isLoading: false,
    error: null
  });

  const handleSync = () => {
    setState(prev => ({ 
      ...prev, 
      syncStatus: { 
        ...prev.syncStatus, 
        isRunning: true, 
        progress: 50, 
        currentTask: 'Syncing solutions...' 
      }
    }));
    
    // Simulate sync completion
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isRunning: false,
          progress: 100,
          currentTask: 'Sync completed!',
          lastSync: new Date()
        }
      }));
    }, 2000);
  };

  const handleSettingChange = (key: keyof Settings, value: boolean) => {
    setState(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, [key]: value } 
    }));
  };

  const connectGitHub = () => {
    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        github: { connected: true, username: 'demo-user' }
      }
    }));
  };

  if (state.isLoading) {
    return (
      <div className="w-80 bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-orange-500 rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Leet2Git</h1>
          </div>
          <button 
            onClick={openSettings}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Connection Status</h2>
        
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-sm text-gray-900">GitHub</span>
          </div>
          <div className="flex items-center space-x-2">
            {state.connectionStatus.github.connected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <button 
                  onClick={openGitHubAuth}
                  className="text-xs text-blue-600 font-medium hover:text-blue-700"
                >
                  Connect
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">LC</span>
            </div>
            <span className="text-sm text-gray-900">LeetCode</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${state.connectionStatus.leetcode.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${state.connectionStatus.leetcode.connected ? 'text-green-600' : 'text-red-600'}`}>
              {state.connectionStatus.leetcode.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Sync Status</h2>
          <button 
            onClick={handleSync}
            disabled={state.syncStatus.isRunning || !state.connectionStatus.github.connected || !state.connectionStatus.leetcode.connected}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.syncStatus.isRunning ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        
        {state.syncStatus.isRunning && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{state.syncStatus.currentTask}</span>
                <span>{Math.round(state.syncStatus.progress)}%</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${state.syncStatus.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {state.syncStatus.lastSync && (
          <div className="text-xs text-gray-500 mt-2">
            Last sync: {state.syncStatus.lastSync.toLocaleString()}
          </div>
        )}
      </div>

      {/* Quick Settings */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Quick Settings</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">Auto Sync</div>
              <div className="text-xs text-gray-500">Automatically sync new solutions</div>
            </div>
            <button
              onClick={() => handleSettingChange('autoSync', !state.settings.autoSync)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                state.settings.autoSync ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                state.settings.autoSync ? 'translate-x-5' : 'translate-x-1'
              }`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">Private Repository</div>
              <div className="text-xs text-gray-500">Create private GitHub repos</div>
            </div>
            <button
              onClick={() => handleSettingChange('privateRepo', !state.settings.privateRepo)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                state.settings.privateRepo ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                state.settings.privateRepo ? 'translate-x-5' : 'translate-x-1'
              }`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">Include Test Cases</div>
              <div className="text-xs text-gray-500">Add test cases to synced files</div>
            </div>
            <button
              onClick={() => handleSettingChange('includeTests', !state.settings.includeTests)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                state.settings.includeTests ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                state.settings.includeTests ? 'translate-x-5' : 'translate-x-1'
              }`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white mx-4 mt-4 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h2>
        
        <div className="space-y-2">
          {state.recentActivity.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400">Start syncing to see your activity</p>
            </div>
          ) : (
            state.recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 py-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  activity.status === 'success' ? 'bg-green-500' : 
                  activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{activity.title}</div>
                  <div className="text-xs text-gray-500">
                    {activity.timestamp.toLocaleString()}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  activity.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  activity.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.difficulty}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 mt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {state.recentActivity.length} problems synced
          </div>
          <button 
            onClick={() => chrome.tabs.create({ url: 'https://github.com' })}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
