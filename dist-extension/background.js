// Leet2Git Background Script - Tab-aware Capture
console.log("Leet2Git background script loaded");

// Tab-specific tracking
const tabData = new Map(); // tabId -> { slug: string, metadata: object, submissionCode: string }
const submissionToTab = new Map(); // submissionId -> tabId

// Question metadata cache and temporary code storage
const questionCache = new Map();
const tempCodeStorage = new Map(); // question_id -> { code, lang, question_id, timestamp }
const recentSubmissions = new Map(); // slug+lang -> timestamp for deduplication

// Helper functions for question metadata
function parseQuestionMeta(res) {
  try {
    const q = res?.data?.question;
    if (!q?.titleSlug) return null;
    return {
      slug: q.titleSlug,
      title: q.title ?? q.titleSlug.replace(/-/g, " "),
      difficulty: q.difficulty ?? "Easy",
      tag: (Array.isArray(q.topicTags) && q.topicTags[0]?.name) || "Uncategorized"
    };
  } catch {
    return null;
  }
}

function cacheQuestionMeta(meta) {
  questionCache.set(meta.slug, meta);
  console.info(`[Leet2Git] Question meta cached: ${meta.slug}`);
}

function getQuestionMeta(slug) {
  return questionCache.get(slug) || null;
}

function toPascalCase(str) {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

// A. Capture typed_code + lang from submit requests
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
  },
  { urls: ['*://leetcode.com/problems/*/submit/'] },
  ['requestBody']
);

// Track tab navigation to LeetCode problems
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url && tab.url.includes('leetcode.com/problems/')) {
    const match = tab.url.match(/\/problems\/([^\/]+)/);
    if (match) {
      const slug = match[1];
      tabData.set(tabId, { 
        slug, 
        metadata: getQuestionMeta(slug),
        submissionCode: null 
      });
      console.info(`[Leet2Git] Tab ${tabId} navigated to problem: ${slug}`);
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
  console.info(`[Leet2Git] Cleaned up data for closed tab ${tabId}`);
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// B. GraphQL data is now handled in the main message handler below

// This handler was moved to the earlier onBeforeRequest listener

// C. Build SolutionPayload in the submission-check handler
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200 || !details.tabId) return;
  
  // Extract submission ID from check URL
  const urlMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.log(`[Leet2Git] Intercepted submission check: ${submissionId}`);
  
  try {
    // Fetch the check response
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    
    // Only process accepted submissions
    if (data.status_msg !== "Accepted") {
      console.log(`[Leet2Git] Submission not accepted: ${data.status_msg}`);
      return;
    }
    
    // 1. Fetch the temp code record via question_id
    const questionId = data.question_id || data.id;
    const codeRecord = tempCodeStorage.get(questionId);
    
    if (!codeRecord) {
      console.warn(`[Leet2Git] No code record found for question ${questionId}`);
      return;
    }
    
    // 2. Get problem slug from current tab or extract from submission data
    const tabInfo = tabData.get(details.tabId);
    const problemSlug = tabInfo?.slug || extractSlugFromData(data);
    
    if (!problemSlug) {
      console.warn(`[Leet2Git] Could not determine problem slug`);
      return;
    }
    
    // 3. Merge with meta cache via titleSlug
    const metadata = getQuestionMeta(problemSlug);
    
    // 4. Build comprehensive solution payload
    const solutionPayload = {
      id: `${problemSlug}-${Date.now()}`,
      submissionId: submissionId,
      title: metadata?.title || toPascalCase(problemSlug),
      slug: problemSlug,
      difficulty: metadata?.difficulty || "Easy", // Default to Easy as per requirements
      tag: metadata?.tag || "Uncategorized",
      code: codeRecord.code,
      lang: codeRecord.lang,
      runtime: data.display_runtime || "N/A",
      memory: data.status_memory || "N/A",
      timestamp: Date.now()
    };
    
    // 5. Remove the temp code record after use
    tempCodeStorage.delete(questionId);
    
    // D. Deduplicate stats but keep multi-language files
    const storageResult = await chrome.storage.sync.get(['pending', 'solvedSlugs']);
    const pending = storageResult.pending || [];
    const solvedSlugs = new Set(storageResult.solvedSlugs || []);
    
    // Check for recent duplicate (same slug & language within 5 min)
    const recentKey = `${problemSlug}-${codeRecord.lang}`;
    const now = Date.now();
    const recentTimestamp = recentSubmissions.get(recentKey);
    
    if (recentTimestamp && (now - recentTimestamp) < 300000) { // 5 minutes
      console.log(`[Leet2Git] Ignoring duplicate submission within 5 minutes`);
      return;
    }
    
    // Always allow into pending (different languages welcome)
    pending.push(solutionPayload);
    recentSubmissions.set(recentKey, now);
    
    // Increment stats only if slug not in solved set
    if (!solvedSlugs.has(problemSlug)) {
      solvedSlugs.add(problemSlug);
      await updateStats(solutionPayload);
      console.log(`[Leet2Git] Updated stats for new problem: ${problemSlug}`);
    } else {
      console.log(`[Leet2Git] Problem already solved, stats unchanged: ${problemSlug}`);
    }
    
    // Save updated data
    await chrome.storage.sync.set({ 
      pending,
      solvedSlugs: Array.from(solvedSlugs)
    });
    
    await updateBadge();
    
    console.log(`[Leet2Git] Successfully captured: ${solutionPayload.title} (${codeRecord.lang})`);
    
  } catch (error) {
    console.error(`[Leet2Git] Error processing submission:`, error);
  }
}, {
  urls: ["https://leetcode.com/submissions/detail/*/check/"]
});

