import React, { useState, useEffect } from 'react';

interface Stats {
  streak: number;
  counts: { easy: number; medium: number; hard: number };
  recentSolves: Array<{
    id: string;
    title: string;
    language: string;
    difficulty: string;
    timestamp: number;
  }>;
}

interface PendingItem {
  id: string;
  title: string;
  language: string;
  difficulty: string;
}

const HomeStats = ({ stats }: { stats: Stats }) => {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'Python': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Java': 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      <div style={{
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #e2e8f0',
        padding: '16px'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
              <span>{stats.streak} day streak</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div className="text-center">
            <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{stats.counts.easy}</div>
              <div className="text-xs">Easy</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{stats.counts.medium}</div>
              <div className="text-xs">Medium</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{stats.counts.hard}</div>
              <div className="text-xs">Hard</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Recent Solves
          </h3>
          
          <div className="max-h-40 overflow-auto space-y-2">
            {stats.recentSolves.slice(0, 5).map((solve) => (
              <div key={solve.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {solve.title}
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(solve.language)}`}>
                      {solve.language}
                    </span>
                    <div className="flex items-center text-xs text-slate-500">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTimeAgo(solve.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Open LeetCode
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

const PushPanel = ({ pending, setPending }: { 
  pending: PendingItem[], 
  setPending: React.Dispatch<React.SetStateAction<PendingItem[]>>
}) => {
  const [isPushing, setIsPushing] = useState(false);
  const [showToast, setShowToast] = useState<{ type: string; message: string } | null>(null);

  const removePendingItem = (id: string) => {
    setPending(prev => prev.filter(item => item.id !== id));
  };

  const handlePush = async () => {
    if (pending.length === 0) return;
    
    setIsPushing(true);
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'push' });
      if (response.success) {
        setPending([]);
        setShowToast({ type: 'success', message: response.message || 'Successfully pushed to GitHub' });
      } else {
        setShowToast({ type: 'error', message: response.error || 'Push failed' });
      }
    } catch (error) {
      setShowToast({ type: 'error', message: 'Error pushing to GitHub' });
    } finally {
      setIsPushing(false);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'Python': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Java': 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          showToast.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePush}
        disabled={isPushing || pending.length === 0}
        className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isPushing || pending.length === 0
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
        }`}
      >
        {isPushing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Pushing to GitHub...
          </div>
        ) : (
          `Push to GitHub (${pending.length})`
        )}
      </button>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {pending.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-slate-900 mb-1">No pending solutions</h3>
            <p className="text-xs">Solutions you solve will appear here before pushing to GitHub</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-medium text-slate-900">Pending Solutions</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {pending.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(item.language)}`}>
                        {item.language}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingItem(item.id)}
                    className="ml-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Remove from pending"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Popup() {
  const [tab, setTab] = useState('home');
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    counts: { easy: 0, medium: 0, hard: 0 },
    recentSolves: []
  });
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getHomeData' });
      if (response.success) {
        setStats(response.data.stats);
        setPending(response.data.pending);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="w-80 bg-white flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Leet2Git</h1>
          </div>
          <button 
            onClick={openSettings}
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
          Push ({pending.length})
        </button>
      </div>

      <div className="p-4">
        {tab === 'home' && (
          <div className="animate-in">
            <HomeStats stats={stats} />
          </div>
        )}
        {tab === 'push' && (
          <div className="animate-in">
            <PushPanel 
              pending={pending} 
              setPending={setPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}