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
  tag: string;
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

      {/* Difficulty Breakdown */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '12px' }}>
          Problem Breakdown
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
              {stats.counts.easy}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>Easy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.counts.medium}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>Medium</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.counts.hard}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>Hard</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '12px' }}>
          Recent Activity
        </div>
        {stats.recentSolves.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '12px',
            padding: '8px 0'
          }}>
            No recent activity
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
            {stats.recentSolves.slice(0, 3).map((solve, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff' }}>
                    {solve.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getLanguageColor(solve.language)
                    }} />
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {solve.language}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
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

const PushSection = ({ pending, onRefresh }: { pending: PendingItem[], onRefresh: () => void }) => {
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const handlePush = async () => {
    if (pending.length === 0) {
      setPushStatus('No pending solutions to push');
      return;
    }

    setIsPushing(true);
    setPushStatus('Syncing with GitHub...');

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'push' }, resolve);
      });

      if (response.success) {
        setPushStatus(`✓ Successfully pushed ${response.count} solution(s)`);
        // Refresh the data immediately after successful push
        setTimeout(() => {
          onRefresh();
          setPushStatus('');
        }, 2000);
      } else {
        setPushStatus(`✗ ${response.error || 'Failed to push solutions'}`);
      }
    } catch (error) {
      setPushStatus('✗ Failed to sync with GitHub');
    }

    setIsPushing(false);
  };

  const toggleCodePreview = (itemId: string) => {
    setExpandedCode(expandedCode === itemId ? null : itemId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with Push Button */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
            Pending Solutions ({pending.length})
          </div>
          <button
            onClick={handlePush}
            disabled={isPushing || pending.length === 0}
            style={{
              background: pending.length === 0 ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: pending.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isPushing ? 0.7 : 1
            }}
          >
            {isPushing ? 'Syncing...' : 'Push to GitHub'}
          </button>
        </div>
        
        {pushStatus && (
          <div style={{
            fontSize: '12px',
            color: pushStatus.startsWith('✓') ? '#10b981' : pushStatus.startsWith('✗') ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
            marginTop: '8px'
          }}>
            {pushStatus}
          </div>
        )}
      </div>

      {/* Pending Solutions List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {pending.map((item, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
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
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggleCodePreview(item.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {expandedCode === item.id ? 'Hide' : 'Code'}
                    </button>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f59e0b'
                    }} />
                  </div>
                </div>
                
                {expandedCode === item.id && (
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Code Preview:
                    </div>
                    <pre style={{
                      fontSize: '10px',
                      color: '#ffffff',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '150px',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                    }}>
                      {item.code}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsSection = ({ auth, config, onAuthUpdate }: { 
  auth: GitHubAuth | null, 
  config: RepoCfg,
  onAuthUpdate: (auth: GitHubAuth) => void 
}) => {
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
        onAuthUpdate(response.auth);
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
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '12px' }}>
          GitHub Authentication
        </div>
        
        {auth?.connected ? (
          <div style={{
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff' }}>
                Connected as {auth.username}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {auth.email}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              placeholder="Enter GitHub Personal Access Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              onClick={handleVerifyToken}
              disabled={isVerifying}
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: isVerifying ? 0.7 : 1
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Token'}
            </button>
            {verifyStatus && (
              <div style={{
                fontSize: '11px',
                color: verifyStatus.startsWith('✓') ? '#10b981' : '#ef4444',
                marginTop: '4px'
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
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '12px' }}>
          Repository Configuration
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="Username"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Repository name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          <input
            type="text"
            placeholder="Branch (default: main)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#ffffff',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Folder Structure
            </label>
            <select
              value={folderStructure}
              onChange={(e) => setFolderStructure(e.target.value as 'difficulty' | 'topic' | 'flat')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="topic">By Topic (recommended)</option>
              <option value="difficulty">By Difficulty</option>
              <option value="flat">Flat Structure</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="private-repo"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ accentColor: '#3B82F6' }}
            />
            <label htmlFor="private-repo" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Create as private repository
            </label>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>

          {saveStatus && (
            <div style={{
              fontSize: '11px',
              color: saveStatus.startsWith('✓') ? '#10b981' : '#ef4444',
              marginTop: '4px'
            }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Popup = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'push' | 'settings'>('home');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHomeData = async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'getHomeData' }, resolve);
      });

      if (response.success) {
        setHomeData(response.data);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleAuthUpdate = (auth: GitHubAuth) => {
    setHomeData(prev => prev ? { ...prev, auth } : null);
  };

  if (isLoading) {
    return (
      <div style={{
        width: '380px',
        height: '600px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        Loading...
      </div>
    );
  }

  if (!homeData) {
    return (
      <div style={{
        width: '380px',
        height: '600px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        Failed to load data
      </div>
    );
  }

  return (
    <div style={{
      width: '380px',
      height: '600px',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            L2G
          </div>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Leet2Git</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        margin: '8px',
        borderRadius: '12px',
        padding: '4px'
      }}>
        {(['home', 'push', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === tab ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        {activeTab === 'home' && <HomeSection stats={homeData.stats} />}
        {activeTab === 'push' && <PushSection pending={homeData.pending} onRefresh={loadHomeData} />}
        {activeTab === 'settings' && (
          <SettingsSection 
            auth={homeData.auth} 
            config={homeData.config}
            onAuthUpdate={handleAuthUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default Popup;