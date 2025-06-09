console.log('Leet2Git background script loaded');

// Global storage for tab data and question metadata
const tabData = new Map();
const questionMetaStorage = new Map();
const tempCodeStorage = new Map();
const recentSubmissions = new Map();

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
      const badgeText = pending.length > 0 ? pending.length.toString() : '';
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Intercept LeetCode submission requests to capture code
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === 'POST' && details.requestBody && details.requestBody.raw) {
      try {
        const rawData = details.requestBody.raw[0].bytes;
        const textData = new TextDecoder().decode(rawData);
        const jsonData = JSON.parse(textData);

        if (jsonData.typed_code && jsonData.lang && jsonData.question_id) {
          const codeData = {
            code: jsonData.typed_code,
            lang: jsonData.lang,
            question_id: jsonData.question_id,
            timestamp: Date.now()
          };
          
          tempCodeStorage.set(jsonData.question_id, codeData);
          console.log(`[Leet2Git] Code captured for question ${jsonData.question_id}`);
        }
      } catch (error) {
        console.error('[Leet2Git] Failed to parse submit request:', error);
      }
    }
    return {};
  },
  { urls: ['*://leetcode.com/problems/*/submit/'] },
  ['requestBody']
);

// Track tab navigation to problem pages
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

// Clean up data when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
  console.log(`[Leet2Git] Cleaned up data for closed tab ${tabId}`);
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Leet2Git extension installed');
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Intercept submission check responses to detect accepted solutions
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200 || !details.tabId) return;

  const match = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!match) return;

  const submissionId = match[1];
  console.log(`[Leet2Git] Intercepted submission check: ${submissionId}`);

  try {
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return;

    const data = await response.json();
    if (data.status_msg !== 'Accepted') {
      console.log(`[Leet2Git] Submission not accepted: ${data.status_msg}`);
      return;
    }

    const questionId = data.question_id || data.id;
    const codeRecord = tempCodeStorage.get(questionId);
    
    if (!codeRecord) {
      console.warn(`[Leet2Git] No code record found for question ${questionId}`);
      return;
    }

    const tabInfo = tabData.get(details.tabId);
    const slug = tabInfo?.slug || extractSlugFromData(data);
    
    if (!slug) {
      console.warn('[Leet2Git] Could not determine problem slug');
      return;
    }

    const metadata = getQuestionMeta(slug);
    
    // Use first topicTag name, fallback to categoryTitle
    const topicTag = metadata?.topicTags?.[0]?.name || metadata?.categoryTitle || 'Algorithms';
    
    const solution = {
      id: `${slug}-${Date.now()}`,
      submissionId: submissionId,
      title: metadata?.title || toPascalCase(slug),
      slug: slug,
      difficulty: metadata?.difficulty || 'Easy',
      tag: topicTag,
      code: codeRecord.code,
      language: codeRecord.lang,
      runtime: data.display_runtime || 'N/A',
      memory: data.status_memory || 'N/A',
      timestamp: Date.now()
    };

    // Clean up the temporary code storage
    tempCodeStorage.delete(questionId);

    // Get current storage data
    const storageData = await chrome.storage.sync.get(['pending', 'solvedSlugs']);
    const pending = storageData.pending || [];
    const solvedSlugs = new Set(storageData.solvedSlugs || []);

    // Check for duplicate submissions within 5 minutes
    const duplicateKey = `${slug}-${codeRecord.lang}`;
    const now = Date.now();
    const lastSubmission = recentSubmissions.get(duplicateKey);
    
    if (lastSubmission && (now - lastSubmission) < 300000) { // 5 minutes
      console.log('[Leet2Git] Ignoring duplicate submission within 5 minutes');
      return;
    }

    // Add to pending solutions
    pending.push(solution);
    recentSubmissions.set(duplicateKey, now);

    // Update stats if this is a new problem
    if (!solvedSlugs.has(slug)) {
      solvedSlugs.add(slug);
      await updateStats(solution);
      console.log(`[Leet2Git] Updated stats for new problem: ${slug}`);
    } else {
      console.log(`[Leet2Git] Problem already solved, stats unchanged: ${slug}`);
    }

    // Save to storage
    await chrome.storage.sync.set({
      pending: pending,
      solvedSlugs: Array.from(solvedSlugs)
    });

    await updateBadge();
    console.log(`[Leet2Git] Successfully captured: ${solution.title} (${codeRecord.lang})`);

  } catch (error) {
    console.error('[Leet2Git] Error processing submission:', error);
  }
}, { urls: ['https://leetcode.com/submissions/detail/*/check/'] });

