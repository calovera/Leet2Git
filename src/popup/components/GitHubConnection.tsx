import React, { useState, useEffect } from 'react';
import { GitHubAuth } from '../../types/models';
import { getAuth, setAuth } from '../../utils/storage';
import { verifyToken } from '../../utils/github';

interface GitHubConnectionProps {
  onAuthChange?: (auth: GitHubAuth | null) => void;
}

export default function GitHubConnection({ onAuthChange }: GitHubConnectionProps) {
  const [auth, setAuthState] = useState<GitHubAuth | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    const authData = await getAuth();
    setAuthState(authData);
    onAuthChange?.(authData);
  };

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verification = await verifyToken(token);
      
      if (verification.valid && verification.username) {
        const newAuth: GitHubAuth = {
          token,
          username: verification.username,
          email: '',
          connected: true
        };

        await setAuth(newAuth);
        setAuthState(newAuth);
        setToken('');
        onAuthChange?.(newAuth);
      } else {
        setError(verification.error || 'Invalid GitHub token');
      }
    } catch (err) {
      setError('Failed to verify GitHub token');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const emptyAuth: GitHubAuth = {
      token: '',
      username: '',
      email: '',
      connected: false
    };

    await setAuth(emptyAuth);
    setAuthState(emptyAuth);
    onAuthChange?.(emptyAuth);
  };

  if (auth?.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 text-sm font-medium">@{auth.username}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        <p className="text-yellow-800 text-sm">
          Connect GitHub to sync your solutions
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub token (ghp_...)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect GitHub'}
        </button>
        <p className="text-xs text-gray-500">
          Get token at{' '}
          <a 
            href="https://github.com/settings/tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            github.com/settings/tokens
          </a>
        </p>
      </div>
    </div>
  );
}