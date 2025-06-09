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
      
      // Attach event listeners for solution items (CSP compliant)
      attachSolutionEventListeners();
    }
  }

  function attachSolutionEventListeners() {
    // Add click listeners for solution headers
    document.querySelectorAll('.solution-header').forEach((header, index) => {
      header.addEventListener('click', () => toggleCodePreview(index));
    });

    // Add click listeners for copy buttons
    document.querySelectorAll('.copy-button').forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the header click
        copyCode(index);
      });
    });
  }

  function renderHomeTab() {
    const stats = homeData?.stats || { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] };
    const auth = homeData?.auth || { connected: false };
    const config = homeData?.config || {};
    
    // Check if GitHub is properly connected
    const connected = auth && (auth.connected === true || auth.token);
    const username = auth?.username || 'Not connected';
    const repoInfo = config?.owner && config?.repo ? `${config.owner}/${config.repo}` : 'Not configured';

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Connection Status -->
        <div class="status-card">
          <div class="status-row">
            <div class="status-left">
              <div class="status-dot ${connected ? 'connected' : 'disconnected'}"></div>
              <span style="font-weight: 500; font-size: 14px;">GitHub</span>
            </div>
            <div class="status-right">
              <span style="font-size: 12px; color: #64748b;">${username}</span>
            </div>
          </div>
          ${config?.owner && config?.repo ? `
            <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
              Repository: ${repoInfo}
            </div>
          ` : ''}
        </div>

        <!-- Statistics -->
        <div class="stats-card">
          <div class="stats-header">
            <h3 style="font-weight: 500; color: #1e293b; margin: 0; font-size: 14px;">Statistics</h3>
            <div class="streak-badge">🔥 ${stats.streak} day streak</div>
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
            pending.map((item, index) => `
              <div class="solution-item" data-index="${index}">
                <div class="solution-header" style="cursor: pointer;" data-index="${index}">
                  <div class="solution-title">${item.title}</div>
                  <div class="solution-meta">
                    <span class="meta-tag language-tag">${item.lang || item.language}</span>
                    <span class="meta-tag difficulty-tag ${(item.difficulty || 'medium').toLowerCase()}">${item.difficulty || 'Medium'}</span>
                    ${item.tag ? `<span class="meta-tag tag-badge">${item.tag}</span>` : ''}
                    <span class="expand-icon" id="expandIcon${index}">▼</span>
                  </div>
                </div>
                <div class="solution-info" style="font-size: 12px; color: #64748b; margin-top: 4px;">
                  <span>${formatTimeAgo(item.timestamp)}</span>
                  ${item.runtime ? `<span> • ${item.runtime}</span>` : ''}
                  ${item.memory ? `<span> • ${item.memory}</span>` : ''}
                </div>
                <div class="code-preview" id="codePreview${index}" style="display: none; margin-top: 12px;">
                  <div class="code-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 500; color: #64748b;">Code Preview</span>
                    <button class="copy-button" data-index="${index}" style="font-size: 11px; padding: 4px 8px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">Copy</button>
                  </div>
                  <pre class="code-content" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px; font-family: 'Monaco', 'Consolas', monospace; overflow-x: auto; max-height: 200px; overflow-y: auto;"><code>${escapeHtml(item.code || '// Code not available')}</code></pre>
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
    if (!homeData?.auth?.connected && !homeData?.auth?.token) {
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
        showPushResult(response.message || 'Successfully pushed solutions!', true);
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

  function toggleCodePreview(index) {
    const preview = document.getElementById(`codePreview${index}`);
    const icon = document.getElementById(`expandIcon${index}`);
    
    if (preview.style.display === 'none' || preview.style.display === '') {
      preview.style.display = 'block';
      icon.textContent = '▲';
    } else {
      preview.style.display = 'none';
      icon.textContent = '▼';
    }
  }

  function copyCode(index) {
    const pending = homeData?.pending || [];
    const item = pending[index];
    
    if (item && item.code) {
      navigator.clipboard.writeText(item.code).then(() => {
        const button = document.querySelector(`[data-index="${index}"].copy-button`);
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 1000);
        }
      }).catch(err => {
        console.error('Failed to copy code:', err);
      });
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();