// Helper function to extract slug from submission data
function extractSlugFromData(data) {
  // Try to extract from various possible fields in the response
  return data.titleSlug || data.question_slug || null;
}

// Get stored submission code
async function getStoredSubmissionCode(submissionId) {
  const tabId = submissionToTab.get(submissionId);
  if (tabId) {
    const tabInfo = tabData.get(tabId);
    return tabInfo?.submissionCode || null;
  }
  return null;
}

// Update badge
async function updateBadge() {
  try {
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const count = pending.length;
    
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.error("Error updating badge:", error);
  }
}

// Update statistics - only call for actual accepted submissions
async function updateStats(solution) {
  try {
    if (!solution.submissionId || !solution.title) {
      console.warn(`[Leet2Git] Skipping stats update for incomplete solution`);
      return;
    }

    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = 
          await chrome.storage.sync.get("stats");
    
    // Check if this solution was already counted (prevent duplicates)
    const alreadyCounted = stats.recentSolves.some(solve => 
      solve.submissionId === solution.submissionId ||
      (solve.title === solution.title && 
       solve.language === solution.lang &&
       Math.abs(solve.timestamp - solution.timestamp) < 30000)
    );
    
    if (alreadyCounted) {
      console.info(`[Leet2Git] Solution already counted in stats: ${solution.title}`);
      return;
    }
    
    // Update difficulty counts
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
      console.info(`[Leet2Git] Updated ${difficulty} count to ${stats.counts[difficulty]}`);
    }
    
    // Add to recent solves with submission ID for tracking
    stats.recentSolves.unshift({
      submissionId: solution.submissionId,
      title: solution.title,
      language: solution.lang,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    // Keep only 10 recent solves
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.sync.set({ stats });
    console.info(`[Leet2Git] Stats updated for ${solution.title}`);
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "graphql_question_data":
      const meta = {
        slug: message.data.slug,
        title: message.data.title,
        difficulty: message.data.difficulty,
        tag: message.data.tag
      };
      
      // Cache the metadata
      cacheQuestionMeta(meta);
      
      // Update tab data if this tab is tracking this problem
      if (sender.tab?.id) {
        const tabInfo = tabData.get(sender.tab.id);
        if (tabInfo && tabInfo.slug === meta.slug) {
          tabInfo.metadata = meta;
          console.log(`[Leet2Git] Updated metadata for tab ${sender.tab.id}: ${meta.title}`);
        }
      }
      
      sendResponse({ success: true });
      break;
    case "auth":
      handleAuth(sendResponse);
      break;
    case "push":
      handlePush(sendResponse);
      break;
    case "getHomeData":
      handleGetHomeData(sendResponse);
      break;
    case "solved_dom":
      handleSolvedFromDOM(message.payload, sendResponse);
      break;
    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
  return true; // Keep message channel open for async response
});

async function handleAuth(sendResponse) {
  try {
    const data = await chrome.storage.sync.get(['github_token', 'github_user', 'auth']);
    
    let authData = null;
    if (data.github_token && data.github_user) {
      authData = {
        token: data.github_token,
        username: data.github_user.username,
        email: data.github_user.email,
        connected: data.github_user.connected
      };
    } else if (data.auth) {
      authData = data.auth;
    }
    
    sendResponse({ 
      success: true, 
      auth: authData 
    });
  } catch (error) {
    console.error("Error handling auth:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePush(sendResponse) {
  try {
    const storageData = await chrome.storage.sync.get([
      'pending', 'github_token', 'github_user', 'auth', 
      'repo_config', 'config', 'owner', 'repo', 'branch'
    ]);
    
    console.log("Storage data for push:", storageData);
    
    const pending = storageData.pending || [];
    if (pending.length === 0) {
      sendResponse({ success: false, error: "No pending solutions to push" });
      return;
    }

    // Get auth data
    let authData = null;
    if (storageData.github_token && storageData.github_user) {
      authData = {
        token: storageData.github_token,
        username: storageData.github_user.username,
        email: storageData.github_user.email,
        connected: storageData.github_user.connected
      };
    } else if (storageData.auth) {
      authData = storageData.auth;
    }

    if (!authData || !authData.token) {
      sendResponse({ success: false, error: "GitHub authentication required. Please configure in Options." });
      return;
    }

    // Get config data
    let config = storageData.repo_config || storageData.config || {};
    
    // Try individual keys if config object doesn't exist
    if (!config.owner || !config.repo) {
      config = {
        owner: storageData.owner || config.owner,
        repo: storageData.repo || config.repo,
        branch: storageData.branch || config.branch || 'main',
        folderStructure: config.folderStructure || 'difficulty',
        includeDescription: config.includeDescription !== false,
        includeTestCases: config.includeTestCases !== false,
        private: config.private || false
      };
    }

    if (!config.owner || !config.repo) {
      sendResponse({ success: false, error: "Repository configuration required. Please configure owner and repo in Options." });
      return;
    }

    console.log("Using config:", config);
    console.log("Using auth:", { ...authData, token: "[REDACTED]" });

    // Push all pending solutions
    const results = [];
    for (const solution of pending) {
      try {
        const result = await pushSolutionToGitHub(solution, authData, config);
        results.push(result);
      } catch (error) {
        console.error(`Error pushing ${solution.title}:`, error);
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    if (successCount > 0) {
      // Clear pending solutions
      await chrome.storage.sync.set({ pending: [] });
      await updateBadge();
    }

    if (failureCount === 0) {
      sendResponse({ success: true, message: `Successfully pushed ${successCount} solution(s)` });
    } else if (successCount === 0) {
      const firstError = results.find(r => !r.success)?.error || "Unknown error";
      sendResponse({ success: false, error: `Failed to push solutions: ${firstError}` });
    } else {
      sendResponse({ success: true, message: `Pushed ${successCount} solutions, ${failureCount} failed` });
    }

  } catch (error) {
    console.error("Error in handlePush:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetHomeData(sendResponse) {
  try {
    const data = await chrome.storage.sync.get([
      'stats', 'pending', 'github_token', 'github_user', 'auth',
      'repo_config', 'config', 'owner', 'repo'
    ]);
    
    const stats = data.stats || { 
      streak: 0, 
      counts: { easy: 0, medium: 0, hard: 0 }, 
      recentSolves: [] 
    };
    
    const pending = data.pending || [];
    
    let authData = null;
    if (data.github_token && data.github_user) {
      authData = {
        token: data.github_token,
        username: data.github_user.username,
        email: data.github_user.email,
        connected: data.github_user.connected
      };
    } else if (data.auth) {
      authData = data.auth;
    }
    
    let config = data.repo_config || data.config || {};
    if (!config.owner || !config.repo) {
      config = {
        owner: data.owner || config.owner,
        repo: data.repo || config.repo,
        branch: config.branch || 'main',
        folderStructure: config.folderStructure || 'difficulty',
        includeDescription: config.includeDescription !== false,
        includeTestCases: config.includeTestCases !== false,
        private: config.private || false
      };
    }
    
    const homeData = {
      stats,
      pending,
      auth: authData,
      config
    };
    
    sendResponse({ success: true, data: homeData });
  } catch (error) {
    console.error("Error getting home data:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSolvedFromDOM(payload, sendResponse) {
  try {
    console.info(`[Leet2Git] DOM capture received:`, payload);
    
    const pendingItem = {
      id: payload.submissionId || Date.now().toString(),
      title: payload.title,
      slug: payload.slug,
      language: payload.language,
      difficulty: payload.difficulty,
      code: payload.code,
      timestamp: Date.now(),
      description: payload.description,
      submissionId: payload.submissionId
    };
    
    // Add to pending
    const { pending = [] } = await chrome.storage.sync.get("pending");
    
    // Check for duplicates
    const isDuplicate = pending.some(item => 
      item.submissionId === pendingItem.submissionId ||
      (item.title === pendingItem.title && 
       item.language === pendingItem.language &&
       Math.abs(item.timestamp - pendingItem.timestamp) < 30000)
    );
    
    if (!isDuplicate) {
      pending.push(pendingItem);
      await chrome.storage.sync.set({ pending });
      await updateStats(pendingItem);
      await updateBadge();
      
      console.info(`[Leet2Git] DOM capture successful: ${pendingItem.title}`);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling DOM solve:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateConfig(config, sendResponse) {
  try {
    await chrome.storage.sync.set({ repo_config: config });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// GitHub integration functions
async function ensureRepositoryExists(token, config) {
  // Check if repository exists
  const repoUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  
  try {
    const response = await fetch(repoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      console.log(`Repository ${config.owner}/${config.repo} exists`);
      return; // Repository exists
    }
    
    if (response.status === 404) {
      // Repository doesn't exist, create it
      console.log(`Creating repository ${config.owner}/${config.repo}`);
      
      const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
  
  try {
    // First check if repository exists, create if it doesn't
    await ensureRepositoryExists(auth.token, config);
    
    const result = await upsertFile({
      token: auth.token,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch || 'main',
      path: `${filePath}/${fileName}`,
      content: content,
      message: `Add solution: ${solution.title}`
    });
    
    return result;
  } catch (error) {
    console.error(`GitHub push error for ${solution.title}:`, error);
    throw error;
  }
}

function generateFileName(solution) {
  const extension = getFileExtension(solution.lang);
  const cleanTitle = solution.title.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanTitle}.${extension}`;
}

function generateFilePath(solution, config) {
  switch (config.folderStructure) {
    case 'difficulty':
      return solution.difficulty;
    case 'topic':
      return solution.tag || 'Uncategorized';
    case 'flat':
    default:
      return '.';
  }
}

function generateFileContent(solution, config) {
  let content = '';
  
  // Always include basic description
  content += `/*\n * ${solution.title}\n * Difficulty: ${solution.difficulty}\n`;
  if (solution.tag && solution.tag !== 'Uncategorized') {
    content += ` * Topic: ${solution.tag}\n`;
  }
  content += ` * Runtime: ${solution.runtime || 'N/A'}\n`;
  content += ` * Memory: ${solution.memory || 'N/A'}\n`;
  content += ` */\n\n`;
  
  content += solution.code;
  
  return content;
}

function getFileExtension(language) {
  const extensions = {
    'JavaScript': 'js',
    'Python': 'py',
    'Python3': 'py',
    'Java': 'java',
    'C++': 'cpp',
    'C': 'c',
    'C#': 'cs',
    'Ruby': 'rb',
    'Swift': 'swift',
    'Go': 'go',
    'Scala': 'scala',
    'Kotlin': 'kt',
    'Rust': 'rs',
    'PHP': 'php',
    'TypeScript': 'ts'
  };
  return extensions[language] || 'txt';
}

async function upsertFile({ token, owner, repo, branch, path, content, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  // First, try to get the existing file
  let sha = null;
  try {
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (getResponse.ok) {
      const existingFile = await getResponse.json();
      sha = existingFile.sha;
    }
  } catch (error) {
    // File doesn't exist, which is fine
  }
  
  // Create or update the file
  const body = {
    message: message || `Update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: branch
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
  }
  
  return { success: true };
}