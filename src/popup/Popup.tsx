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
  slug: string;
  code: string;
  timestamp: number;
  description?: string;
  submissionId: string;
}

interface GitHubAuth {
  token: string;
  username: string;
  email: string;
  connected: boolean;
}

interface RepoCfg {
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: 'difficulty' | 'topic' | 'flat';
  includeDescription: boolean;
  includeTestCases: boolean;
}

interface HomeData {
  stats: Stats;
  pending: PendingItem[];
  auth: GitHubAuth | null;
  config: RepoCfg;
}

const HomeSection = ({ stats }: { stats: Stats }) => {
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
      'Python': '#3776ab',
      'JavaScript': '#f7df1e',
      'Java': '#ed8b00',
      'C++': '#00599c',
      'Go': '#00add8',
      'Rust': '#ce422b',
    };
    return colors[language] || '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            {stats.streak}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Day Streak</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            {stats.counts.easy + stats.counts.medium + stats.counts.hard}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Total Solved</div>
        </div>
      </div>

      {/* Difficulty Cards */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'Easy', count: stats.counts.easy, color: '#10b981' },
          { label: 'Medium', count: stats.counts.medium, color: '#f59e0b' },
          { label: 'Hard', count: stats.counts.hard, color: '#ef4444' }
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '10px',
            padding: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: color, marginBottom: '2px' }}>
              {count}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Solves */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          Recent Solves
        </div>
        {stats.recentSolves.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px'
          }}>
            <div style={{ marginBottom: '8px', fontSize: '20px' }}>🎯</div>
            <div>No recent solutions yet</div>
            <div>Start solving problems on LeetCode!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recentSolves.slice(0, 3).map((solve, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff' }}>
                    {solve.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: solve.difficulty === 'Easy' ? '#10b981' : 
                                solve.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      {solve.difficulty}
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'rgba(255, 255, 255, 0.7)',
                      background: `${getLanguageColor(solve.language)}20`,
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}>
                      {solve.language}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {formatTimeAgo(solve.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PushSection = ({ pending, auth }: { pending: PendingItem[], auth: GitHubAuth | null }) => {
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('');

  const handleSync = async () => {
    if (!auth || !auth.connected) {
      setPushStatus('Please connect to GitHub first in Settings tab');
      setTimeout(() => setPushStatus(''), 3000);
      return;
    }

    setIsPushing(true);
    setPushStatus('Syncing solutions to GitHub...');
    
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'push' }, resolve);
      });
      
      if (response.success) {
        setPushStatus(`Successfully synced ${response.count || 0} solutions!`);
      } else {
        setPushStatus(`Error: ${response.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      setPushStatus('Error: Failed to sync solutions');
    }
    
    setIsPushing(false);
    setTimeout(() => setPushStatus(''), 3000);
  };

  const isDisabled = isPushing || !auth?.connected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={isDisabled}
        style={{
          background: isDisabled 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(139, 92, 246, 0.9)',
          color: isDisabled ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isDisabled ? 0.6 : 1,
          backdropFilter: 'blur(12px)',
          boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(139, 92, 246, 0.3)'
        }}
      >
        {isPushing ? 'Syncing...' : !auth?.connected ? 'Connect GitHub First' : 'Sync to GitHub'}
      </button>

      {/* Status Message */}
      {pushStatus && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '13px',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          {pushStatus}
        </div>
      )}

      {/* Pending Solutions */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          Pending Solutions ({pending.length})
        </div>
        
        {pending.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px'
          }}>
            <div style={{ marginBottom: '8px', fontSize: '20px' }}>✨</div>
            <div>All caught up!</div>
            <div>No pending solutions to sync</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {pending.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff' }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.difficulty === 'Easy' ? '#10b981' : 
                                item.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      {item.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {item.language}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f59e0b'
                }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsSection = ({ auth, config }: { auth: GitHubAuth | null, config: RepoCfg }) => {
  const [token, setToken] = useState('');
  const [repoOwner, setRepoOwner] = useState(config?.owner || '');
  const [repoName, setRepoName] = useState(config?.repo || 'leetcode-solutions');
  const [branch, setBranch] = useState(config?.branch || 'main');
  const [isPrivate, setIsPrivate] = useState<boolean>(config?.private || false);
  const [folderStructure, setFolderStructure] = useState<'difficulty' | 'topic' | 'flat'>(config?.folderStructure || 'topic');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setVerifyStatus('Please enter a GitHub token');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus('Verifying token...');

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'auth', 
          data: { token: token.trim() }
        }, resolve);
      });

      if (response.success) {
        setVerifyStatus(`✓ Connected as ${response.username}`);
        setTimeout(() => setVerifyStatus(''), 3000);
      } else {
        setVerifyStatus(`✗ ${response.error || 'Invalid token'}`);
      }
    } catch (error) {
      setVerifyStatus('✗ Failed to verify token');
    }

    setIsVerifying(false);
  };

  const handleSaveConfig = async () => {
    const newConfig = {
      owner: repoOwner.trim(),
      repo: repoName.trim(),
      branch: branch.trim(),
      private: isPrivate,
      folderStructure: folderStructure,
      includeDescription: true,
      includeTestCases: false
    };

    if (!newConfig.owner || !newConfig.repo) {
      setSaveStatus('✗ Repository owner and name are required');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving configuration...');

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'updateConfig', 
          payload: newConfig 
        }, resolve);
      });

      if (response.success) {
        setSaveStatus('✓ Configuration saved successfully');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus(`✗ ${response.error || 'Failed to save configuration'}`);
      }
    } catch (error) {
      setSaveStatus('✗ Failed to save configuration');
    }

    setIsSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* GitHub Authentication */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          GitHub Authentication
        </div>
        
        {auth?.connected ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981'
            }} />
            <div style={{ color: '#ffffff', fontSize: '13px' }}>
              Connected as <strong>{auth.username}</strong>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              GitHub Personal Access Token:
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your GitHub token"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleVerifyToken}
              disabled={isVerifying}
              style={{
                background: 'rgba(139, 92, 246, 0.9)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                opacity: isVerifying ? 0.7 : 1
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Token'}
            </button>
            {verifyStatus && (
              <div style={{
                fontSize: '11px',
                color: verifyStatus.includes('✓') ? '#10b981' : '#ef4444',
                textAlign: 'center'
              }}>
                {verifyStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repository Configuration */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          Repository Configuration
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
              Repository Owner:
            </div>
            <input
              type="text"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              placeholder="GitHub username or organization"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
              Repository Name:
            </div>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="leetcode-solutions"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
              Branch:
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="private-repo"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <label htmlFor="private-repo" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Private Repository
            </label>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
              Folder Structure:
            </div>
            <select
              value={folderStructure}
              onChange={(e) => setFolderStructure(e.target.value as 'difficulty' | 'topic' | 'flat')}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="topic" style={{ background: '#1a1a1a' }}>By Topic</option>
              <option value="difficulty" style={{ background: '#1a1a1a' }}>By Difficulty</option>
              <option value="flat" style={{ background: '#1a1a1a' }}>Flat Structure</option>
            </select>
          </div>



          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            style={{
              background: 'rgba(139, 92, 246, 0.9)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              marginTop: '4px'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>

          {saveStatus && (
            <div style={{
              fontSize: '11px',
              color: saveStatus.includes('✓') ? '#10b981' : '#ef4444',
              textAlign: 'center'
            }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'push' | 'settings'>('home');
  const [homeData, setHomeData] = useState<HomeData>({
    stats: {
      streak: 0,
      counts: { easy: 0, medium: 0, hard: 0 },
      recentSolves: []
    },
    pending: [],
    auth: null,
    config: {
      owner: '',
      repo: 'leetcode-solutions',
      branch: 'main',
      private: false,
      folderStructure: 'topic' as 'topic',
      includeDescription: true,
      includeTestCases: false
    }
  });
  useEffect(() => {
    const fetchData = () => {
      try {
        chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
          if (response && response.success && response.data) {
            setHomeData(response.data);
          } else {
            console.error('Failed to fetch home data:', response);
          }
        });
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{
      width: '380px',
      height: '600px',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🎯
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
              Leet2Git
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              LeetCode → GitHub Sync
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'home', label: 'Home', icon: '🏠' },
            { key: 'push', label: 'Push', icon: '🚀' },
            { key: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'home' | 'push' | 'settings')}
              style={{
                flex: 1,
                padding: '8px 6px',
                background: activeTab === key 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '12px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        minHeight: 0
      }}>
        {activeTab === 'home' && homeData && (
          <HomeSection stats={homeData.stats} />
        )}
        
        {activeTab === 'push' && homeData && (
          <PushSection pending={homeData.pending} auth={homeData.auth} />
        )}
        
        {activeTab === 'settings' && homeData && (
          <SettingsSection auth={homeData.auth} config={homeData.config} />
        )}
      </div>
    </div>
  );
};

export default Popup;