function extractSlugFromData(data) {
  return data.titleSlug || data.question_slug || null;
}

async function updateStats(solution) {
  try {
    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = 
      await chrome.storage.sync.get('stats');

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

    // Keep only latest 10 solves
    stats.recentSolves = stats.recentSolves.slice(0, 10);

    await chrome.storage.sync.set({ stats });
    console.log(`[Leet2Git] Stats updated for ${solution.title}`);
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

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
    sendResponse({ success: true, username: userData.login, auth: authData });
  } catch (error) {
    console.error('Error verifying GitHub token:', error);
    sendResponse({ success: false, error: 'Failed to verify token' });
  }
}

async function handleAuth(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['auth']);
    sendResponse({ success: true, auth: result.auth || null });
  } catch (error) {
    console.error('Error handling auth:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetHomeData(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['stats', 'pending', 'auth', 'config']);
    const homeData = {
      stats: result.stats || { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] },
      pending: result.pending || [],
      auth: result.auth || null,
      config: result.config || {
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
    console.error('Error getting home data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateConfig(config, sendResponse) {
  try {
    await chrome.storage.sync.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePush(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(['pending', 'auth', 'config']);
    const pending = result.pending || [];

    if (pending.length === 0) {
      sendResponse({ success: false, error: 'No pending solutions to push' });
      return;
    }

    const auth = result.auth;
    if (!auth || !auth.token) {
      sendResponse({ success: false, error: 'GitHub authentication required' });
      return;
    }

    const config = result.config || {
      owner: auth.username,
      repo: 'leetcode-solutions',
      branch: 'main',
      private: false,
      folderStructure: 'topic',
      includeDescription: true,
      includeTestCases: false
    };

    // Ensure repository exists
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

    // Clear pending solutions after successful push
    await chrome.storage.sync.set({ pending: [] });
    await updateBadge();

    sendResponse({
      success: true,
      count: successCount,
      results: results,
      message: `Pushed ${successCount}/${pending.length} solutions`
    });
  } catch (error) {
    console.error('Error handling push:', error);
    sendResponse({ success: false, error: error.message });
  }
}

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
    content: content,
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
 * @lc app=leetcode id=${solution.id} lang=${solution.language}
 *
 * [${solution.title}]
 *
 * Difficulty: ${solution.difficulty}
 * Category: ${solution.tag}
 * 
 * Runtime: ${solution.runtime}
 * Memory Usage: ${solution.memory}
 * 
 * Solved on: ${new Date(solution.timestamp).toISOString().split('T')[0]}
 */

`;

  content += solution.code;

  return content;
}

function getFileExtension(language) {
  const extensions = {
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

async function upsertFile({ token, owner, repo, branch, path, content, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  let sha = null;
  try {
    const getResponse = await fetch(url, {
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
    // File doesn't exist, which is fine
  }

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
      'Authorization': `token ${token}`,
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

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'graphql_question_data':
      const questionData = {
        slug: message.data.slug,
        title: message.data.title,
        difficulty: message.data.difficulty,
        tag: message.data.topicTags?.[0]?.name || message.data.categoryTitle || 'Algorithms',
        categoryTitle: message.data.categoryTitle,
        topicTags: message.data.topicTags
      };
      
      cacheQuestionMeta(questionData);
      
      if (sender.tab?.id) {
        const tabInfo = tabData.get(sender.tab.id);
        if (tabInfo && tabInfo.slug === questionData.slug) {
          tabInfo.metadata = questionData;
          console.log(`[Leet2Git] Updated metadata for tab ${sender.tab.id}: ${questionData.title}`);
        }
      }
      
      sendResponse({ success: true });
      break;

    case 'auth':
      if (message.data && message.data.token) {
        handleAuthVerification(message.data.token, sendResponse);
      } else {
        handleAuth(sendResponse);
      }
      break;

    case 'push':
      handlePush(sendResponse);
      break;

    case 'getHomeData':
      handleGetHomeData(sendResponse);
      break;

    case 'updateConfig':
      handleUpdateConfig(message.payload, sendResponse);
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }

  return true; // Keep message channel open for async response
});