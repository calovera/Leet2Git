// Leet2Git Chrome Extension Popup - Production Ready
(function() {
  let currentTab = 'home';
  let homeData = null;
  let pushing = false;

  document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    loadHomeData();
  });

  function initializePopup() {
    const container = document.getElementById('root');
    
    container.innerHTML = `
      <div style="width: 320px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
              L2G
            </div>
            <h1 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0;">Leet2Git</h1>
          </div>
          <button id="optionsBtn" style="padding: 6px; border: none; background: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="color: #64748b;">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div style="display: flex; border-bottom: 1px solid #e2e8f0;">
          <button id="homeTab" style="flex: 1; padding: 12px; border: none; background: #f8fafc; color: #4f46e5; font-weight: 500; font-size: 14px; border-bottom: 2px solid #4f46e5; cursor: pointer;">
            Home
          </button>
          <button id="pushTab" style="flex: 1; padding: 12px; border: none; background: none; color: #64748b; font-weight: 500; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='none'">
            Push (0)
          </button>
        </div>

        <!-- Loading State -->
        <div id="loadingState" style="padding: 32px; text-align: center;">
          <div style="width: 32px; height: 32px; border: 2px solid #e2e8f0; border-top: 2px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Loading...</p>
        </div>

        <!-- Content -->
        <div id="tabContent" style="padding: 16px; max-height: 400px; overflow-y: auto; display: none;">
          <!-- Tab content will be rendered here -->
        </div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.getElementById('optionsBtn').addEventListener('click', openOptions);
    document.getElementById('homeTab').addEventListener('click', () => switchTab('home'));
    document.getElementById('pushTab').addEventListener('click', () => switchTab('push'));
  }

  function openOptions() {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      console.error('Chrome runtime not available');
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    
    const homeTab = document.getElementById('homeTab');
    const pushTab = document.getElementById('pushTab');
    
    if (tab === 'home') {
      homeTab.style.background = '#f8fafc';
      homeTab.style.color = '#4f46e5';
      homeTab.style.borderBottom = '2px solid #4f46e5';
      pushTab.style.background = 'none';
      pushTab.style.color = '#64748b';
      pushTab.style.borderBottom = '2px solid transparent';
    } else {
      homeTab.style.background = 'none';
      homeTab.style.color = '#64748b';
      homeTab.style.borderBottom = '2px solid transparent';
      pushTab.style.background = '#f8fafc';
      pushTab.style.color = '#4f46e5';
      pushTab.style.borderBottom = '2px solid #4f46e5';
    }
    
    renderTabContent();
  }

  function loadHomeData() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tabContent').style.display = 'block';
        
        if (response && response.success) {
          homeData = response.data;
        } else {
          homeData = {
            stats: { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
            pending: [],
            auth: { connected: false },
            config: {}
          };
        }
        
        updatePushTabBadge();
        renderTabContent();
      });
    } else {
      document.getElementById('loadingState').style.display = 'none';
      document.getElementById('tabContent').style.display = 'block';
      homeData = {
        stats: { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
        pending: [],
        auth: { connected: false },
        config: {}
      };
      renderTabContent();
    }
  }

  function updatePushTabBadge() {
    const pushTab = document.getElementById('pushTab');
    const pendingCount = homeData?.pending?.length || 0;
    pushTab.textContent = `Push (${pendingCount})`;
  }

  function renderTabContent() {
    const content = document.getElementById('tabContent');
    
    if (currentTab === 'home') {
      content.innerHTML = renderHomeTab();
    } else {
      content.innerHTML = renderPushTab();
      const pushBtn = document.getElementById('pushBtn');
      if (pushBtn) {
        pushBtn.addEventListener('click', handlePush);
      }
    }
  }

  function renderHomeTab() {
    const connected = homeData?.auth?.connected || false;
    const username = homeData?.auth?.username || '';
    const stats = homeData?.stats || { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] };
    
    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- GitHub Connection Status -->
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span style="font-size: 14px; font-weight: 500;">GitHub</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${connected ? '#10b981' : '#ef4444'};"></div>
              <span style="font-size: 12px; color: ${connected ? '#059669' : '#dc2626'};">
                ${connected ? `Connected${username ? ` as ${username}` : ''}` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-weight: 500; color: #1e293b; margin: 0; font-size: 14px;">Statistics</h3>
            <div style="background: #eef2ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${stats.streak} day streak
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div style="text-align: center; padding: 8px; background: #f0fdf4; border-radius: 6px;">
              <div style="font-size: 18px; font-weight: 600; color: #166534;">${stats.counts.easy}</div>
              <div style="font-size: 12px; color: #16a34a;">Easy</div>
            </div>
            <div style="text-align: center; padding: 8px; background: #fffbeb; border-radius: 6px;">
              <div style="font-size: 18px; font-weight: 600; color: #92400e;">${stats.counts.medium}</div>
              <div style="font-size: 12px; color: #d97706;">Medium</div>
            </div>
            <div style="text-align: center; padding: 8px; background: #fef2f2; border-radius: 6px;">
              <div style="font-size: 18px; font-weight: 600; color: #991b1b;">${stats.counts.hard}</div>
              <div style="font-size: 12px; color: #dc2626;">Hard</div>
            </div>
          </div>
        </div>

        <!-- Recent Solves -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <h3 style="font-weight: 500; color: #1e293b; margin: 0 0 12px 0; font-size: 14px;">Recent Solves</h3>
          <div style="max-height: 120px; overflow-y: auto;">
            ${stats.recentSolves.length > 0 ? 
              stats.recentSolves.slice(0, 5).map(solve => `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${solve.title}</div>
                    <div style="font-size: 12px; color: #64748b;">${solve.language} • ${formatTimeAgo(solve.timestamp)}</div>
                  </div>
                </div>
              `).join('') :
              `<div style="text-align: center; padding: 16px 0; color: #64748b;">
                <p style="font-size: 14px; margin: 0;">No solutions yet</p>
                <p style="font-size: 12px; margin: 4px 0 0 0;">Solve problems to see them here</p>
              </div>`
            }
          </div>
        </div>

        ${!connected ? `
          <button onclick="chrome.runtime.openOptionsPage()" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 12px 16px; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
            Configure GitHub
          </button>
        ` : ''}
      </div>
    `;
  }

  function renderPushTab() {
    const pending = homeData?.pending || [];
    
    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-weight: 500; color: #1e293b; margin: 0; font-size: 14px;">Pending Solutions</h3>
          <button id="pushBtn" ${pushing || pending.length === 0 ? 'disabled' : ''} 
                  style="background: ${pushing || pending.length === 0 ? '#94a3b8' : '#4f46e5'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: ${pushing || pending.length === 0 ? 'not-allowed' : 'pointer'};"
                  ${!pushing && pending.length > 0 ? `onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"` : ''}>
            ${pushing ? 'Pushing...' : 'Push to GitHub'}
          </button>
        </div>

        <div id="pushResult" style="display: none;"></div>

        <div style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
          ${pending.length > 0 ? 
            pending.map(item => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
                    <div style="display: flex; align-items: center; margin-top: 4px; gap: 8px;">
                      <span style="font-size: 12px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px;">${item.language}</span>
                      <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; ${getDifficultyStyle(item.difficulty)}">
                        ${item.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('') :
            `<div style="text-align: center; padding: 32px 0; color: #64748b;">
              <p style="font-size: 14px; margin: 0;">No pending solutions</p>
              <p style="font-size: 12px; margin: 4px 0 0 0;">Solve problems on LeetCode to see them here</p>
            </div>`
          }
        </div>
      </div>
    `;
  }

  function handlePush() {
    if (!homeData?.auth?.connected) {
      showPushResult('GitHub not connected. Please configure in Options.', false);
      return;
    }
    
    if (!homeData?.config?.owner) {
      showPushResult('Repository not configured. Please set up in Options.', false);
      return;
    }

    pushing = true;
    document.getElementById('pushBtn').disabled = true;
    document.getElementById('pushBtn').textContent = 'Pushing...';
    document.getElementById('pushBtn').style.background = '#94a3b8';
    document.getElementById('pushBtn').style.cursor = 'not-allowed';
    
    chrome.runtime.sendMessage({ type: 'push' }, (response) => {
      pushing = false;
      document.getElementById('pushBtn').disabled = false;
      document.getElementById('pushBtn').textContent = 'Push to GitHub';
      document.getElementById('pushBtn').style.background = '#4f46e5';
      document.getElementById('pushBtn').style.cursor = 'pointer';
      
      if (response?.success) {
        showPushResult(`Successfully pushed ${response.results?.length || 0} solutions!`, true);
        loadHomeData();
      } else {
        showPushResult(`Push failed: ${response?.error || 'Unknown error'}`, false);
      }
    });
  }

  function showPushResult(message, success) {
    const resultDiv = document.getElementById('pushResult');
    resultDiv.style.display = 'block';
    resultDiv.style.padding = '12px';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.fontSize = '14px';
    resultDiv.style.background = success ? '#f0fdf4' : '#fef2f2';
    resultDiv.style.color = success ? '#166534' : '#991b1b';
    resultDiv.style.border = `1px solid ${success ? '#bbf7d0' : '#fecaca'}`;
    resultDiv.textContent = message;
    
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
  }

  function getDifficultyStyle(difficulty) {
    switch(difficulty) {
      case 'Easy': return 'background: #f0fdf4; color: #166534;';
      case 'Medium': return 'background: #fffbeb; color: #92400e;';
      case 'Hard': return 'background: #fef2f2; color: #991b1b;';
      default: return 'background: #f1f5f9; color: #475569;';
    }
  }

  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
})();