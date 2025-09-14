console.log("Leet2Git background script loaded");

// Storage maps
const tabData = new Map<number, any>();
const questionMetaStorage = new Map<string, any>();
const tempCodeStorage = new Map<string, any>();
const recentSubmissions = new Map<string, number>();

// Helper functions

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

function toPascalCase(str) {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['pending', 'auth']);
    const pending = result.pending || [];
    const auth = result.auth;
    
    if (auth && auth.connected) {
      const text = pending.length > 0 ? pending.length.toString() : '';
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Request interceptors
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === 'POST' && details.requestBody && details.requestBody.raw) {
      try {
        const rawData = details.requestBody.raw[0].bytes;
        const decoder = new TextDecoder();
        const bodyText = decoder.decode(rawData);
        const submitData = JSON.parse(bodyText);
        
        if (submitData.typed_code && submitData.lang && submitData.question_id) {
          const codeRecord = {
            code: submitData.typed_code,
            lang: submitData.lang,
            question_id: submitData.question_id,
            timestamp: Date.now()
          };
          
          tempCodeStorage.set(submitData.question_id, codeRecord);
          console.log(`[Leet2Git] Code captured for question ${submitData.question_id}`);
        }
      } catch (error) {
        console.error('[Leet2Git] Failed to parse submit request:', error);
      }
    }
    return {};
  },
  { urls: ["*://leetcode.com/problems/*/submit/"] },
  ["requestBody"]
);

// Tab management
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url && tab.url.includes('leetcode.com/problems/')) {
    const match = tab.url.match(/\/problems\/([^\/]+)/);
    if (match) {
      const slug = match[1];
      tabData.set(tabId, {
        slug: slug,
        submissionCode: null
      });
      console.log(`[Leet2Git] Tab ${tabId} navigated to problem: ${slug}`);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
  console.log(`[Leet2Git] Cleaned up data for closed tab ${tabId}`);
});

// Runtime events
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Process accepted submissions - use a more reliable approach
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200 || !details.tabId) return;
  
  const urlMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.log(`[Leet2Git] Intercepted submission check: ${submissionId}`);
  
  // Wait for the page to update then check for acceptance
  setTimeout(async () => {
    try {
      // Check if we have recent code capture (within 5 minutes)
      let recentCodeRecord: any = null;
      let questionId: string | null = null;
      
      for (const [qId, record] of tempCodeStorage.entries()) {
        if (record && record.timestamp > Date.now() - 300000) { // Within last 5 minutes
          recentCodeRecord = record;
          questionId = qId;
          break;
        }
      }
      
      if (!recentCodeRecord) {
        console.log(`[Leet2Git] No recent code found for submission ${submissionId}`);
        return;
      }
      
      // Fetch the submission result directly to check status
      try {
        const response = await fetch(details.url, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const text = await response.text();
          
          // Parse the response to check if it's accepted
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            // If not JSON, check for acceptance in text
            if (text.includes('"status_msg":"Accepted"') || 
                (text.includes('Accepted') && !text.includes('Wrong Answer') && !text.includes('Time Limit Exceeded'))) {
              data = { status_msg: 'Accepted' };
            } else {
              console.log(`[Leet2Git] Submission ${submissionId} not accepted`);
              return;
            }
          }
          
          if (data && data.status_msg === 'Accepted') {
            console.log(`[Leet2Git] Submission ${submissionId} confirmed accepted`);
            await processAcceptedSubmission(submissionId, details.tabId, data);
          } else {
            console.log(`[Leet2Git] Submission ${submissionId} status: ${data?.status_msg || 'unknown'}`);
          }
        } else {
          console.log(`[Leet2Git] Could not fetch submission result: ${response.status}`);
        }
      } catch (fetchError) {
        console.log(`[Leet2Git] Fetch error, assuming accepted for recent code: ${fetchError.message}`);
        // If fetch fails but we have recent code, assume it might be accepted
        await processAcceptedSubmission(submissionId, details.tabId, null);
      }
    } catch (error) {
      console.error(`[Leet2Git] Error processing submission:`, error);
    }
  }, 3000); // Wait 3 seconds for submission to complete
}, { urls: ["https://leetcode.com/submissions/detail/*/check/"] });

