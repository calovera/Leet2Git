
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Github, Settings, RefreshCw } from 'lucide-react';
import { HomeStats } from './components/HomeStats';
import { PushPanel } from './components/PushPanel';

interface GitHubUser {
  username: string;
  email: string;
  connected: boolean;
}

interface LeetCodeStatus {
  connected: boolean;
  username?: string;
  error?: string;
}

export default function ExtensionApp() {
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [leetcodeStatus, setLeetcodeStatus] = useState<LeetCodeStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadUserData();
    checkLeetCodeStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await chrome.storage.local.get(['github_user']);
      if (result.github_user) {
        setGithubUser(result.github_user);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLeetCodeStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_LEETCODE_STATUS'
      });
      setLeetcodeStatus(response);
    } catch (error) {
      console.error('Failed to check LeetCode status:', error);
      setLeetcodeStatus({ connected: false, error: 'Failed to check status' });
    }
  };

  const handleGitHubAuth = () => {
    const clientId = 'your_github_client_id'; // Replace with your actual client ID
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
    
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (responseUrl) => {
      if (responseUrl) {
        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        if (code) {
          chrome.runtime.sendMessage({
            type: 'GITHUB_AUTH',
            code: code
          }, (response) => {
            if (response.success) {
              setGithubUser(response.user);
            } else {
              console.error('Auth failed:', response.error);
            }
          });
        }
      }
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_SOLUTIONS'
      });
      
      if (response.error) {
        console.error('Sync failed:', response.error);
      } else {
        console.log('Sync completed:', response);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const openLeetCode = () => {
    chrome.tabs.create({ url: 'https://leetcode.com' });
  };

  if (loading) {
    return (
      <div className="chrome-extension-popup p-4">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="animate-spin h-6 w-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="chrome-extension-popup">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Leet2Git</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={openOptions}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span className="text-sm font-medium">GitHub</span>
              </div>
              <Badge variant={githubUser?.connected ? "default" : "secondary"}>
                {githubUser?.connected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="text-sm font-medium">LeetCode</span>
              </div>
              <Badge variant={leetcodeStatus.connected ? "default" : "secondary"}>
                {leetcodeStatus.connected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <HomeStats />

          {/* Actions */}
          <div className="space-y-2">
            {!githubUser?.connected ? (
              <Button onClick={handleGitHubAuth} className="w-full">
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleSync} 
                  disabled={syncing || !leetcodeStatus.connected}
                  className="w-full"
                >
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitBranch className="h-4 w-4 mr-2" />
                  )}
                  {syncing ? "Syncing..." : "Sync Solutions"}
                </Button>
                
                <PushPanel />
              </div>
            )}
            
            {!leetcodeStatus.connected && (
              <Button variant="outline" onClick={openLeetCode} className="w-full">
                Open LeetCode
              </Button>
            )}
          </div>

          {/* User Info */}
          {githubUser?.connected && (
            <div className="text-xs text-muted-foreground text-center">
              Connected as {githubUser.username}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
