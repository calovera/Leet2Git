// Leet2Git Background Script - API-based Capture
console.log("Leet2Git background script loaded");

let lastNetworkCapture = 0;
let lastDOMCapture = 0;

// Question metadata cache
const questionCache = new Map();

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

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// GraphQL listener for question metadata
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.method !== "POST" || !details.url.startsWith("https://leetcode.com/graphql")) return;
  if (details.statusCode !== 200) return;

  try {
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    const meta = parseQuestionMeta(data);
    if (meta) {
      cacheQuestionMeta(meta);
    }
  } catch (error) {
    console.error(`[Leet2Git] GraphQL parsing error:`, error);
  }
}, {
  urls: ["https://leetcode.com/graphql*"]
});

// Primary capture method: Intercept LeetCode submission check calls
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200) return;
  
  // Extract submission ID from check URL
  const urlMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.info(`[Leet2Git] Intercepted submission check: ${submissionId}`);
  
  try {
    // Fetch the check response
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Leet2Git] Failed to fetch check response: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.info(`[Leet2Git] Check response:`, data);
    
    // Only process accepted submissions
    if (data.status_msg !== "Accepted") {
      console.info(`[Leet2Git] Submission not accepted: ${data.status_msg}`);
      return;
    }
    
    // Extract problem slug from the submission URL itself
    const submissionMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
    if (!submissionMatch) return;
    
    // We need to get the problem slug from a LeetCode tab, not any active tab
    const tabs = await chrome.tabs.query({ url: "https://leetcode.com/problems/*" });
    let problemSlug = null;
    
    if (tabs.length > 0) {
      // Find a LeetCode problem tab
      for (const tab of tabs) {
        const urlParts = tab.url.match(/\/problems\/([^\/]+)/);
        if (urlParts) {
          problemSlug = urlParts[1];
          break;
        }
      }
    }
    
    if (!problemSlug) {
      console.warn(`[Leet2Git] No LeetCode problem tab found for submission ${submissionId}`);
      return;
    }
    const problemTitle = problemSlug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Get the submitted code from submit request (we need to store it temporarily)
    const storedCode = await getStoredSubmissionCode(submissionId);
    
    // Build initial solution payload
    const solutionPayload = {
      submissionId: submissionId,
      slug: toPascalCase(problemSlug),
      title: problemTitle,
      tag: "Uncategorized", // We don't have tags from this endpoint
      lang: data.pretty_lang || data.lang,
      difficulty: "Medium", // Default since we don't have difficulty here
      code: storedCode || "// Code not captured",
      runtime: data.display_runtime + " ms",
      memory: data.status_memory,
      capturedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // Replace fields with cached metadata if available
    const meta = getQuestionMeta(problemSlug);
    if (meta) {
      solutionPayload.title = meta.title;
      solutionPayload.difficulty = meta.difficulty;
      solutionPayload.tag = meta.tag;
      console.info(`[Leet2Git] Enhanced with cached metadata: ${meta.title}`);
    }
    
    console.info(`[Leet2Git] Network capture successful:`, solutionPayload);
    
    // Check for duplicates - check both submissionId and recent submissions with same title
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const isDuplicate = pending.some(item => 
      item.submissionId === submissionId || 
      (item.title === solutionPayload.title && 
       item.lang === solutionPayload.lang &&
       Math.abs(item.timestamp - solutionPayload.timestamp) < 30000) // Within 30 seconds
    );
    
    if (isDuplicate) {
      console.info(`[Leet2Git] Duplicate submission ${submissionId}, skipping`);
      return;
    }
    
    // Add to pending solutions
    pending.push(solutionPayload);
    await chrome.storage.sync.set({ pending });
    
    // Update stats
    await updateStats(solutionPayload);
    
    // Update badge
    await updateBadge();
    
    // Mark successful network capture
    lastNetworkCapture = Date.now();
    
    console.info(`[Leet2Git] Successfully captured submission ${submissionId}`);
    
  } catch (error) {
    console.error(`[Leet2Git] Error processing submission ${submissionId}:`, error);
  }
}, {
  urls: ["https://leetcode.com/submissions/detail/*/check/"]
});

