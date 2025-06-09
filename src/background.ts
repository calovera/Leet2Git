chrome.runtime.onInstalled.addListener(() => {
  console.log('Leet2Git extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GITHUB_AUTH':
      handleGitHubAuth(message.code, sendResponse);
      return true; // Keep message channel open for async response

    case 'SYNC_SOLUTIONS':
      handleSyncSolutions(sendResponse);
      return true;

    case 'CHECK_LEETCODE_STATUS':
      checkLeetCodeStatus(sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleGitHubAuth(code: string, sendResponse: (response: any) => void) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID || 'your_github_client_id';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret';
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await response.json();
    
    if (data.access_token) {
      // Store the access token securely
      await chrome.storage.local.set({ 
        github_token: data.access_token 
      });

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${data.access_token}`,
        },
      });

      const userData = await userResponse.json();
      
      await chrome.storage.local.set({
        github_user: {
          username: userData.login,
          email: userData.email,
          connected: true
        }
      });

      sendResponse({ success: true, user: userData });
    } else {
      sendResponse({ error: 'Failed to get access token' });
    }
  } catch (error) {
    sendResponse({ error: error instanceof Error ? error.message : 'Authentication failed' });
  }
}

async function handleSyncSolutions(sendResponse: (response: any) => void) {
  try {
    // Get GitHub token
    const { github_token } = await chrome.storage.local.get(['github_token']);
    if (!github_token) {
      sendResponse({ error: 'GitHub not connected' });
      return;
    }

    // Get LeetCode submissions from content script
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    if (tabs.length === 0) {
      sendResponse({ error: 'No LeetCode tab found' });
      return;
    }

    const submissions = await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'GET_SUBMISSIONS'
    });

    if (!submissions || submissions.length === 0) {
      sendResponse({ error: 'No submissions found' });
      return;
    }

    // Sync each submission to GitHub
    const syncResults = [];
    for (const submission of submissions) {
      try {
        const result = await syncSubmissionToGitHub(submission, github_token);
        syncResults.push({ submission: submission.title, success: true, result });
      } catch (error) {
        syncResults.push({ 
          submission: submission.title, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    sendResponse({ success: true, results: syncResults });
  } catch (error) {
    sendResponse({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
}

async function syncSubmissionToGitHub(submission: any, token: string) {
  const repoName = 'leetcode-solutions';
  const filePath = `${submission.difficulty}/${submission.title.replace(/\s+/g, '-').toLowerCase()}.${submission.language === 'JavaScript' ? 'js' : submission.language === 'Python' ? 'py' : 'cpp'}`;
  
  // Check if repo exists, create if not
  const repoResponse = await fetch(`https://api.github.com/repos/${submission.username}/${repoName}`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });

  if (repoResponse.status === 404) {
    // Create repository
    const settings = await chrome.storage.local.get(['settings']);
    await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: 'Automated LeetCode solutions sync via Leet2Git extension',
        private: settings.settings?.privateRepo || false,
        auto_init: true,
      }),
    });
  }

  // Create or update file
  const fileContent = generateFileContent(submission);
  const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

  // Check if file exists
  const fileResponse = await fetch(`https://api.github.com/repos/${submission.username}/${repoName}/contents/${filePath}`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });

  const method = fileResponse.status === 404 ? 'PUT' : 'PUT';
  const body: any = {
    message: `Add solution: ${submission.title}`,
    content: encodedContent,
  };

  if (fileResponse.status !== 404) {
    const fileData = await fileResponse.json();
    body.sha = fileData.sha;
  }

  const response = await fetch(`https://api.github.com/repos/${submission.username}/${repoName}/contents/${filePath}`, {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync ${submission.title}: ${response.statusText}`);
  }

  return await response.json();
}

function generateFileContent(submission: any): string {
  const { title, difficulty, description, code, language, testCases } = submission;
  
  let content = `/*\n * ${title}\n * Difficulty: ${difficulty}\n * \n * ${description}\n */\n\n`;
  
  content += code;
  
  if (testCases && testCases.length > 0) {
    content += '\n\n/*\n * Test Cases:\n';
    testCases.forEach((testCase: any, index: number) => {
      content += ` * ${index + 1}. Input: ${testCase.input}, Expected: ${testCase.output}\n`;
    });
    content += ' */';
  }
  
  return content;
}

async function checkLeetCodeStatus(sendResponse: (response: any) => void) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    if (tabs.length === 0) {
      sendResponse({ connected: false, error: 'No LeetCode tab found' });
      return;
    }

    const result = await chrome.tabs.sendMessage(tabs[0].id!, {
      type: 'CHECK_LOGIN_STATUS'
    });

    sendResponse(result);
  } catch (error) {
    sendResponse({ 
      connected: false, 
      error: error instanceof Error ? error.message : 'Failed to check LeetCode status' 
    });
  }
}

// Auto-sync functionality
chrome.storage.local.get(['settings'], (result) => {
  if (result.settings?.autoSync) {
    // Set up periodic sync (every 30 minutes)
    chrome.alarms.create('autoSync', { periodInMinutes: 30 });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoSync') {
    handleSyncSolutions((response) => {
      console.log('Auto-sync completed:', response);
    });
  }
});
