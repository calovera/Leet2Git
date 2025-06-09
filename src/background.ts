// Leet2Git Background Script - Comprehensive Implementation
console.log("Leet2Git background script loaded");

import { ChromeMessage, SolutionPayload, PendingItem, HomeData, GitHubAuth, RepoCfg } from './types/models';

// Tab-specific tracking and storage
const tabData = new Map<number, any>();
const submissionToTab = new Map<string, number>();
const questionCache = new Map<string, any>();
const tempCodeStorage = new Map<string, any>();
const recentSubmissions = new Map<string, number>();

// Helper functions for question metadata
function parseQuestionMeta(res: any) {
  try {
    const q = res?.data?.question;
    if (!q?.titleSlug) return null;
    return {
      slug: q.titleSlug,
      title: q.title ?? q.titleSlug.replace(/-/g, " "),
      difficulty: q.difficulty ?? "Easy",
      tag: q.topicTags?.[0]?.name || q.categoryTitle || "Algorithms",
      categoryTitle: q.categoryTitle,
      topicTags: q.topicTags
    };
  } catch {
    return null;
  }
}

function cacheQuestionMeta(meta: any) {
  questionCache.set(meta.slug, meta);
  console.log(`[Leet2Git] Question meta cached: ${meta.slug}`);
}

function getQuestionMeta(slug: string) {
  return questionCache.get(slug) || null;
}

