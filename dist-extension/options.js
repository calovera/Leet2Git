// Leet2Git Options Page - Vanilla JavaScript Implementation
(function() {
  let config = {};
  let auth = {};

  document.addEventListener('DOMContentLoaded', function() {
    initializeOptions();
    loadSettings();
  });

  function initializeOptions() {
    const container = document.getElementById('root');
    
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 py-12">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl">
            <div class="px-6 py-8">
              <div class="flex items-center space-x-3 mb-8">
                <div class="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-slate-900">Leet2Git Settings</h1>
                  <p class="text-slate-600">Configure your GitHub integration and sync preferences</p>
                </div>
              </div>

              <!-- GitHub Authentication -->
              <div class="space-y-8">
                <div class="border-b border-slate-200 pb-8">
                  <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Authentication
                  </h2>
                  
                  <div id="authStatus" class="mb-4"></div>
                  
                  <div class="space-y-4">
                    <div>
                      <label for="githubToken" class="block text-sm font-medium text-slate-700 mb-2">
                        Personal Access Token
                      </label>
                      <input
                        type="password"
                        id="githubToken"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      />
                      <p class="mt-2 text-sm text-slate-500">
                        Create a token at 
                        <a href="https://github.com/settings/tokens" target="_blank" class="text-indigo-600 hover:text-indigo-500">
                          GitHub Settings → Developer settings → Personal access tokens
                        </a>
                        with 'repo' permissions.
                      </p>
                    </div>
                    
                    <button id="verifyBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      Verify Token
                    </button>
                  </div>
                </div>

                <!-- Repository Configuration -->
                <div class="border-b border-slate-200 pb-8">
                  <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Repository Settings
                  </h2>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="repoOwner" class="block text-sm font-medium text-slate-700 mb-2">
                        Repository Owner/Username
                      </label>
                      <input
                        type="text"
                        id="repoOwner"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="your-username"
                      />
                    </div>
                    
                    <div>
                      <label for="repoName" class="block text-sm font-medium text-slate-700 mb-2">
                        Repository Name
                      </label>
                      <input
                        type="text"
                        id="repoName"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="leetcode-solutions"
                      />
                    </div>
                    
                    <div>
                      <label for="repoBranch" class="block text-sm font-medium text-slate-700 mb-2">
                        Branch
                      </label>
                      <input
                        type="text"
                        id="repoBranch"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="main"
                        value="main"
                      />
                    </div>
                    
                    <div>
                      <label for="folderStructure" class="block text-sm font-medium text-slate-700 mb-2">
                        Folder Structure
                      </label>
                      <select
                        id="folderStructure"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="difficulty">By Difficulty</option>
                        <option value="topic">By Topic</option>
                        <option value="flat">Flat Structure</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="mt-4 space-y-3">
                    <label class="flex items-center">
                      <input type="checkbox" id="privateRepo" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                      <span class="ml-2 text-sm text-slate-700">Create private repository</span>
                    </label>
                    
                    <label class="flex items-center">
                      <input type="checkbox" id="includeDescription" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked>
                      <span class="ml-2 text-sm text-slate-700">Include problem description</span>
                    </label>
                    
                    <label class="flex items-center">
                      <input type="checkbox" id="includeTestCases" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked>
                      <span class="ml-2 text-sm text-slate-700">Include test cases</span>
                    </label>
                  </div>
                </div>

                <!-- Save Button -->
                <div class="flex justify-end space-x-3">
                  <button id="saveBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Save Settings
                  </button>
                </div>
                
                <!-- Status Messages -->
                <div id="statusMessage" class="hidden"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    document.getElementById('verifyBtn').addEventListener('click', verifyToken);
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
  }

  function loadSettings() {
    if (chrome && chrome.storage) {
      chrome.storage.sync.get(['github_auth', 'repo_config'], (result) => {
        if (result.github_auth) {
          auth = result.github_auth;
          document.getElementById('githubToken').value = auth.token || '';
          updateAuthStatus();
        }
        
        if (result.repo_config) {
          config = result.repo_config;
          document.getElementById('repoOwner').value = config.owner || '';
          document.getElementById('repoName').value = config.repo || '';
          document.getElementById('repoBranch').value = config.branch || 'main';
          document.getElementById('folderStructure').value = config.folderStructure || 'difficulty';
          document.getElementById('privateRepo').checked = config.private || false;
          document.getElementById('includeDescription').checked = config.includeDescription !== false;
          document.getElementById('includeTestCases').checked = config.includeTestCases !== false;
        }
      });
    }
  }

  function verifyToken() {
    const token = document.getElementById('githubToken').value.trim();
    
    if (!token) {
      showStatus('Please enter a GitHub token', false);
      return;
    }

    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;

    fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.login) {
        auth = {
          token: token,
          username: data.login,
          email: data.email,
          connected: true
        };
        
        chrome.storage.sync.set({ github_auth: auth }, () => {
          updateAuthStatus();
          showStatus(`Successfully connected as ${data.login}`, true);
        });
      } else {
        showStatus('Invalid token or insufficient permissions', false);
      }
    })
    .catch(error => {
      showStatus('Failed to verify token: ' + error.message, false);
    })
    .finally(() => {
      verifyBtn.textContent = 'Verify Token';
      verifyBtn.disabled = false;
    });
  }

  function saveSettings() {
    const newConfig = {
      owner: document.getElementById('repoOwner').value.trim(),
      repo: document.getElementById('repoName').value.trim(),
      branch: document.getElementById('repoBranch').value.trim() || 'main',
      folderStructure: document.getElementById('folderStructure').value,
      private: document.getElementById('privateRepo').checked,
      includeDescription: document.getElementById('includeDescription').checked,
      includeTestCases: document.getElementById('includeTestCases').checked
    };

    if (!newConfig.owner || !newConfig.repo) {
      showStatus('Please fill in repository owner and name', false);
      return;
    }

    chrome.storage.sync.set({ repo_config: newConfig }, () => {
      config = newConfig;
      showStatus('Settings saved successfully', true);
    });
  }

  function updateAuthStatus() {
    const statusDiv = document.getElementById('authStatus');
    
    if (auth.connected) {
      statusDiv.innerHTML = `
        <div class="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-green-800">Connected as <strong>${auth.username}</strong></span>
        </div>
      `;
    } else {
      statusDiv.innerHTML = `
        <div class="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="text-red-800">Not connected to GitHub</span>
        </div>
      `;
    }
  }

  function showStatus(message, success) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = `p-3 rounded-lg text-sm ${success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 5000);
  }
})();