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
          <div style={{textAlign: 'center'}}>
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>{stats.counts.easy}</div>
              <div style={{fontSize: '12px'}}>Easy</div>
            </div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>{stats.counts.medium}</div>
              <div style={{fontSize: '12px'}}>Medium</div>
            </div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <div style={{fontSize: '18px', fontWeight: '600'}}>{stats.counts.hard}</div>
              <div style={{fontSize: '12px'}}>Hard</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#0f172a', 
            marginBottom: '12px', 
            display: 'flex', 
            alignItems: 'center'
          }}>
            <svg style={{width: '16px', height: '16px', marginRight: '6px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Recent Solves
          </h3>
          
          <div style={{
            maxHeight: '160px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {stats.recentSolves.slice(0, 5).map((solve) => (
              <div key={solve.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                transition: 'background-color 0.2s'
              }}>
                <div style={{flex: '1', minWidth: '0'}}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {solve.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '4px',
                    gap: '8px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff'
                    }}>
                      {solve.language}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      <svg style={{width: '12px', height: '12px', marginRight: '4px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            Open LeetCode
            <svg style={{width: '16px', height: '16px', marginLeft: '8px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: '50',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s',
          backgroundColor: showToast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: showToast.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
          color: showToast.type === 'success' ? '#166534' : '#991b1b'
        }}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <svg style={{width: '20px', height: '20px', marginRight: '8px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span style={{fontSize: '14px', fontWeight: '500'}}>{showToast.message}</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePush}
        disabled={isPushing || pending.length === 0}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '8px',
          border: 'none',
          cursor: isPushing || pending.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          backgroundColor: isPushing || pending.length === 0 ? '#f1f5f9' : '#4f46e5',
          color: isPushing || pending.length === 0 ? '#94a3b8' : '#ffffff',
          boxShadow: isPushing || pending.length === 0 ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        {isPushing ? (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '8px'
            }}></div>
            Pushing to GitHub...
          </div>
        ) : (
          `Push to GitHub (${pending.length})`
        )}
      </button>

      <div style={{
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {pending.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <svg style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px auto',
              color: '#cbd5e1'
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#0f172a',
              marginBottom: '4px'
            }}>No pending solutions</h3>
            <p style={{fontSize: '12px'}}>Solutions you solve will appear here before pushing to GitHub</p>
          </div>
        ) : (
          <div style={{overflow: 'hidden'}}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#0f172a'
              }}>Pending Solutions</h3>
            </div>
            <div style={{
              maxHeight: '256px',
              overflowY: 'auto'
            }}>
              {pending.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{flex: '1', minWidth: '0'}}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </div>
                    <div style={{marginTop: '4px'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff'
                      }}>
                        {item.language}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingItem(item.id)}
                    style={{
                      marginLeft: '16px',
                      padding: '6px',
                      color: '#94a3b8',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="Remove from pending"
                  >
                    <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div style={{
        width: '320px', 
        backgroundColor: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '384px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #e2e8f0',
          borderTop: '2px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{width: '320px', backgroundColor: '#ffffff'}}>
      <div style={{padding: '12px 16px', borderBottom: '1px solid #e2e8f0'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{width: '16px', height: '16px', color: '#ffffff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 style={{fontSize: '18px', fontWeight: '600', color: '#0f172a'}}>Leet2Git</h1>
          </div>
          <button 
            onClick={openSettings}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <svg style={{width: '16px', height: '16px', color: '#64748b'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{display: 'flex', borderBottom: '1px solid #e2e8f0'}}>
        <button
          onClick={() => setTab('home')}
          style={{
            flex: '1',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: tab === 'home' ? '#eef2ff' : 'transparent',
            color: tab === 'home' ? '#4f46e5' : '#64748b',
            borderBottom: tab === 'home' ? '2px solid #4f46e5' : '2px solid transparent'
          }}
        >
          Home
        </button>
        <button
          onClick={() => setTab('push')}
          style={{
            flex: '1',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: tab === 'push' ? '#eef2ff' : 'transparent',
            color: tab === 'push' ? '#4f46e5' : '#64748b',
            borderBottom: tab === 'push' ? '2px solid #4f46e5' : '2px solid transparent'
          }}
        >
          Push ({pending.length})
        </button>
      </div>

      <div style={{padding: '16px'}}>
        {tab === 'home' && (
          <div>
            <HomeStats stats={stats} />
          </div>
        )}
        {tab === 'push' && (
          <div>
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