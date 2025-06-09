// Leet2Git Chrome Extension Popup - Vanilla JavaScript Implementation
(function() {
  let currentTab = 'home';
  let homeData = null;
  let pushing = false;

  // Initialize popup when DOM loads
  document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    loadHomeData();
  });

  function initializePopup() {
    const container = document.getElementById('root');
    
    container.innerHTML = `
      <div class="w-80 bg-white">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </div>
              <h1 class="text-lg font-semibold text-slate-900">Leet2Git</h1>
            </div>
            <button id="optionsBtn" class="p-1.5 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200">
          <button id="homeTab" class="flex-1 px-4 py-3 text-sm font-medium transition-colors text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50">
            Home
          </button>
          <button id="pushTab" class="flex-1 px-4 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50">
            Push (0)
          </button>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="p-8 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p class="text-sm text-gray-600">Loading...</p>
          </div>
        </div>

        <!-- Content -->
        <div id="tabContent" class="p-4 max-h-96 overflow-y-auto" style="display: none;">
          <!-- Tab content will be rendered here -->
        </div>
      </div>
    `;

    // Add event listeners
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
    
    // Update tab appearance
    const homeTab = document.getElementById('homeTab');
    const pushTab = document.getElementById('pushTab');
    
    if (tab === 'home') {
      homeTab.className = 'flex-1 px-4 py-3 text-sm font-medium transition-colors text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50';
      pushTab.className = 'flex-1 px-4 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50';
    } else {
      homeTab.className = 'flex-1 px-4 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50';
      pushTab.className = 'flex-1 px-4 py-3 text-sm font-medium transition-colors text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50';
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
      // Fallback for testing
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
      // Add push button event listener
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
      <div class="space-y-4">
        <!-- GitHub Connection Status -->
        <div class="rounded-lg bg-slate-50 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="text-sm font-medium">GitHub</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}"></div>
              <span class="text-xs ${connected ? 'text-green-600' : 'text-red-600'}">
                ${connected ? `Connected${username ? ` as ${username}` : ''}` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="rounded-lg bg-white border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-slate-900">Statistics</h3>
            <div class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
              ${stats.streak} day streak
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center p-2 bg-green-50 rounded">
              <div class="text-lg font-semibold text-green-800">${stats.counts.easy}</div>
              <div class="text-xs text-green-600">Easy</div>
            </div>
            <div class="text-center p-2 bg-yellow-50 rounded">
              <div class="text-lg font-semibold text-yellow-800">${stats.counts.medium}</div>
              <div class="text-xs text-yellow-600">Medium</div>
            </div>
            <div class="text-center p-2 bg-red-50 rounded">
              <div class="text-lg font-semibold text-red-800">${stats.counts.hard}</div>
              <div class="text-xs text-red-600">Hard</div>
            </div>
          </div>
        </div>

        <!-- Recent Solves -->
        <div class="rounded-lg bg-white border border-slate-200 p-4">
          <h3 class="font-medium text-slate-900 mb-3">Recent Solves</h3>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            ${stats.recentSolves.length > 0 ? 
              stats.recentSolves.slice(0, 5).map(solve => `
                <div class="flex items-center justify-between text-sm">
                  <div class="flex-1 min-w-0">
                    <div class="truncate font-medium">${solve.title}</div>
                    <div class="text-xs text-slate-500">${solve.language} • ${formatTimeAgo(solve.timestamp)}</div>
                  </div>
                </div>
              `).join('') :
              `<div class="text-center py-4 text-slate-500">
                <p class="text-sm">No solutions yet</p>
                <p class="text-xs">Solve problems to see them here</p>
              </div>`
            }
          </div>
        </div>

        ${!connected ? `
          <button onclick="chrome.runtime.openOptionsPage()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors">
            Configure GitHub
          </button>
        ` : ''}
      </div>
    `;
  }

  function renderPushTab() {
    const pending = homeData?.pending || [];
    
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-slate-900">Pending Solutions</h3>
          <button id="pushBtn" ${pushing || pending.length === 0 ? 'disabled' : ''} 
                  class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors">
            ${pushing ? 'Pushing...' : 'Push to GitHub'}
          </button>
        </div>

        <div id="pushResult" class="hidden"></div>

        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${pending.length > 0 ? 
            pending.map(item => `
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">${item.title}</div>
                    <div class="flex items-center mt-1 space-x-2">
                      <span class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">${item.language}</span>
                      <span class="text-xs px-2 py-0.5 rounded ${getDifficultyClass(item.difficulty)}">
                        ${item.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('') :
            `<div class="text-center py-8 text-slate-500">
              <p class="text-sm">No pending solutions</p>
              <p class="text-xs">Solve problems on LeetCode to see them here</p>
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
    
    chrome.runtime.sendMessage({ type: 'push' }, (response) => {
      pushing = false;
      document.getElementById('pushBtn').disabled = false;
      document.getElementById('pushBtn').textContent = 'Push to GitHub';
      
      if (response?.success) {
        showPushResult(`Successfully pushed ${response.results?.length || 0} solutions!`, true);
        loadHomeData(); // Reload data
      } else {
        showPushResult(`Push failed: ${response?.error || 'Unknown error'}`, false);
      }
    });
  }

  function showPushResult(message, success) {
    const resultDiv = document.getElementById('pushResult');
    resultDiv.className = `p-3 rounded-lg text-sm ${success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`;
    resultDiv.textContent = message;
    resultDiv.classList.remove('hidden');
    
    setTimeout(() => {
      resultDiv.classList.add('hidden');
    }, 5000);
  }

  function getDifficultyClass(difficulty) {
    switch(difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
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