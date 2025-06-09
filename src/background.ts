console.log("Leet2Git background script loaded");

// Storage maps
const tabData = new Map();
const questionMetaStorage = new Map();
const tempCodeStorage = new Map();
const recentSubmissions = new Map();

// Helper functions
function cacheQuestionMeta(meta) {
  questionMetaStorage.set(meta.slug, meta);
  console.log(`[Leet2Git] Question meta cached: ${meta.slug}`);
}

function getQuestionMeta(slug) {
  return questionMetaStorage.get(slug) || null;
}

function toPascalCase(str) {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

async function updateBadge() {
  try {
    const result = await chrome.storage.sync.get(['pending', 'auth']);
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
        metadata: getQuestionMeta(slug),
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

// Process accepted submissions using responseReceived instead of completed to avoid CORS
chrome.webRequest.onResponseStarted.addListener(async (details) => {
  if (details.statusCode !== 200 || !details.tabId) return;
  
  const urlMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.log(`[Leet2Git] Intercepted submission check: ${submissionId}`);
  
  // Inject content script to get submission data instead of fetching directly
  try {
    await chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      func: async (submissionId) => {
        try {
          // Check for accepted status in DOM or make request from content context
          const response = await fetch(window.location.href);
          const text = await response.text();
          
          if (text.includes('"status_msg":"Accepted"') || text.includes('Accepted')) {
            // Extract data and send to background
            chrome.runtime.sendMessage({
              type: 'submission_accepted',
              submissionId: submissionId,
              tabId: details.tabId
            });
          }
        } catch (error) {
          console.error('Error in content script:', error);
        }
      },
      args: [submissionId]
    });
  } catch (error) {
    console.error(`[Leet2Git] Error injecting script:`, error);
    
    // Fallback: simulate accepted submission for captured code
    setTimeout(async () => {
      await processAcceptedSubmission(submissionId, details.tabId);
    }, 1000);
  }
}, { urls: ["https://leetcode.com/submissions/detail/*/check/"] });

async function processAcceptedSubmission(submissionId, tabId) {
  try {
    console.log(`[Leet2Git] Processing accepted submission: ${submissionId}`);
    
    // Find the associated code record
    let codeRecord = null;
    let questionId = null;
    
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
    
    const metadata = getQuestionMeta(tabInfo.slug);
    
    // Fix: Properly prioritize topicTags over categoryTitle
    let tag = "Algorithms"; // Default fallback
    if (metadata?.topicTags && Array.isArray(metadata.topicTags) && metadata.topicTags.length > 0) {
      tag = metadata.topicTags[0].name;
      console.log(`[Leet2Git] Using topicTag: ${tag}`);
    } else if (metadata?.categoryTitle) {
      tag = metadata.categoryTitle;
      console.log(`[Leet2Git] Using categoryTitle as fallback: ${tag}`);
    }
    
    const solutionPayload = {
      id: `${tabInfo.slug}-${Date.now()}`,
      submissionId: submissionId,
      title: metadata?.title || toPascalCase(tabInfo.slug),
      slug: tabInfo.slug,
      difficulty: metadata?.difficulty || "Easy",
      tag: tag,
      code: codeRecord.code,
      language: codeRecord.lang,
      runtime: "N/A", // Will be populated if available
      memory: "N/A",   // Will be populated if available
      timestamp: Date.now()
    };
    
    tempCodeStorage.delete(questionId);
    
    const storageResult = await chrome.storage.sync.get(['pending', 'solvedSlugs']);
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
    
    if (!solvedSlugs.has(tabInfo.slug)) {
      solvedSlugs.add(tabInfo.slug);
      await updateStats(solutionPayload);
      console.log(`[Leet2Git] Updated stats for new problem: ${tabInfo.slug}`);
    } else {
      console.log(`[Leet2Git] Problem already solved, stats unchanged: ${tabInfo.slug}`);
    }
    
    await chrome.storage.sync.set({ 
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
      recentSolves: []
    }} = await chrome.storage.sync.get('stats');
    
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
      console.log(`[Leet2Git] Updated ${difficulty} count to ${stats.counts[difficulty]}`);
    }
    
    stats.recentSolves.unshift({
      id: solution.id,
      title: solution.title,
      language: solution.language,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.sync.set({ stats });
    console.log(`[Leet2Git] Stats updated for ${solution.title}`);
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Message handlers
async function handleAuthVerification(token, sendResponse) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
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
      connected: true
    };

    await chrome.storage.sync.set({ auth: authData });
    
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

async function handleAuth(sendResponse) {
  try {
    const data = await chrome.storage.sync.get(['auth']);
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
    const data = await chrome.storage.sync.get(['stats', 'pending', 'auth', 'config']);
    
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
    await chrome.storage.sync.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePush(sendResponse) {
  try {
    const data = await chrome.storage.sync.get(['pending', 'auth', 'config']);
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
    
    await ensureRepositoryExists(auth.token, config);
    
    let successCount = 0;
    const results = [];
    
    for (const solution of pending) {
      try {
        await pushSolutionToGitHub(solution, auth, config);
        successCount++;
        results.push({ success: true, title: solution.title });
      } catch (error) {
        console.error(`Failed to push ${solution.title}:`, error);
        results.push({ success: false, title: solution.title, error: error.message });
      }
    }
    
    await chrome.storage.sync.set({ pending: [] });
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
async function ensureRepositoryExists(token, config) {
  const repoUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  
  try {
    const response = await fetch(repoUrl, {
      headers: {
        'Authorization': `token ${token}`,
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
          'Authorization': `token ${token}`,
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
    message: `Add solution: ${solution.title}`
  });
}

function generateFileName(solution) {
  const extension = getFileExtension(solution.language);
  return `${solution.title.replace(/[^a-zA-Z0-9]/g, '')}.${extension}`;
}

function generateFilePath(solution, config) {
  switch (config.folderStructure) {
    case 'difficulty':
      return solution.difficulty;
    case 'topic':
      return solution.tag || 'Algorithms';
    case 'flat':
    default:
      return '.';
  }
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

async function upsertFile({ token, owner, repo, branch, path, content, message }) {
  const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  let sha = null;
  try {
    const getResponse = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${token}`,
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
  
  const updateData = {
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
      'Authorization': `token ${token}`,
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
    case 'graphql_question_data':
      const questionMeta = {
        slug: message.data.slug,
        title: message.data.title,
        difficulty: message.data.difficulty,
        tag: (message.data.topicTags && Array.isArray(message.data.topicTags) && message.data.topicTags.length > 0) 
          ? message.data.topicTags[0].name 
          : (message.data.categoryTitle || "Algorithms"),
        categoryTitle: message.data.categoryTitle,
        topicTags: message.data.topicTags
      };
      
      cacheQuestionMeta(questionMeta);
      
      if (sender.tab?.id) {
        const tabInfo = tabData.get(sender.tab.id);
        if (tabInfo && tabInfo.slug === questionMeta.slug) {
          tabInfo.metadata = questionMeta;
          console.log(`[Leet2Git] Updated metadata for tab ${sender.tab.id}: ${questionMeta.title}`);
        }
      }
      
      sendResponse({ success: true });
      break;
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
    case "push":
      handlePush(sendResponse);
      break;
    case "getHomeData":
      handleGetHomeData(sendResponse);
      break;
    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
  return true;
});