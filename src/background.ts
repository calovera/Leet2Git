// Leet2Git Background Script - Comprehensive TypeScript Implementation
console.log("Leet2Git background script loaded");

// Types
interface TabData {
  slug: string;
  metadata: QuestionMetadata | null;
  submissionCode: string | null;
}

interface QuestionMetadata {
  slug: string;
  title: string;
  difficulty: string;
  tag: string;
  categoryTitle?: string;
  topicTags?: Array<{ name: string }>;
}

interface CodeRecord {
  code: string;
  lang: string;
  question_id: string;
  timestamp: number;
}

interface SolutionPayload {
  id: string;
  submissionId: string;
  title: string;
  slug: string;
  difficulty: string;
  tag: string;
  code: string;
  language: string;
  runtime: string;
  memory: string;
  timestamp: number;
}

interface ChromeMessage {
  type: string;
  data?: any;
  payload?: any;
}

interface GitHubAuth {
  token: string;
  username: string;
  email: string;
  connected: boolean;
}

interface RepoCfg {
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: 'difficulty' | 'topic' | 'flat';
  includeDescription: boolean;
  includeTestCases: boolean;
}

interface PendingItem {
  id: string;
  title: string;
  slug: string;
  language: string;
  difficulty: string;
  code: string;
  timestamp: number;
  description?: string;
  submissionId: string;
}

interface HomeData {
  stats: {
    streak: number;
    counts: { easy: number; medium: number; hard: number };
    recentSolves: Array<{
      id: string;
      title: string;
      language: string;
      difficulty: string;
      timestamp: number;
    }>;
  };
  pending: PendingItem[];
  auth: GitHubAuth | null;
  config: RepoCfg;
}

// Storage maps
const tabData = new Map<number, TabData>();
const questionCache = new Map<string, QuestionMetadata>();
const tempCodeStorage = new Map<string, CodeRecord>();
const recentSubmissions = new Map<string, number>();