function toPascalCase(str: string) {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

// Update badge with pending count
async function updateBadge() {
  try {
    const result = await chrome.storage.sync.get('pending');
    const pending = result.pending || [];
    const text = pending.length > 0 ? pending.length.toString() : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
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
      console.log(`[Leet2Git] Tab ${tabId} navigated to problem: ${slug}`);
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
  console.log(`[Leet2Git] Cleaned up data for closed tab ${tabId}`);
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

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
    const solutionPayload: SolutionPayload = {
      id: `${problemSlug}-${Date.now()}`,
      submissionId: submissionId,
      title: metadata?.title || toPascalCase(problemSlug),
      slug: problemSlug,
      difficulty: metadata?.difficulty || "Easy",
      tag: metadata?.topicTags?.[0]?.name || metadata?.categoryTitle || "Algorithms",
      code: codeRecord.code,
      language: codeRecord.lang,
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
function extractSlugFromData(data: any) {
  return data.titleSlug || data.question_slug || null;
}

// Update stats function
async function updateStats(solution: SolutionPayload) {
  try {
    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = await chrome.storage.sync.get("stats");
    
    // Update difficulty counts
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
      console.log(`[Leet2Git] Updated ${difficulty} count to ${stats.counts[difficulty]}`);
    }
    
    // Add to recent solves
    stats.recentSolves.unshift({
      id: solution.id,
      title: solution.title,
      language: solution.language,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    // Keep only 10 recent solves
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.sync.set({ stats });
    console.log(`[Leet2Git] Stats updated for ${solution.title}`);
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  switch (message.type) {
    case "graphql_question_data":
      const meta = {
        slug: message.payload.slug,
        title: message.payload.title,
        difficulty: message.payload.difficulty,
        tag: message.payload.topicTags?.[0]?.name || message.payload.categoryTitle || "Algorithms",
        categoryTitle: message.payload.categoryTitle,
        topicTags: message.payload.topicTags
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

async function handleAuth(sendResponse: (response: any) => void) {
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

async function handlePush(sendResponse: (response: any) => void) {
  try {
    const storageData = await chrome.storage.sync.get([
      'pending', 'github_token', 'github_user', 'auth', 
      'repo_config', 'config', 'owner', 'repo', 'branch'
    ]);
    
    const pending = storageData.pending || [];
    if (pending.length === 0) {
      sendResponse({ success: false, error: "No pending solutions to push" });
      return;
    }

    // Get auth data
    let authData: GitHubAuth | null = null;
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
      sendResponse({ success: false, error: "GitHub authentication required" });
      return;
    }

    // Get config data
    let config: RepoCfg;
    if (storageData.config) {
      config = storageData.config;
    } else {
      config = {
        owner: storageData.owner || authData.username,
        repo: storageData.repo || 'leetcode-solutions',
        branch: storageData.branch || 'main',
        private: false,
        folderStructure: 'topic' as const,
        includeDescription: true,
        includeTestCases: false
      };
    }

    // Push all pending solutions
    const results = [];
    for (const solution of pending) {
      try {
        await pushSolutionToGitHub(solution, authData, config);
        results.push({ success: true, title: solution.title });
      } catch (error) {
        console.error(`Failed to push ${solution.title}:`, error);
        results.push({ success: false, title: solution.title, error: error.message });
      }
    }

    // Clear pending solutions
    await chrome.storage.sync.set({ pending: [] });
    await updateBadge();

    sendResponse({ 
      success: true, 
      results,
      message: `Pushed ${results.filter(r => r.success).length}/${results.length} solutions` 
    });
  } catch (error) {
    console.error("Error handling push:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetHomeData(sendResponse: (response: any) => void) {
  try {
    const storageData = await chrome.storage.sync.get(['stats', 'pending', 'auth', 'config']);
    
    const homeData: HomeData = {
      stats: storageData.stats || { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
      pending: storageData.pending || [],
      auth: storageData.auth || null,
      config: storageData.config || {
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

async function handleSolvedFromDOM(payload: any, sendResponse: (response: any) => void) {
  try {
    const pendingItem: PendingItem = {
      id: payload.id,
      title: payload.title,
      slug: payload.slug,
      language: payload.language,
      difficulty: payload.difficulty,
      code: payload.code,
      timestamp: payload.timestamp,
      description: payload.description,
      submissionId: payload.submissionId
    };
    
    // Check for duplicates
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const isDuplicate = pending.some((item: PendingItem) => 
      item.submissionId === pendingItem.submissionId || 
      (item.title === pendingItem.title && 
       item.language === pendingItem.language &&
       Math.abs(item.timestamp - pendingItem.timestamp) < 30000)
    );
    
    if (isDuplicate) {
      sendResponse({ success: false, error: "Duplicate solution detected" });
      return;
    }
    
    pending.push(pendingItem);
    await chrome.storage.sync.set({ pending });
    await updateBadge();
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling solved from DOM:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateConfig(config: any, sendResponse: (response: any) => void) {
  try {
    await chrome.storage.sync.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// GitHub integration functions
async function ensureRepositoryExists(token: string, config: RepoCfg) {
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
      return;
    }
    
    if (response.status === 404) {
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

async function pushSolutionToGitHub(solution: SolutionPayload, auth: GitHubAuth, config: RepoCfg) {
  const fileName = generateFileName(solution);
  const filePath = generateFilePath(solution, config);
  const content = generateFileContent(solution, config);
  
  console.log(`Pushing to GitHub: ${filePath}/${fileName}`);
  
  try {
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

function generateFileName(solution: SolutionPayload) {
  const extension = getFileExtension(solution.language);
  const cleanTitle = solution.title.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanTitle}.${extension}`;
}

function generateFilePath(solution: SolutionPayload, config: RepoCfg) {
  switch (config.folderStructure) {
    case 'difficulty':
      return solution.difficulty;
    case 'topic':
      // Use the first topicTag name, fallback to categoryTitle, then 'Algorithms'
      return solution.tag || 'Algorithms';
    case 'flat':
    default:
      return '.';
  }
}

function generateFileContent(solution: SolutionPayload, config: RepoCfg) {
  let content = '';
  
  // Always include basic description
  content += `/*\n * ${solution.title}\n * Difficulty: ${solution.difficulty}\n`;
  if (solution.tag && solution.tag !== 'Algorithms') {
    content += ` * Topic: ${solution.tag}\n`;
  }
  content += ` * Runtime: ${solution.runtime || 'N/A'}\n`;
  content += ` * Memory: ${solution.memory || 'N/A'}\n`;
  content += ` */\n\n`;
  
  content += solution.code;
  
  return content;
}

function getFileExtension(language: string) {
  const extensions: Record<string, string> = {
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
  return extensions[normalizedLang] || 'py';
}

async function upsertFile({ token, owner, repo, branch, path, content, message }: any) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
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
  
  const body: any = {
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