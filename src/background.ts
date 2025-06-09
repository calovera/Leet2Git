import { ChromeMessage, SolutionPayload, PendingItem, HomeData } from './types/models';
import { 
  getStats, 
  updateStats, 
  getPending, 
  addPending, 
  removePending, 
  clearPending, 
  getAuth, 
  setAuth, 
  getConfig 
} from './utils/storage';
import { 
  upsertFile, 
  generateFilePath, 
  generateFileContent, 
  createRepository,
  verifyToken 
} from './utils/github';

console.log('Leet2Git extension background script loaded');

// Update badge with pending count
async function updateBadge() {
  const pending = await getPending();
  const text = pending.length > 0 ? pending.length.toString() : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Leet2Git extension installed');
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Listen for LeetCode submission API calls
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (details.method === 'GET' && details.statusCode === 200) {
      try {
        // Extract submission ID from URL
        const urlMatch = details.url.match(/\/api\/submissions\/detail\/(\d+)/);
        if (!urlMatch) return;
        
        const submissionId = urlMatch[1];
        
        // Get the response from the tab
        const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
        if (tabs.length === 0) return;
        
        const tabId = tabs[0].id!;
        
        // Inject script to fetch submission details
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: fetchSubmissionDetails,
          args: [submissionId]
        });
        
        if (results[0]?.result) {
          const submissionData = results[0].result;
          if (submissionData.status_display === 'Accepted') {
            await handleAcceptedSubmission(submissionData, tabId);
          }
        }
      } catch (error) {
        console.error('Error processing submission:', error);
      }
    }
  },
  {
    urls: ['https://leetcode.com/api/submissions/detail/*']
  }
);

// Function to be injected into the page
function fetchSubmissionDetails(submissionId: string) {
  return fetch(`https://leetcode.com/api/submissions/detail/${submissionId}/`)
    .then(response => response.json())
    .catch(() => null);
}

chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'auth':
      handleAuth(sendResponse);
      return true;
    
    case 'push':
      handlePush(sendResponse);
      return true;
    
    case 'getHomeData':
      handleGetHomeData(sendResponse);
      return true;
    
    case 'solved_dom':
      handleSolvedFromDOM(message.payload, sendResponse);
      return true;
    
    case 'updateConfig':
      handleUpdateConfig(message.payload, sendResponse);
      return true;
    
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleAcceptedSubmission(submissionData: any, tabId: number) {
  try {
    // Extract problem information from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractProblemInfo
    });
    
    const problemInfo = results[0]?.result;
    if (!problemInfo) return;
    
    const payload: SolutionPayload = {
      id: `${problemInfo.slug}-${submissionData.lang}-${Date.now()}`,
      title: problemInfo.title,
      slug: problemInfo.slug,
      difficulty: problemInfo.difficulty,
      description: problemInfo.description,
      code: submissionData.code,
      language: submissionData.lang,
      timestamp: Date.now(),
      status: submissionData.status_display,
      submissionId: submissionData.id,
      runtime: submissionData.runtime,
      memory: submissionData.memory
    };
    
    // Create pending item
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
    
    // Add to pending and update stats
    await addPending(pendingItem);
    await updateStats({
      id: payload.id,
      title: payload.title,
      language: payload.language,
      difficulty: payload.difficulty,
      timestamp: payload.timestamp
    });
    
    await updateBadge();
    
    console.log('Added solution to pending:', payload.title);
  } catch (error) {
    console.error('Error handling accepted submission:', error);
  }
}

