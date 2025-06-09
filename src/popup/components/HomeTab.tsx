import React, { useState, useEffect } from 'react';
import { HomeData } from '../../types/models';
import GitHubConnection from './GitHubConnection';

interface HomeTabProps {
  onDataUpdate?: () => void;
}

export default function HomeTab({ onDataUpdate }: HomeTabProps) {
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

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'Python': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Java': 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GitHubConnection onAuthChange={onDataUpdate} />
      
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
              <span>{homeData?.stats.streak || 0} day streak</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{homeData?.stats.counts.easy || 0}</div>
              <div className="text-xs">Easy</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{homeData?.stats.counts.medium || 0}</div>
              <div className="text-xs">Medium</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg">
              <div className="text-lg font-semibold">{homeData?.stats.counts.hard || 0}</div>
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
            {homeData?.stats.recentSolves.slice(0, 5).map((solve) => (
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
            )) || (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No solutions yet</p>
                <p className="text-xs">Solve problems on LeetCode to see them here</p>
              </div>
            )}
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
}