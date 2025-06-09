console.log("Leet2Git background script loaded");

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

chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

async function handleAuthVerification(token, sendResponse) {
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
    const storageData = await chrome.storage.sync.get(['pending', 'auth', 'config']);
    
    const pending = storageData.pending || [];
    if (pending.length === 0) {
      sendResponse({ success: false, error: "No pending solutions to push" });
      return;
    }

    const authData = storageData.auth;
    if (!authData || !authData.token) {
      sendResponse({ success: false, error: "GitHub authentication required" });
      return;
    }

    const config = storageData.config || {
      owner: authData.username,
      repo: 'leetcode-solutions',
      branch: 'main',
      private: false,
      folderStructure: 'topic',
      includeDescription: true,
      includeTestCases: false
    };

    let successCount = 0;
    for (const solution of pending) {
      try {
        await pushSolutionToGitHub(solution, authData, config);
        successCount++;
      } catch (error) {
        console.error(`Failed to push ${solution.title}:`, error);
      }
    }

    await chrome.storage.sync.set({ pending: [] });
    await updateBadge();

    sendResponse({ 
      success: true,
      count: successCount,
      message: `Pushed ${successCount}/${pending.length} solutions`
    });
  } catch (error) {
    console.error("Error handling push:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function pushSolutionToGitHub(solution, auth, config) {
  const fileName = `${solution.title.replace(/[^a-zA-Z0-9]/g, '')}.py`;
  const filePath = config.folderStructure === 'difficulty' ? solution.difficulty : 
                   config.folderStructure === 'topic' ? (solution.tag || 'Algorithms') : '.';
  
  const content = `"""
${solution.title}

Difficulty: ${solution.difficulty}
Category: ${solution.tag}
Runtime: ${solution.runtime}
Memory: ${solution.memory}
"""

${solution.code}
`;

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}/${fileName}`;
  
  const body = {
    message: `Add solution: ${solution.title}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: config.branch || 'main'
  };
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${auth.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "graphql_question_data":
      const meta = {
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
    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
  return true;
});