// Capture submit requests to store code temporarily
chrome.webRequest.onBeforeRequest.addListener(async (details) => {
  if (details.method !== "POST") return;
  
  try {
    const requestBody = JSON.parse(new TextDecoder().decode(details.requestBody?.raw?.[0]?.bytes));
    if (requestBody?.typed_code && requestBody?.question_id) {
      // Store the code temporarily - we'll match it with the submission ID later
      await chrome.storage.local.set({
        [`temp_code_${requestBody.question_id}`]: {
          code: requestBody.typed_code,
          lang: requestBody.lang,
          timestamp: Date.now()
        }
      });
      console.info(`[Leet2Git] Stored code for question ${requestBody.question_id}`);
    }
  } catch (error) {
    console.error(`[Leet2Git] Error storing submit code:`, error);
  }
}, {
  urls: ["https://leetcode.com/problems/*/submit/"]
}, ["requestBody"]);

// Helper to get stored submission code
async function getStoredSubmissionCode(submissionId) {
  try {
    // We need to match by question - get all temp codes and find the most recent one
    const allStorage = await chrome.storage.local.get();
    const tempCodes = Object.entries(allStorage)
      .filter(([key]) => key.startsWith('temp_code_'))
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (tempCodes.length > 0) {
      const mostRecent = tempCodes[0];
      // Clean up old codes (keep only last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const keysToRemove = tempCodes
        .filter(code => code.timestamp < fiveMinutesAgo)
        .map(code => code.key);
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
      
      return mostRecent.code;
    }
  } catch (error) {
    console.error(`[Leet2Git] Error getting stored code:`, error);
  }
  return null;
}

// Helper function to convert kebab-case to PascalCase
function toPascalCase(str) {
  if (!str) return "";
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Update extension badge
async function updateBadge() {
  try {
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const text = pending.length > 0 ? pending.length.toString() : "";
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: "#4f46e5" });
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
    case "getHomeData":
      handleGetHomeData(sendResponse);
      return true;
    case "push":
      handlePush(sendResponse);
      return true;
    default:
      sendResponse({ error: "Unknown message type" });
  }
});



