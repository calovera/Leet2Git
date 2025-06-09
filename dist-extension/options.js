// Leet2Git Options Page - Fixed Version
(function() {
  let config = {};
  let auth = {};

  document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSettings();
    updateAuthStatus();
  });

  function setupEventListeners() {
    const verifyBtn = document.getElementById('verifyBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    if (verifyBtn) {
      verifyBtn.addEventListener('click', verifyToken);
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', saveSettings);
    }
  }

  function loadSettings() {
    if (chrome && chrome.storage) {
      chrome.storage.sync.get(['github_auth', 'auth', 'github_token', 'github_user', 'repo_config', 'config', 'owner', 'repo', 'branch'], (result) => {
        // Load auth data from any available format
        if (result.github_auth) {
          auth = result.github_auth;
        } else if (result.auth) {
          auth = result.auth;
        } else if (result.github_token && result.github_user) {
          auth = {
            token: result.github_token,
            username: result.github_user.username,
            email: result.github_user.email,
            connected: result.github_user.connected
          };
        }
        
        const tokenInput = document.getElementById('githubToken');
        if (tokenInput && auth.token) {
          tokenInput.value = auth.token;
        }
        updateAuthStatus();
        
        // Load config data from any available format
        if (result.repo_config) {
          config = result.repo_config;
        } else if (result.config) {
          config = result.config;
        } else if (result.owner || result.repo) {
          config = {
            owner: result.owner || '',
            repo: result.repo || '',
            branch: result.branch || 'main',
            folderStructure: 'difficulty',
            private: false,
            includeDescription: true,
            includeTestCases: true
          };
        }
        
        const repoOwner = document.getElementById('repoOwner');
        const repoName = document.getElementById('repoName');
        const repoBranch = document.getElementById('repoBranch');
        const folderStructure = document.getElementById('folderStructure');
        const privateRepo = document.getElementById('privateRepo');
        
        if (repoOwner) repoOwner.value = config.owner || '';
        if (repoName) repoName.value = config.repo || '';
        if (repoBranch) repoBranch.value = config.branch || 'main';
        if (folderStructure) folderStructure.value = config.folderStructure || 'difficulty';
        if (privateRepo) privateRepo.checked = config.private || false;
      });
    }
  }

  function verifyToken() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput ? tokenInput.value.trim() : '';
    
    if (!token) {
      showStatus('Please enter a GitHub token', false);
      return;
    }

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
      verifyBtn.textContent = 'Verifying...';
      verifyBtn.disabled = true;
      verifyBtn.style.background = '#94a3b8';
    }

    fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
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
        
        // Store in multiple formats for compatibility
        chrome.storage.sync.set({ 
          github_auth: auth,
          auth: auth,
          github_token: token,
          github_user: {
            username: data.login,
            email: data.email,
            connected: true
          }
        }, () => {
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
      if (verifyBtn) {
        verifyBtn.textContent = 'Verify Token';
        verifyBtn.disabled = false;
        verifyBtn.style.background = '#4f46e5';
      }
    });
  }

  function saveSettings() {
    const repoOwner = document.getElementById('repoOwner');
    const repoName = document.getElementById('repoName');
    const repoBranch = document.getElementById('repoBranch');
    const folderStructure = document.getElementById('folderStructure');
    const privateRepo = document.getElementById('privateRepo');

    const newConfig = {
      owner: repoOwner ? repoOwner.value.trim() : '',
      repo: repoName ? repoName.value.trim() : '',
      branch: repoBranch ? repoBranch.value.trim() || 'main' : 'main',
      folderStructure: folderStructure ? folderStructure.value : 'difficulty',
      private: privateRepo ? privateRepo.checked : false
    };

    if (!newConfig.owner || !newConfig.repo) {
      showStatus('Please fill in repository owner and name', false);
      return;
    }

    // Store in multiple formats for compatibility
    chrome.storage.sync.set({ 
      repo_config: newConfig,
      config: newConfig,
      owner: newConfig.owner,
      repo: newConfig.repo,
      branch: newConfig.branch
    }, () => {
      config = newConfig;
      showStatus('Settings saved successfully', true);
    });
  }

  function updateAuthStatus() {
    const statusDiv = document.getElementById('authStatus');
    if (!statusDiv) return;
    
    if (auth.connected) {
      statusDiv.innerHTML = `
        <div class="status-message status-success">
          <svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Connected as <strong>${auth.username}</strong></span>
        </div>
      `;
    } else {
      statusDiv.innerHTML = `
        <div class="status-message status-error">
          <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>Not connected to GitHub</span>
        </div>
      `;
    }
  }

  function showStatus(message, success) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) return;
    
    statusDiv.style.display = 'block';
    statusDiv.className = `alert status-message ${success ? 'status-success' : 'status-error'}`;
    statusDiv.textContent = message;
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
})();