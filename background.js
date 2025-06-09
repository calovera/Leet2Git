// Service worker for Leet2Git extension
console.log("Leet2Git extension background script loaded");

// Update badge with pending count
async function updateBadge() {
  const pending = await chrome.storage.local.get("pending");
  const text =
    pending.pending?.length > 0 ? pending.pending.length.toString() : "";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#3B82F6" });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Leet2Git extension installed");
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Listen for LeetCode submission API calls
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (details.method === "GET" && details.statusCode === 200) {
      try {
        // Extract submission ID from URL
        const urlMatch = details.url.match(/\/api\/submissions\/detail\/(\d+)/);
        if (!urlMatch) return;

        const submissionId = urlMatch[1];

        // Get the response from the tab
        const tabs = await chrome.tabs.query({ url: "https://leetcode.com/*" });
        if (tabs.length === 0) return;

        const tabId = tabs[0].id;

        // Inject script to fetch submission details
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: (submissionId) => {
            return fetch(
              `https://leetcode.com/api/submissions/detail/${submissionId}/`
            )
              .then((response) => response.json())
              .catch(() => null);
          },
          args: [submissionId],
        });

        if (results[0]?.result) {
          const submissionData = results[0].result;
          if (submissionData.status_display === "Accepted") {
            await handleAcceptedSubmission(submissionData, tabId);
          }
        }
      } catch (error) {
        console.error("Error processing submission:", error);
      }
    }
  },
  {
    urls: ["https://leetcode.com/api/submissions/detail/*"],
  }
);

async function handleAcceptedSubmission(submissionData, tabId) {
  try {
    // Extract problem information from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const titleElement =
          document.querySelector('[data-cy="question-title"]') ||
          document.querySelector(".css-v3d350") ||
          document.querySelector("h1");

        const difficultyElement =
          document.querySelector("[diff]") ||
          document.querySelector(".css-dcmtd5") ||
          document.querySelector('[class*="difficulty"]');

        const descriptionElement =
          document.querySelector('[data-track-load="description_content"]') ||
          document.querySelector(".css-1iinkds") ||
          document.querySelector(".content__u3I1 .question-content");

        const title = titleElement?.textContent?.trim() || "";
        const slug =
          window.location.pathname.split("/problems/")[1]?.split("/")[0] || "";

        let difficulty = "Medium";
        if (difficultyElement) {
          const diffText = difficultyElement.textContent?.toLowerCase() || "";
          if (diffText.includes("easy")) difficulty = "Easy";
          else if (diffText.includes("hard")) difficulty = "Hard";
        }

        const description = descriptionElement?.textContent?.trim() || "";

        return {
          title,
          slug,
          difficulty,
          description,
        };
      },
    });

    const problemInfo = results[0]?.result;
    if (!problemInfo) return;

    const payload = {
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
      memory: submissionData.memory,
    };

    // Add to pending and update stats
    const { pending = [] } = await chrome.storage.local.get("pending");
    pending.push({
      id: payload.id,
      title: payload.title,
      slug: payload.slug,
      language: payload.language,
      difficulty: payload.difficulty,
      code: payload.code,
      timestamp: payload.timestamp,
      description: payload.description,
      submissionId: payload.submissionId,
    });

    await chrome.storage.local.set({ pending });
    await updateBadge();

    console.log("Added solution to pending:", payload.title);
  } catch (error) {
    console.error("Error handling accepted submission:", error);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "auth":
      handleAuth(sendResponse);
      return true;

    case "push":
      handlePush(sendResponse);
      return true;

    case "getHomeData":
      handleGetHomeData(sendResponse);
      return true;

    case "solved_dom":
      handleSolvedFromDOM(message.payload, sendResponse);
      return true;

    case "updateConfig":
      handleUpdateConfig(message.payload, sendResponse);
      return true;

    default:
      sendResponse({ error: "Unknown message type" });
  }
});

async function handleAuth(sendResponse) {
  try {
    const result = await chrome.identity.launchWebAuthFlow({
      url: "https://github.com/login/oauth/authorize?client_id=your_client_id&scope=repo",
      interactive: true,
    });

    if (result) {
      const code = new URL(result).searchParams.get("code");
      if (code) {
        sendResponse({ success: true, code });
      } else {
        sendResponse({ error: "No authorization code received" });
      }
    } else {
      sendResponse({ error: "Authentication cancelled" });
    }
  } catch (error) {
    sendResponse({
      error: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}

async function handlePush(sendResponse) {
  try {
    const { auth } = await chrome.storage.local.get("auth");
    if (!auth || !auth.token) {
      sendResponse({ error: "GitHub not connected" });
      return;
    }

    const { config } = await chrome.storage.local.get("config");
    if (!config.owner) {
      sendResponse({ error: "Repository owner not configured" });
      return;
    }

    const { pending = [] } = await chrome.storage.local.get("pending");
    if (pending.length === 0) {
      sendResponse({ error: "No pending solutions" });
      return;
    }

    // TODO: Implement GitHub push logic

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function handleGetHomeData(sendResponse) {
  try {
    const [stats, pending, auth, config] = await Promise.all([
      chrome.storage.local.get("stats"),
      chrome.storage.local.get("pending"),
      chrome.storage.local.get("auth"),
      chrome.storage.local.get("config"),
    ]);

    sendResponse({
      stats: stats.stats || {},
      pending: pending.pending || [],
      auth: auth.auth || null,
      config: config.config || {},
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function handleSolvedFromDOM(payload, sendResponse) {
  try {
    const { pending = [] } = await chrome.storage.local.get("pending");
    pending.push(payload);
    await chrome.storage.local.set({ pending });
    await updateBadge();

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function handleUpdateConfig(config, sendResponse) {
  try {
    await chrome.storage.local.set({ config });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}
