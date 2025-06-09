import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import HomeTab from './components/HomeTab';
import PushTab from './components/PushTab';
import GitHubConnection from './components/GitHubConnection';
import { HomeData, GitHubAuth } from '../types/models';
import '../index.css';

const Popup: React.FC = () => {
  const [tab, setTab] = useState<'home' | 'push'>('home');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDataUpdate = () => {
    loadHomeData();
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

      <div className="p-4">
        {tab === 'home' && (
          <div className="animate-in">
            <HomeTab onDataUpdate={handleDataUpdate} />
          </div>
        )}
        {tab === 'push' && (
          <div className="animate-in">
            <PushTab onDataUpdate={handleDataUpdate} />
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
