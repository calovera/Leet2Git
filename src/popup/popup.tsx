import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

interface HomeData {
  stats: {
    streak: number;
    counts: { easy: number; medium: number; hard: number };
    recentSolves: Array<{
      id: string;
      title: string;
      language: string;
      timestamp: number;
    }>;
  };
  pending: Array<{
    id: string;
    title: string;
    language: string;
    difficulty: string;
  }>;
  auth: {
    connected: boolean;
    username?: string;
  };
  config: {
    owner?: string;
    repo?: string;
  };
}

const Popup: React.FC = () => {
  const [tab, setTab] = useState<'home' | 'push'>('home');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState('');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
        if (response?.success) {
          setHomeData(response.data);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Failed to load home data:', error);
      setLoading(false);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handlePush = async () => {
    if (!homeData?.auth?.connected) {
      setPushResult('GitHub not connected. Please configure in Options.');
      return;
    }
    
    if (!homeData?.config?.owner) {
      setPushResult('Repository not configured. Please set up in Options.');
      return;
    }

    setPushing(true);
    setPushResult('');
    
    chrome.runtime.sendMessage({ type: 'push' }, (response) => {
      setPushing(false);
      if (response?.success) {
        setPushResult(`Successfully pushed ${response.results?.length || 0} solutions!`);
        loadHomeData(); // Reload data
      } else {
        setPushResult(`Push failed: ${response?.error || 'Unknown error'}`);
      }
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="w-80 bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Leet2Git</h1>
          </div>
          <button 
            onClick={openOptions}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('home')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'home'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setTab('push')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'push'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Push ({homeData?.pending.length || 0})
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {tab === 'home' && (
          <div className="space-y-4">
            {/* GitHub Connection Status */}
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${homeData?.auth?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs ${homeData?.auth?.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {homeData?.auth?.connected ? `Connected${homeData.auth.username ? ` as ${homeData.auth.username}` : ''}` : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">Statistics</h3>
                <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                  {homeData?.stats.streak || 0} day streak
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-semibold text-green-800">{homeData?.stats.counts.easy || 0}</div>
                  <div className="text-xs text-green-600">Easy</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="text-lg font-semibold text-yellow-800">{homeData?.stats.counts.medium || 0}</div>
                  <div className="text-xs text-yellow-600">Medium</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-lg font-semibold text-red-800">{homeData?.stats.counts.hard || 0}</div>
                  <div className="text-xs text-red-600">Hard</div>
                </div>
              </div>
            </div>

            {/* Recent Solves */}
            <div className="rounded-lg bg-white border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Recent Solves</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {homeData?.stats.recentSolves.slice(0, 5).map((solve) => (
                  <div key={solve.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{solve.title}</div>
                      <div className="text-xs text-slate-500">{solve.language} • {formatTimeAgo(solve.timestamp)}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-sm">No solutions yet</p>
                    <p className="text-xs">Solve problems to see them here</p>
                  </div>
                )}
              </div>
            </div>

            {!homeData?.auth?.connected && (
              <button
                onClick={openOptions}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
              >
                Configure GitHub
              </button>
            )}
          </div>
        )}

        {tab === 'push' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Pending Solutions</h3>
              <button
                onClick={handlePush}
                disabled={pushing || !homeData?.pending.length}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors"
              >
                {pushing ? 'Pushing...' : 'Push to GitHub'}
              </button>
            </div>

            {pushResult && (
              <div className={`p-3 rounded-lg text-sm ${pushResult.includes('Successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {pushResult}
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {homeData?.pending.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{item.language}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No pending solutions</p>
                  <p className="text-xs">Solve problems on LeetCode to see them here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