// Helper functions
function parseQuestionMeta(res: any): QuestionMetadata | null {
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

function cacheQuestionMeta(meta: QuestionMetadata): void {
  questionCache.set(meta.slug, meta);
  console.log(`[Leet2Git] Question meta cached: ${meta.slug}`);
}

function getQuestionMeta(slug: string): QuestionMetadata | null {
  return questionCache.get(slug) || null;
}

function toPascalCase(str: string): string {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

async function updateBadge(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(['pending', 'auth']);
    const pending = result.pending || [];
    const auth = result.auth;
    
    // Only show badge if user is authenticated
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

// Capture code from submit requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === 'POST' && details.requestBody && details.requestBody.raw) {
      try {
        const rawData = details.requestBody.raw[0].bytes;
        const decoder = new TextDecoder();
        const bodyText = decoder.decode(rawData);
        const submitData = JSON.parse(bodyText);
        
        if (submitData.typed_code && submitData.lang && submitData.question_id) {
          const codeRecord: CodeRecord = {
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
  { urls: ['*://leetcode.com/problems/*/submit/'] },
  ['requestBody']
);

// Track tab navigation
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

chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
  console.log(`[Leet2Git] Cleaned up data for closed tab ${tabId}`);
});

// Extension initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Process accepted submissions
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200 || !details.tabId) return;
  
  const urlMatch = details.url.match(/\/submissions\/detail\/(\d+)\/check\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.log(`[Leet2Git] Intercepted submission check: ${submissionId}`);
  
  try {
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.status_msg !== "Accepted") {
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
    const problemSlug = tabInfo?.slug || extractSlugFromData(data);
    
    if (!problemSlug) {
      console.warn(`[Leet2Git] Could not determine problem slug`);
      return;
    }
    
    const metadata = getQuestionMeta(problemSlug);
    
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
    
    tempCodeStorage.delete(questionId);
    
    const storageResult = await chrome.storage.sync.get(['pending', 'solvedSlugs']);
    const pending = storageResult.pending || [];
    const solvedSlugs = new Set(storageResult.solvedSlugs || []);
    
    const recentKey = `${problemSlug}-${codeRecord.lang}`;
    const now = Date.now();
    const recentTimestamp = recentSubmissions.get(recentKey);
    
    if (recentTimestamp && (now - recentTimestamp) < 300000) {
      console.log(`[Leet2Git] Ignoring duplicate submission within 5 minutes`);
      return;
    }
    
    pending.push(solutionPayload);
    recentSubmissions.set(recentKey, now);
    
    if (!solvedSlugs.has(problemSlug)) {
      solvedSlugs.add(problemSlug);
      await updateStats(solutionPayload);
      console.log(`[Leet2Git] Updated stats for new problem: ${problemSlug}`);
    } else {
      console.log(`[Leet2Git] Problem already solved, stats unchanged: ${problemSlug}`);
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
}, {
  urls: ["https://leetcode.com/submissions/detail/*/check/"]
});

function extractSlugFromData(data: any): string | null {
  return data.titleSlug || data.question_slug || null;
}

async function updateStats(solution: SolutionPayload): Promise<void> {
  try {
    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = await chrome.storage.sync.get("stats");
    
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

async function handleAuthVerification(token: string, sendResponse: (response: any) => void): Promise<void> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      sendResponse({ success: false, error: 'Invalid GitHub token' });
      return;
    }

    const userData = await response.json();
    
    const authData: GitHubAuth = {
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

async function handleAuth(sendResponse: (response: any) => void): Promise<void> {
  try {
    const data = await chrome.storage.sync.get(['github_token', 'github_user', 'auth']);
    
    let authData: GitHubAuth | null = null;
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
    sendResponse({ success: false, error: (error as Error).message });
  }
}

chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  switch (message.type) {
    case "graphql_question_data":
      const meta: QuestionMetadata = {
        slug: message.data.slug,
        title: message.data.title,
        difficulty: message.data.difficulty,
        tag: message.data.topicTags?.[0]?.name || message.data.categoryTitle || "Algorithms",
        categoryTitle: message.data.categoryTitle,
        topicTags: message.data.topicTags
      };
      
      cacheQuestionMeta(meta);
      
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
    case "solved_dom":
      handleSolvedFromDOM(message.payload, sendResponse);
      break;
    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
  return true;
});

async function handlePush(sendResponse: (response: any) => void): Promise<void> {
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

    let config: RepoCfg;
    if (storageData.config) {
      config = storageData.config;
    } else {
      config = {
        owner: storageData.owner || authData.username,
        repo: storageData.repo || 'leetcode-solutions',
        branch: storageData.branch || 'main',
        private: false,
        folderStructure: 'topic',
        includeDescription: true,
        includeTestCases: false
      };
    }

    const results: Array<{ success: boolean; title: string; error?: string }> = [];
    for (const solution of pending) {
      try {
        await pushSolutionToGitHub(solution, authData, config);
        results.push({ success: true, title: solution.title });
      } catch (error) {
        console.error(`Failed to push ${solution.title}:`, error);
        results.push({ success: false, title: solution.title, error: (error as Error).message });
      }
    }

    await chrome.storage.sync.set({ pending: [] });
    await updateBadge();

    sendResponse({ 
      success: true, 
      results,
      message: `Pushed ${results.filter(r => r.success).length}/${results.length} solutions` 
    });
  } catch (error) {
    console.error("Error handling push:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

async function handleGetHomeData(sendResponse: (response: any) => void): Promise<void> {
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
    sendResponse({ success: false, error: (error as Error).message });
  }
}

async function handleSolvedFromDOM(payload: any, sendResponse: (response: any) => void): Promise<void> {
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
    sendResponse({ success: false, error: (error as Error).message });
  }
}

async function handleUpdateConfig(config: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    await chrome.storage.sync.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

async function ensureRepositoryExists(token: string, config: RepoCfg): Promise<void> {
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

async function pushSolutionToGitHub(solution: SolutionPayload, auth: GitHubAuth, config: RepoCfg): Promise<{ success: boolean }> {
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

function generateFileName(solution: SolutionPayload): string {
  const extension = getFileExtension(solution.language);
  const cleanTitle = solution.title.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanTitle}.${extension}`;
}

function generateFilePath(solution: SolutionPayload, config: RepoCfg): string {
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

function generateFileContent(solution: SolutionPayload, config: RepoCfg): string {
  let content = '';
  
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

function getFileExtension(language: string): string {
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

async function upsertFile({ token, owner, repo, branch, path, content, message }: any): Promise<{ success: boolean }> {
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