async function processAcceptedSubmission(submissionId, tabId, data = null) {
  try {
    console.log(`[Leet2Git] Processing accepted submission: ${submissionId}`);
    
    // Find the associated code record
    let codeRecord: any = null;
    let questionId: string | null = null;
    
    // Try to find code by iterating through stored codes
    for (const [qId, record] of tempCodeStorage.entries()) {
      if (record.timestamp > Date.now() - 600000) { // Within last 10 minutes
        codeRecord = record;
        questionId = qId;
        break;
      }
    }
    
    if (!codeRecord) {
      console.warn(`[Leet2Git] No recent code record found for submission ${submissionId}`);
      return;
    }
    
    const tabInfo = tabData.get(tabId);
    if (!tabInfo || !tabInfo.slug) {
      console.warn(`[Leet2Git] No tab info found for submission ${submissionId}`);
      return;
    }
    
    // Default values - user will set these in the Push tab
    const defaultDifficulty = "Level"; // User must select
    const defaultFolder = "Problems"; // Default folder name
    
    const solutionPayload = {
      id: `${tabInfo.slug}-${Date.now()}`,
      submissionId: submissionId,
      title: toPascalCase(tabInfo.slug),
      slug: tabInfo.slug,
      difficulty: defaultDifficulty, // User will set this in Push tab
      folderPath: defaultFolder, // User will set this in Push tab
      code: codeRecord.code,
      language: codeRecord.lang,
      runtime: "N/A",
      memory: "N/A",
      timestamp: Date.now()
    };
    
    console.log(`[Leet2Git] Solution payload created for ${tabInfo.slug}`);
    
    if (questionId) tempCodeStorage.delete(questionId);
    
    const storageResult = await chrome.storage.local.get(['pending', 'solvedSlugs']);
    const pending = storageResult.pending || [];
    const solvedSlugs = new Set(storageResult.solvedSlugs || []);
    
    const recentKey = `${tabInfo.slug}-${codeRecord.lang}`;
    const now = Date.now();
    const recentTimestamp = recentSubmissions.get(recentKey);
    
    if (recentTimestamp && (now - recentTimestamp) < 300000) {
      console.log(`[Leet2Git] Ignoring duplicate submission within 5 minutes`);
      return;
    }
    
    pending.push(solutionPayload);
    recentSubmissions.set(recentKey, now);
    
    // Only update stats/streak for first time solving this problem (regardless of language)
    if (!solvedSlugs.has(tabInfo.slug)) {
      solvedSlugs.add(tabInfo.slug);
      await updateStats(solutionPayload);
      console.log(`[Leet2Git] Updated stats for new problem: ${tabInfo.slug}`);
    } else {
      console.log(`[Leet2Git] Problem already solved in different language, allowing upload but not updating stats: ${tabInfo.slug}`);
    }
    
    await chrome.storage.local.set({ 
      pending,
      solvedSlugs: Array.from(solvedSlugs)
    });
    
    await updateBadge();
    
    console.log(`[Leet2Git] Successfully captured: ${solutionPayload.title} (${codeRecord.lang})`);
    
  } catch (error) {
    console.error(`[Leet2Git] Error processing submission:`, error);
  }
}

