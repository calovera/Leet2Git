// Leet2Git Options Page - Production Ready
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
      <div style="min-height: 100vh; background: #f8fafc; padding: 48px 0;">
        <div style="max-width: 768px; margin: 0 auto; padding: 0 16px;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="padding: 32px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                </div>
                <div>
                  <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">Leet2Git Settings</h1>
                  <p style="color: #64748b; margin: 4px 0 0 0;">Configure your GitHub integration and sync preferences</p>
                </div>
              </div>

              <!-- GitHub Authentication -->
              <div style="margin-bottom: 32px;">
                <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 32px;">
                  <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Authentication
                  </h2>
                  
                  <div id="authStatus" style="margin-bottom: 16px;"></div>
                  
                  <div style="margin-bottom: 16px;">
                    <label for="githubToken" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      id="githubToken"
                      style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    />
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                      Create a token at 
                      <a href="https://github.com/settings/tokens" target="_blank" style="color: #4f46e5; text-decoration: none;">
                        GitHub Settings → Developer settings → Personal access tokens
                      </a>
                      with 'repo' permissions.
                    </p>
                  </div>
                  
                  <button id="verifyBtn" style="background: #4f46e5; color: white; border: none; padding: 12px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
                    Verify Token
                  </button>
                </div>
              </div>

              <!-- Repository Configuration -->
              <div style="margin-bottom: 32px;">
                <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 32px;">
                  <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Repository Settings
                  </h2>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                      <label for="repoOwner" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                        Repository Owner/Username
                      </label>
                      <input
                        type="text"
                        id="repoOwner"
                        style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                        placeholder="your-username"
                      />
                    </div>
                    
                    <div>
                      <label for="repoName" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                        Repository Name
                      </label>
                      <input
                        type="text"
                        id="repoName"
                        style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                        placeholder="leetcode-solutions"
                      />
                    </div>
                    
                    <div>
                      <label for="repoBranch" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                        Branch
                      </label>
                      <input
                        type="text"
                        id="repoBranch"
                        style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                        placeholder="main"
                        value="main"
                      />
                    </div>
                    
                    <div>
                      <label for="folderStructure" style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
                        Folder Structure
                      </label>
                      <select
                        id="folderStructure"
                        style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white;"
                      >
                        <option value="difficulty">By Difficulty</option>
                        <option value="topic">By Topic</option>
                        <option value="flat">Flat Structure</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="privateRepo" style="width: 16px; height: 16px;">
                      <span style="font-size: 14px; color: #374151;">Create private repository</span>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="includeDescription" style="width: 16px; height: 16px;" checked>
                      <span style="font-size: 14px; color: #374151;">Include problem description</span>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="includeTestCases" style="width: 16px; height: 16px;" checked>
                      <span style="font-size: 14px; color: #374151;">Include test cases</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button id="saveBtn" style="background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
                  Save Settings
                </button>
              </div>
              
              <!-- Status Messages -->
              <div id="statusMessage" style="margin-top: 16px; display: none;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

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
    verifyBtn.style.background = '#94a3b8';

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
      verifyBtn.style.background = '#4f46e5';
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
        <div style="display: flex; align-items: center; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
          <svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
          <span style="color: #166534;">Connected as <strong>${auth.username}</strong></span>
        </div>
      `;
    } else {
      statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span style="color: #991b1b;">Not connected to GitHub</span>
        </div>
      `;
    }
  }

  function showStatus(message, success) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.style.display = 'block';
    statusDiv.style.padding = '12px';
    statusDiv.style.borderRadius = '8px';
    statusDiv.style.fontSize = '14px';
    statusDiv.style.background = success ? '#f0fdf4' : '#fef2f2';
    statusDiv.style.color = success ? '#166534' : '#991b1b';
    statusDiv.style.border = `1px solid ${success ? '#bbf7d0' : '#fecaca'}`;
    statusDiv.textContent = message;
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
})();