// Get home data for popup
async function handleGetHomeData(sendResponse) {
  try {
    const [statsResult, pendingResult, authResult, configResult] = await Promise.all([
      chrome.storage.sync.get("stats"),
      chrome.storage.sync.get("pending"), 
      chrome.storage.sync.get("github_auth"),
      chrome.storage.sync.get("repo_config")
    ]);

    const data = {
      stats: statsResult.stats || { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
      pending: pendingResult.pending || [],
      auth: authResult.github_auth || { connected: false },
      config: configResult.repo_config || {}
    };

    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Handle push to GitHub
async function handlePush(sendResponse) {
  try {
    // Get all storage data to debug
    const allData = await chrome.storage.sync.get();
    console.info(`[Leet2Git] All storage data:`, allData);
    
    const { github_auth, auth, github_token, token } = allData;
    const githubAuth = github_auth || auth;
    const authToken = githubAuth?.token || github_token || token;
    
    if (!authToken) {
      console.error(`[Leet2Git] No GitHub token found in storage`);
      sendResponse({ error: "GitHub not connected. Please configure your GitHub token in Options." });
      return;
    }

    const { repo_config, config, owner, repo } = allData;
    const repoConfig = repo_config || config;
    const repoOwner = repoConfig?.owner || owner;
    const repoName = repoConfig?.repo || repo;
    
    if (!repoOwner || !repoName) {
      console.error(`[Leet2Git] Repository not configured. Owner: ${repoOwner}, Repo: ${repoName}`);
      sendResponse({ error: "Repository not configured. Please set up your repository in Options." });
      return;
    }

    const { pending = [] } = allData;
    if (pending.length === 0) {
      sendResponse({ error: "No pending solutions" });
      return;
    }

    console.info(`[Leet2Git] Starting push of ${pending.length} solutions to GitHub`);
    
    const results = [];
    const errors = [];
    
    const authConfig = { token: authToken };
    const repoConfiguration = { 
      owner: repoOwner, 
      repo: repoName,
      folderStructure: repoConfig?.folderStructure || 'difficulty',
      includeDescription: repoConfig?.includeDescription !== false
    };
    
    for (const solution of pending) {
      try {
        const result = await pushSolutionToGitHub(solution, authConfig, repoConfiguration);
        if (result.success) {
          results.push(result);
        } else {
          errors.push({ solution: solution.title, error: result.error });
        }
      } catch (error) {
        errors.push({ solution: solution.title, error: error.message });
      }
    }
    
    if (results.length > 0) {
      // Clear successfully pushed solutions
      await chrome.storage.sync.set({ pending: [] });
      await updateBadge();
      
      console.info(`[Leet2Git] Successfully pushed ${results.length} solutions`);
      
      if (errors.length > 0) {
        sendResponse({ 
          success: true, 
          results,
          message: `Pushed ${results.length} solutions, ${errors.length} failed`,
          errors
        });
      } else {
        sendResponse({ 
          success: true, 
          results,
          message: `Successfully pushed ${results.length} solutions!`
        });
      }
    } else {
      sendResponse({ 
        error: `Failed to push solutions: ${errors.map(e => e.error).join(', ')}`
      });
    }
  } catch (error) {
    console.error(`[Leet2Git] Push error:`, error);
    sendResponse({ error: error.message });
  }
}

// Push individual solution to GitHub
async function pushSolutionToGitHub(solution, auth, config) {
  try {
    const fileName = generateFileName(solution);
    const filePath = generateFilePath(solution, config);
    const content = generateFileContent(solution, config);
    
    console.info(`[Leet2Git] Pushing ${solution.title} to ${filePath}`);
    
    // Check if file exists
    const checkUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${auth.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = null;
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }
    
    // Create or update file
    const createUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
    const createPayload = {
      message: `Add solution: ${solution.title}`,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
      ...(sha && { sha }) // Include SHA if updating existing file
    };
    
    const createResponse = await fetch(createUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${auth.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || createResponse.statusText}`);
    }
    
    const result = await createResponse.json();
    return {
      success: true,
      solution: solution.title,
      url: result.content.html_url,
      path: filePath
    };
    
  } catch (error) {
    console.error(`[Leet2Git] Error pushing ${solution.title}:`, error);
    return {
      success: false,
      solution: solution.title,
      error: error.message
    };
  }
}

// Generate file name based on solution
function generateFileName(solution) {
  const cleanTitle = solution.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const extension = getFileExtension(solution.lang);
  return `${cleanTitle}${extension}`;
}

// Generate file path based on configuration
function generateFilePath(solution, config) {
  const fileName = generateFileName(solution);
  const folderStructure = config.folderStructure || 'difficulty';
  
  switch (folderStructure) {
    case 'difficulty':
      return `${solution.difficulty}/${fileName}`;
    case 'topic':
      return `${solution.tag || 'Uncategorized'}/${fileName}`;
    case 'flat':
    default:
      return fileName;
  }
}

// Generate file content
function generateFileContent(solution, config) {
  let content = '';
  
  if (config.includeDescription !== false) {
    content += `/*\n`;
    content += `Problem: ${solution.title}\n`;
    content += `Difficulty: ${solution.difficulty}\n`;
    content += `Language: ${solution.lang}\n`;
    if (solution.tag) content += `Topic: ${solution.tag}\n`;
    if (solution.runtime) content += `Runtime: ${solution.runtime}\n`;
    if (solution.memory) content += `Memory: ${solution.memory}\n`;
    content += `Date: ${new Date(solution.timestamp).toLocaleDateString()}\n`;
    content += `*/\n\n`;
  }
  
  content += solution.code;
  
  return content;
}

// Get file extension based on language
function getFileExtension(language) {
  const langMap = {
    'javascript': '.js',
    'python': '.py',
    'python3': '.py',
    'java': '.java',
    'cpp': '.cpp',
    'c++': '.cpp',
    'c': '.c',
    'csharp': '.cs',
    'c#': '.cs',
    'go': '.go',
    'rust': '.rs',
    'ruby': '.rb',
    'swift': '.swift',
    'kotlin': '.kt',
    'typescript': '.ts',
    'php': '.php',
    'scala': '.scala'
  };
  
  return langMap[language?.toLowerCase()] || '.txt';
}