async function updateStats(solution) {
  try {
    const { stats = {
      streak: 0,
      counts: { easy: 0, medium: 0, hard: 0 },
      recentSolves: [],
      lastSolveDate: null
    }} = await chrome.storage.local.get('stats');
    
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
      console.log(`[Leet2Git] Updated ${difficulty} count to ${stats.counts[difficulty]}`);
    }
    
    // Update streak logic
    const today = new Date().toDateString();
    const lastSolveDate = stats.lastSolveDate;
    
    if (!lastSolveDate) {
      // First solve ever
      stats.streak = 1;
      stats.lastSolveDate = today;
      console.log(`[Leet2Git] Started streak with first solve`);
    } else if (lastSolveDate === today) {
      // Already solved today, don't change streak
      console.log(`[Leet2Git] Already solved today, streak remains ${stats.streak}`);
    } else {
      const lastDate = new Date(lastSolveDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day, increment streak
        stats.streak++;
        stats.lastSolveDate = today;
        console.log(`[Leet2Git] Consecutive day! Streak increased to ${stats.streak}`);
      } else {
        // Streak broken, reset to 1
        stats.streak = 1;
        stats.lastSolveDate = today;
        console.log(`[Leet2Git] Streak broken (${daysDiff} days gap), reset to 1`);
      }
    }
    
    stats.recentSolves.unshift({
      id: solution.id,
      title: solution.title,
      language: solution.language,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.local.set({ stats });
    console.log(`[Leet2Git] Stats updated for ${solution.title}, streak: ${stats.streak}`);
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Message handlers
async function handleAuthVerification(token, sendResponse, isOAuthToken = false) {
  try {
    // Use different authorization header format based on token type
    const authHeader = isOAuthToken 
      ? `Bearer ${token}` 
      : `token ${token}`;
    
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      sendResponse({ success: false, error: 'Invalid GitHub token' });
      return;
    }

    const userData = await response.json();
    
    const authData = {
      token: token,
      username: userData.login,
      email: userData.email || '',
      connected: true,
      authType: isOAuthToken ? 'oauth' : 'pat' // Track auth type
    };

    await chrome.storage.local.set({ auth: authData });
    
    sendResponse({ 
      success: true, 
      username: userData.login,
      auth: authData 
    });
  } catch (error) {
    console.error("Error verifying GitHub token:", error);
    sendResponse({ success: false, error: 'Failed to verify token' });
  }
}

async function handleOAuthLogin(sendResponse) {
  console.log('[OAuth] Starting OAuth login flow');
  try {
    const CLIENT_ID = 'Ov23liPVnJxvGsF4Y9qm';
    const redirectUri = chrome.identity.getRedirectURL();
    console.log('[OAuth] Redirect URI:', redirectUri);
    
    // Generate CSRF state parameter for security
    const state = generateRandomString(32);
    
    // Store state temporarily for verification
    await chrome.storage.local.set({ oauth_state: state });
    
    console.log('OAuth redirect URI:', redirectUri);
    
    // Build GitHub OAuth authorization URL with state parameter
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'repo user:email');
    authUrl.searchParams.set('state', state);
    
    // Launch OAuth flow
    console.log('[OAuth] Launching web auth flow with URL:', authUrl.toString());
    chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    }, async (redirectUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[OAuth] Chrome runtime error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      
      if (!redirectUrl) {
        sendResponse({ success: false, error: 'No redirect URL received' });
        return;
      }
      
      try {
        // Extract authorization code and state from redirect URL
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        
        // Verify CSRF state parameter
        const { oauth_state } = await chrome.storage.local.get('oauth_state');
        await chrome.storage.local.remove('oauth_state'); // Clean up
        
        if (!returnedState || returnedState !== oauth_state) {
          console.error('OAuth state mismatch - possible CSRF attack');
          sendResponse({ success: false, error: 'Security verification failed' });
          return;
        }
        
        if (!code) {
          sendResponse({ success: false, error: 'No authorization code received' });
          return;
        }
        
        console.log('Got authorization code, exchanging for token...');
        
        // Exchange code for access token via our backend
        const tokenResponse = await fetch('http://localhost:5000/api/github/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok || tokenData.error) {
          console.error('Token exchange error:', tokenData);
          sendResponse({ success: false, error: tokenData.error || 'Failed to exchange code for token' });
          return;
        }
        
        // Store the OAuth token using the same auth structure
        const authData = {
          token: tokenData.access_token,
          username: tokenData.user.login,
          email: tokenData.user.email || '',
          connected: true,
          authType: 'oauth',
          userInfo: tokenData.user
        };
        
        await chrome.storage.local.set({ auth: authData });
        
        sendResponse({ 
          success: true, 
          username: tokenData.user.login,
          auth: authData 
        });
        
      } catch (error) {
        console.error('OAuth processing error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    
  } catch (error: any) {
    console.error('[OAuth] Login error:', error);
    sendResponse({ success: false, error: error?.message || 'OAuth initialization failed' });
  }
}

async function handleAuth(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['auth']);
    sendResponse({ 
      success: true, 
      auth: data.auth || null 
    });
  } catch (error) {
    console.error("Error handling auth:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetHomeData(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['stats', 'pending', 'auth', 'config']);
    
    const homeData = {
      stats: data.stats || {
        streak: 0,
        counts: { easy: 0, medium: 0, hard: 0 },
        recentSolves: []
      },
      pending: data.pending || [],
      auth: data.auth || null,
      config: data.config || {
        owner: '',
        repo: 'leetcode-solutions',
        branch: 'main',
        private: false,
        folderStructure: 'topic',
        includeDescription: true,
        includeTestCases: false
      }
    };
    
    sendResponse({ success: true, data: homeData });
  } catch (error) {
    console.error("Error getting home data:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateConfig(config, sendResponse) {
  try {
    await chrome.storage.local.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePush(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['pending', 'auth', 'config']);
    const pending = data.pending || [];
    
    if (pending.length === 0) {
      sendResponse({ success: false, error: 'No pending solutions to push' });
      return;
    }
    
    const auth = data.auth;
    if (!auth || !auth.token) {
      sendResponse({ success: false, error: 'GitHub authentication required' });
      return;
    }
    
    const config = data.config || {
      owner: auth.username,
      repo: 'leetcode-solutions',
      branch: 'main',
      private: false,
      folderStructure: 'topic',
      includeDescription: true,
      includeTestCases: false
    };
    
    await ensureRepositoryExists(auth.token, config, auth.authType);
    
    let successCount = 0;
    const results: Array<{ success: boolean; title: string; error?: string }> = [];
    
    for (const solution of pending) {
      try {
        await pushSolutionToGitHub(solution, auth, config);
        successCount++;
        results.push({ success: true, title: solution.title });
      } catch (error: any) {
        console.error(`Failed to push ${solution.title}:`, error);
        results.push({ success: false, title: solution.title, error: error.message });
      }
    }
    
    await chrome.storage.local.set({ pending: [] });
    await updateBadge();
    
    sendResponse({
      success: true,
      count: successCount,
      results: results,
      message: `Pushed ${successCount}/${pending.length} solutions`
    });
    
  } catch (error) {
    console.error("Error handling push:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// GitHub utilities
async function ensureRepositoryExists(token, config, authType = 'pat') {
  const repoUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  const authHeader = authType === 'oauth' ? `Bearer ${token}` : `token ${token}`;
  
  try {
    const response = await fetch(repoUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      console.log(`Repository ${config.owner}/${config.repo} exists`);
      return;
    }

    if (response.status === 404) {
      console.log(`Creating repository ${config.owner}/${config.repo}`);
      
      const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.repo,
          description: 'LeetCode solutions managed by Leet2Git extension',
          private: config.private || false,
          auto_init: true
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Failed to create repository: ${errorData.message}`);
      }

      console.log(`Repository ${config.owner}/${config.repo} created successfully`);
    } else {
      throw new Error(`Failed to check repository: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Repository check/creation error:', error);
    throw error;
  }
}

async function pushSolutionToGitHub(solution, auth, config) {
  const fileName = generateFileName(solution);
  const filePath = generateFilePath(solution, config);
  const content = generateFileContent(solution, config);
  
  console.log(`Pushing to GitHub: ${filePath}/${fileName}`);
  
  return await upsertFile({
    token: auth.token,
    owner: config.owner,
    repo: config.repo,
    branch: config.branch || 'main',
    path: `${filePath}/${fileName}`,
    content,
    message: `Add solution: ${solution.title}`,
    authType: auth.authType || 'pat'
  });
}

function generateFileName(solution) {
  const extension = getFileExtension(solution.language);
  return `${solution.title.replace(/[^a-zA-Z0-9]/g, '')}.${extension}`;
}

function generateFilePath(solution, config) {
  const folderPath = solution.folderPath || 'Problems';
  console.log(`[Leet2Git] Using user-selected folder path: ${folderPath}`);
  return folderPath;
}

function generateFileContent(solution, config) {
  let content = '';
  
  content += `/*
 * @lc app=leetcode id=${solution.submissionId} lang=${solution.language}
 *
 * ${solution.title}
 * 
 * Difficulty: ${solution.difficulty}
 * Category: ${solution.tag}
 * Runtime: ${solution.runtime}
 * Memory: ${solution.memory}
 */

`;
  
  content += solution.code;
  
  return content;
}

function getFileExtension(language) {
  const extensionMap = {
    'javascript': 'js',
    'python': 'py',
    'python3': 'py',
    'java': 'java',
    'c++': 'cpp',
    'cpp': 'cpp',
    'c': 'c',
    'c#': 'cs',
    'csharp': 'cs',
    'ruby': 'rb',
    'swift': 'swift',
    'go': 'go',
    'golang': 'go',
    'scala': 'scala',
    'kotlin': 'kt',
    'rust': 'rs',
    'php': 'php',
    'typescript': 'ts',
    'mysql': 'sql',
    'postgresql': 'sql'
  };
  
  const normalizedLang = (language || '').toLowerCase().trim();
  return extensionMap[normalizedLang] || 'py';
}

async function upsertFile({ token, owner, repo, branch, path, content, message, authType }) {
  const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  // Use correct authorization header format based on auth type
  const authHeader = authType === 'oauth' ? `Bearer ${token}` : `token ${token}`;
  
  let sha = null;
  try {
    const getResponse = await fetch(fileUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }
  } catch (error) {
    // File doesn't exist, that's okay
  }
  
  const updateData: any = {
    message: message || `Update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: branch
  };
  
  if (sha) {
    updateData.sha = sha;
  }
  
  const response = await fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
  }
  
  return { success: true };
}

// Main message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    case 'submission_accepted':
      processAcceptedSubmission(message.submissionId, message.tabId || sender.tab?.id);
      sendResponse({ success: true });
      break;
    case "auth":
      if (message.data && message.data.token) {
        handleAuthVerification(message.data.token, sendResponse);
      } else {
        handleAuth(sendResponse);
      }
      break;
    case "oauthLogin":
      console.log('[Background] Received oauthLogin message');
      handleOAuthLogin(sendResponse);
      break;
    case "push":
      handlePush(sendResponse);
      break;
    case "getHomeData":
      handleGetHomeData(sendResponse);
      break;
    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      break;
    case "updateBadge":
      updateBadge();
      sendResponse({ success: true });
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
  return true;
});