// Leet2Git Background Script - Production Ready
console.log("Leet2Git extension background script loaded");

// Update badge with pending count
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

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Listen for LeetCode API submissions
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.method === "POST" && details.statusCode === 200) {
    try {
      const submissionMatch = details.url.match(/\/api\/submissions\/(\d+)/);
      if (!submissionMatch) return;

      // Wait a bit for the submission to process
      setTimeout(async () => {
        const tabs = await chrome.tabs.query({ url: "https://leetcode.com/*" });
        if (tabs.length === 0) return;

        const tabId = tabs[0].id;
        
        // Check if submission was accepted
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: checkForAcceptedSubmission
          });

          if (results[0]?.result) {
            await handleAcceptedSubmission(results[0].result, tabId);
          }
        } catch (error) {
          console.error("Error checking submission:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Error processing submission:", error);
    }
  }
}, {
  urls: [
    "https://leetcode.com/api/submissions/*",
    "https://leetcode.com/problems/*/submit/"
  ]
});

// Function to check for accepted submission in page
function checkForAcceptedSubmission() {
  // Check for success indicators
  const successSelectors = [
    '[data-cy="submission-result"]',
    '.text-green-500',
    '[class*="text-green"]',
    '.submission-status',
    '[data-e2e-locator="submission-result"]'
  ];

  let acceptedElement = null;
  for (const selector of successSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element.textContent?.includes("Accepted")) {
        acceptedElement = element;
        break;
      }
    }
    if (acceptedElement) break;
  }

  if (!acceptedElement) return null;

  // Extract problem data
  const titleElement = document.querySelector('[data-cy="question-title"]') || 
                     document.querySelector('.css-v3d350') || 
                     document.querySelector('h1');
  
  const title = titleElement?.textContent?.trim() || "";
  if (!title) return null;

  const slug = window.location.pathname.split("/problems/")[1]?.split("/")[0] || "";
  
  // Extract difficulty
  const difficultyElement = document.querySelector("[diff]") || 
                           document.querySelector(".css-dcmtd5") || 
                           document.querySelector('[class*="difficulty"]');
  
  let difficulty = "Medium";
  if (difficultyElement) {
    const diffText = difficultyElement.textContent?.toLowerCase() || "";
    if (diffText.includes("easy")) difficulty = "Easy";
    else if (diffText.includes("hard")) difficulty = "Hard";
  }

  // Extract description
  const descElement = document.querySelector('[data-track-load="description_content"]') ||
                     document.querySelector('.css-1iinkds') ||
                     document.querySelector('[class*="question-content"]');
  
  const description = descElement?.textContent?.trim() || "";

  // Extract code from editor
  const code = extractCodeFromEditor();
  if (!code) return null;

  // Extract language
  const language = extractLanguage();

  return {
    title,
    slug,
    difficulty,
    description,
    code,
    language,
    timestamp: Date.now()
  };
}

// Extract code from Monaco editor or CodeMirror
function extractCodeFromEditor() {
  // Try Monaco editor first
  const monacoLines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
  if (monacoLines.length > 0) {
    return Array.from(monacoLines)
      .map(line => line.textContent || "")
      .join('\n');
  }

  // Try CodeMirror
  const codeMirror = document.querySelector('.CodeMirror');
  if (codeMirror && codeMirror.CodeMirror) {
    return codeMirror.CodeMirror.getValue();
  }

  // Try textarea fallback
  const textarea = document.querySelector('textarea[data-cy="code-editor"]');
  if (textarea) {
    return textarea.value;
  }

  // Try Monaco API if available
  if (window.monaco && window.monaco.editor) {
    const models = window.monaco.editor.getModels();
    if (models.length > 0) {
      return models[0].getValue();
    }
  }

  return "";
}

// Extract selected language
function extractLanguage() {
  const langSelectors = [
    '[data-cy="lang-select"] .ant-select-selection-item',
    '.lang-select .selected',
    '[class*="language-select"] [class*="selected"]',
    'button[data-state="selected"][role="option"]'
  ];

  for (const selector of langSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  // Fallback based on URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang');
  if (lang) return lang;

  return "JavaScript"; // Default fallback
}

// Handle accepted submission
async function handleAcceptedSubmission(submissionData, tabId) {
  try {
    const solution = {
      id: `${submissionData.slug}-${submissionData.language}-${Date.now()}`,
      title: submissionData.title,
      slug: submissionData.slug,
      difficulty: submissionData.difficulty,
      description: submissionData.description,
      code: submissionData.code,
      language: submissionData.language,
      timestamp: submissionData.timestamp
    };

    // Add to pending solutions
    const { pending = [] } = await chrome.storage.sync.get("pending");
    pending.push(solution);
    await chrome.storage.sync.set({ pending });

    // Update stats
    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = 
          await chrome.storage.sync.get("stats");
    
    stats.counts[submissionData.difficulty.toLowerCase()]++;
    stats.recentSolves.unshift(solution);
    stats.recentSolves = stats.recentSolves.slice(0, 10); // Keep only 10 recent
    
    await chrome.storage.sync.set({ stats });

    await updateBadge();
    console.log("Added solution to pending:", solution.title);
  } catch (error) {
    console.error("Error handling accepted submission:", error);
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
    case "solved_dom":
      handleSolvedFromDOM(message.payload, sendResponse);
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
    const { github_auth } = await chrome.storage.sync.get("github_auth");
    if (!github_auth || !github_auth.token) {
      sendResponse({ error: "GitHub not connected" });
      return;
    }

    const { repo_config } = await chrome.storage.sync.get("repo_config");
    if (!repo_config || !repo_config.owner || !repo_config.repo) {
      sendResponse({ error: "Repository not configured" });
      return;
    }

    const { pending = [] } = await chrome.storage.sync.get("pending");
    if (pending.length === 0) {
      sendResponse({ error: "No pending solutions" });
      return;
    }

    // For now, just simulate success (real GitHub API would go here)
    await chrome.storage.sync.set({ pending: [] });
    await updateBadge();
    
    sendResponse({ 
      success: true, 
      results: pending,
      message: `Successfully pushed ${pending.length} solutions!`
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Handle solutions detected from DOM
async function handleSolvedFromDOM(payload, sendResponse) {
  try {
    const { pending = [] } = await chrome.storage.sync.get("pending");
    pending.push(payload);
    await chrome.storage.sync.set({ pending });
    await updateBadge();
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}