// Function to extract problem info from LeetCode page
function extractProblemInfo() {
  try {
    const titleElement = document.querySelector('[data-cy="question-title"]') || 
                        document.querySelector('.css-v3d350') ||
                        document.querySelector('h1');
    
    const difficultyElement = document.querySelector('[diff]') ||
                             document.querySelector('.css-dcmtd5') ||
                             document.querySelector('[class*="difficulty"]');
    
    const descriptionElement = document.querySelector('[data-track-load="description_content"]') ||
                              document.querySelector('.css-1iinkds') ||
                              document.querySelector('.content__u3I1 .question-content');
    
    const title = titleElement?.textContent?.trim() || '';
    const slug = window.location.pathname.split('/problems/')[1]?.split('/')[0] || '';
    
    let difficulty = 'Medium';
    if (difficultyElement) {
      const diffText = difficultyElement.textContent?.toLowerCase() || '';
      if (diffText.includes('easy')) difficulty = 'Easy';
      else if (diffText.includes('hard')) difficulty = 'Hard';
    }
    
    const description = descriptionElement?.textContent?.trim() || '';
    
    return {
      title,
      slug,
      difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
      description
    };
  } catch (error) {
    console.error('Error extracting problem info:', error);
    return null;
  }
}

async function handleAuth(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.identity.launchWebAuthFlow({
      url: 'https://github.com/login/oauth/authorize?client_id=your_client_id&scope=repo',
      interactive: true
    });
    
    if (result) {
      const code = new URL(result).searchParams.get('code');
      if (code) {
        // Exchange code for token (this would need a server endpoint)
        sendResponse({ success: true, code });
      } else {
        sendResponse({ error: 'No authorization code received' });
      }
    } else {
      sendResponse({ error: 'Authentication cancelled' });
    }
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
}

async function handlePush(sendResponse: (response: any) => void) {
  try {
    const auth = await getAuth();
    if (!auth || !auth.token) {
      sendResponse({ error: 'GitHub not connected' });
      return;
    }
    
    const config = await getConfig();
    if (!config.owner) {
      sendResponse({ error: 'Repository owner not configured' });
      return;
    }
    
    const pending = await getPending();
    if (pending.length === 0) {
      sendResponse({ success: true, results: [] });
      return;
    }
    
    const results = [];
    
    for (const item of pending) {
      try {
        const filePath = generateFilePath(item, config);
        const fileContent = generateFileContent(item, config);
        
        const result = await upsertFile({
          token: auth.token,
          owner: config.owner,
          repo: config.repo,
          branch: config.branch,
          path: filePath,
          content: fileContent,
          message: `Add solution: ${item.title}`
        });
        
        if (result.success) {
          await removePending(item.id);
          results.push({
            item: item.title,
            success: true,
            path: filePath
          });
        } else {
          results.push({
            item: item.title,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        results.push({
          item: item.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    await updateBadge();
    sendResponse({ success: true, results });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Push failed' 
    });
  }
}

async function handleGetHomeData(sendResponse: (response: any) => void) {
  try {
    const stats = await getStats();
    const pending = await getPending();
    const auth = await getAuth();
    const config = await getConfig();
    
    const homeData: HomeData = {
      stats,
      pending,
      auth,
      config
    };
    
    sendResponse({ success: true, data: homeData });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to get home data' 
    });
  }
}

async function handleSolvedFromDOM(payload: any, sendResponse: (response: any) => void) {
  try {
    // Check if already pending
    const pending = await getPending();
    const exists = pending.some(p => p.slug === payload.slug && p.language === payload.language);
    
    if (exists) {
      sendResponse({ success: true, message: 'Already pending' });
      return;
    }
    
    const pendingItem: PendingItem = {
      id: `${payload.slug}-${payload.language}-${Date.now()}`,
      title: payload.title,
      slug: payload.slug,
      language: payload.language,
      difficulty: payload.difficulty,
      code: payload.code,
      timestamp: Date.now(),
      description: payload.description
    };
    
    await addPending(pendingItem);
    await updateStats({
      id: pendingItem.id,
      title: pendingItem.title,
      language: pendingItem.language,
      difficulty: pendingItem.difficulty,
      timestamp: pendingItem.timestamp
    });
    
    await updateBadge();
    sendResponse({ success: true, message: 'Added to pending' });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to handle solved DOM' 
    });
  }
}

async function handleUpdateConfig(config: any, sendResponse: (response: any) => void) {
  try {
    const { setConfig } = await import('./utils/storage');
    await setConfig(config);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to update config' 
    });
  }
}
