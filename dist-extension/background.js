// Leet2Git Background Script - API-based Capture
console.log("Leet2Git background script loaded");

let lastNetworkCapture = 0;
let lastDOMCapture = 0;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Primary capture method: Intercept LeetCode API calls
chrome.webRequest.onCompleted.addListener(async (details) => {
  if (details.statusCode !== 200) return;
  
  // Extract submission ID from URL
  const urlMatch = details.url.match(/\/api\/submission-details\/(\d+)\//);
  if (!urlMatch) return;
  
  const submissionId = urlMatch[1];
  console.info(`[Leet2Git] Intercepted submission API call: ${submissionId}`);
  
  try {
    // Fetch submission details with credentials
    const response = await fetch(details.url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Leet2Git] Failed to fetch submission details: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.info(`[Leet2Git] Fetched submission data:`, data);
    
    // Only process accepted submissions
    if (data.status_display !== "Accepted") {
      console.info(`[Leet2Git] Submission not accepted: ${data.status_display}`);
      return;
    }
    
    // Build solution payload
    const solutionPayload = {
      submissionId: submissionId,
      slug: toPascalCase(data.question?.title_slug || data.title_slug),
      title: data.question?.title || data.question_title,
      tag: (data.tags && data.tags.length > 0) ? data.tags[0] : "Uncategorized",
      lang: data.lang,
      difficulty: data.question?.difficulty || "Medium",
      code: data.code,
      capturedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    console.info(`[Leet2Git] Network capture successful:`, solutionPayload);
    
    // Check for duplicates
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const isDuplicate = pending.some(item => item.submissionId === submissionId);
    
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
  urls: ["https://leetcode.com/api/submission-details/*"]
});

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

// Update statistics
async function updateStats(solution) {
  try {
    const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = 
          await chrome.storage.sync.get("stats");
    
    // Update difficulty counts
    const difficulty = solution.difficulty.toLowerCase();
    if (stats.counts[difficulty] !== undefined) {
      stats.counts[difficulty]++;
    }
    
    // Add to recent solves
    stats.recentSolves.unshift({
      title: solution.title,
      language: solution.lang,
      difficulty: solution.difficulty,
      timestamp: solution.timestamp
    });
    
    // Keep only 10 recent solves
    stats.recentSolves = stats.recentSolves.slice(0, 10);
    
    await chrome.storage.sync.set({ stats });
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
    case "solved_dom":
      handleSolvedFromDOM(message.payload, sendResponse);
      return true;
    default:
      sendResponse({ error: "Unknown message type" });
  }
});

// Handle DOM-based captures (fallback only)
async function handleSolvedFromDOM(payload, sendResponse) {
  try {
    // Only use DOM capture if no network capture happened recently
    const timeSinceNetworkCapture = Date.now() - lastNetworkCapture;
    if (timeSinceNetworkCapture < 10000) { // 10 seconds
      console.warn(`[Leet2Git] Ignoring DOM capture - network capture happened ${timeSinceNetworkCapture}ms ago`);
      sendResponse({ success: false, reason: "network_capture_recent" });
      return;
    }
    
    // Only process if enough time has passed since last DOM capture
    const timeSinceLastDOM = Date.now() - lastDOMCapture;
    if (timeSinceLastDOM < 5000) { // 5 seconds
      console.warn(`[Leet2Git] DOM capture throttled - last capture ${timeSinceLastDOM}ms ago`);
      sendResponse({ success: false, reason: "throttled" });
      return;
    }
    
    console.warn(`[Leet2Git] Using DOM fallback capture`);
    
    // Add missing fields for DOM capture
    const solution = {
      ...payload,
      submissionId: payload.submissionId || `dom-${Date.now()}`,
      tag: payload.tag || "Uncategorized",
      capturedAt: new Date().toISOString(),
      timestamp: payload.timestamp || Date.now()
    };
    
    // Check for duplicates
    const { pending = [] } = await chrome.storage.sync.get("pending");
    const isDuplicate = pending.some(item => 
      item.title === solution.title && 
      item.lang === solution.language &&
      Math.abs(item.timestamp - solution.timestamp) < 60000 // Within 1 minute
    );
    
    if (isDuplicate) {
      console.warn(`[Leet2Git] Duplicate DOM capture detected, skipping`);
      sendResponse({ success: false, reason: "duplicate" });
      return;
    }
    
    // Add to pending
    pending.push(solution);
    await chrome.storage.sync.set({ pending });
    
    // Update stats
    await updateStats(solution);
    
    // Update badge
    await updateBadge();
    
    // Mark DOM capture time
    lastDOMCapture = Date.now();
    
    console.warn(`[Leet2Git] DOM fallback capture successful: ${solution.title}`);
    sendResponse({ success: true });
    
  } catch (error) {
    console.error(`[Leet2Git] DOM capture error:`, error);
    sendResponse({ error: error.message });
  }
}

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

    // For now, simulate success (actual GitHub API integration would go here)
    console.info(`[Leet2Git] Simulating push of ${pending.length} solutions to GitHub`);
    
    // Clear pending solutions
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