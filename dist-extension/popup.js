// Leet2Git Chrome Extension Popup - CSP Compliant
(function() {
  let currentTab = 'home';
  let homeData = null;
  let pushing = false;

  document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadHomeData();
  });

  function setupEventListeners() {
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
    
    // Update tab styles
    if (tab === 'home') {
      homeTab.classList.add('active');
      pushTab.classList.remove('active');
    } else {
      homeTab.classList.remove('active');
      pushTab.classList.add('active');
    }
    
    renderTabContent();
  }

  function loadHomeData() {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'getHomeData' }, (response) => {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tabContent').style.display = 'block';
        
        if (response && response.success && response.data) {
          homeData = response.data;
          console.log('Loaded home data:', homeData);
        } else {
          console.log('No data received or error:', response);
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
      // Re-attach event listeners for home tab
      const configureBtn = document.getElementById('configureBtn');
      if (configureBtn) {
        configureBtn.addEventListener('click', openOptions);
      }
    } else {
      content.innerHTML = renderPushTab();
      // Re-attach event listeners for push tab
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
        <!-- GitHub Status -->
        <div class="status-card">
          <div class="status-row">
            <div class="status-left">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span style="font-size: 14px; font-weight: 500;">GitHub</span>
            </div>
            <div class="status-right">
              <div class="status-dot ${connected ? 'connected' : 'disconnected'}"></div>
              <span style="font-size: 12px; color: ${connected ? '#059669' : '#dc2626'};">
                ${connected ? `Connected${username ? ` as ${username}` : ''}` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-card">
          <div class="stats-header">
            <h3 style="font-weight: 500; color: #1e293b; margin: 0; font-size: 14px;">Statistics</h3>
            <div class="streak-badge">${stats.streak} day streak</div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item easy">
              <div class="stat-number easy">${stats.counts.easy}</div>
              <div class="stat-label easy">Easy</div>
            </div>
            <div class="stat-item medium">
              <div class="stat-number medium">${stats.counts.medium}</div>
              <div class="stat-label medium">Medium</div>
            </div>
            <div class="stat-item hard">
              <div class="stat-number hard">${stats.counts.hard}</div>
              <div class="stat-label hard">Hard</div>
            </div>
          </div>
        </div>

        <!-- Recent Solves -->
        <div class="stats-card">
          <h3 style="font-weight: 500; color: #1e293b; margin: 0 0 12px 0; font-size: 14px;">Recent Solves</h3>
          <div style="max-height: 120px; overflow-y: auto;">
            ${stats.recentSolves.length > 0 ? 
              stats.recentSolves.slice(0, 5).map(solve => `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                  <div style="flex: 1; min-width: 0;">
                    <div class="solution-title">${solve.title}</div>
                    <div style="font-size: 12px; color: #64748b;">${solve.language} • ${formatTimeAgo(solve.timestamp)}</div>
                  </div>
                </div>
              `).join('') :
              `<div class="empty-state">
                <p style="font-size: 14px; margin: 0;">No solutions yet</p>
                <p style="font-size: 12px; margin: 4px 0 0 0;">Solve problems to see them here</p>
              </div>`
            }
          </div>
        </div>

        ${!connected ? `
          <button id="configureBtn" class="btn btn-primary" style="width: 100%;">
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
        <div class="push-header">
          <h3 style="font-weight: 500; color: #1e293b; margin: 0; font-size: 14px;">Pending Solutions</h3>
          <button id="pushBtn" class="btn btn-primary" ${pushing || pending.length === 0 ? 'disabled' : ''}>
            ${pushing ? 'Pushing...' : 'Push to GitHub'}
          </button>
        </div>

        <div id="pushResult" class="result-message"></div>

        <div style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
          ${pending.length > 0 ? 
            pending.map(item => `
              <div class="solution-item">
                <div class="solution-title">${item.title}</div>
                <div class="solution-meta">
                  <span class="meta-tag language-tag">${item.language}</span>
                  <span class="meta-tag difficulty-tag ${item.difficulty.toLowerCase()}">${item.difficulty}</span>
                </div>
              </div>
            `).join('') :
            `<div class="empty-state">
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
    const pushBtn = document.getElementById('pushBtn');
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing...';
    
    chrome.runtime.sendMessage({ type: 'push' }, (response) => {
      pushing = false;
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push to GitHub';
      
      if (response?.success) {
        showPushResult(`Successfully pushed ${response.results?.length || 0} solutions!`, true);
        loadHomeData(); // Refresh data
      } else {
        showPushResult(`Push failed: ${response?.error || 'Unknown error'}`, false);
      }
    });
  }

  function showPushResult(message, success) {
    const resultDiv = document.getElementById('pushResult');
    resultDiv.style.display = 'block';
    resultDiv.className = `result-message ${success ? 'result-success' : 'result-error'}`;
    resultDiv.textContent = message;
    
    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
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